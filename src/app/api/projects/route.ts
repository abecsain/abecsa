import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  const whereClause: {
    status?: string;
    managerId?: string;
    members?: { some: { userId: string } };
    customerId?: string;
  } = {};
  if (statusFilter) whereClause.status = statusFilter;

  // Role-based visibility isolation:
  if (sessionUser.effectiveRole === "CUSTOMER") {
    if (!sessionUser.customerProfile) {
      return NextResponse.json({ projects: [] });
    }
    whereClause.customerId = sessionUser.customerProfile.id;
  } else if (sessionUser.effectiveRole === "ENGINEER") {
    whereClause.members = {
      some: { userId: sessionUser.id },
    };
  } else if (sessionUser.effectiveRole === "MANAGER") {
    // Show projects managed by this manager or where they are assigned
    whereClause.managerId = sessionUser.id;
  }
  // ADMIN has full visibility (whereClause has no restrictions)

  const projects = await prisma.project.findMany({
    where: whereClause,
    orderBy: { updatedAt: "desc" },
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
          user: { select: { name: true, email: true, phone: true } },
        },
      },
      manager: {
        select: { id: true, name: true, email: true, phone: true },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignedTo: { select: { id: true, name: true } },
        },
      },
      milestones: {
        orderBy: { order: "asc" },
      },
      _count: {
        select: { tasks: true, files: true, supportTickets: true },
      },
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const {
      name,
      customerId,
      managerId,
      serviceCategory,
      budget,
      priority,
      status,
      startDate,
      deliveryDate,
      techStack,
      description,
      requirements,
      stagingUrl,
      repoUrl,
      engineerIds,
    } = data;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Resolve target customer with defensive fallback
    let targetCustomerId = customerId && customerId.trim() !== "" ? customerId : null;
    if (!targetCustomerId) {
      const firstCustomer = await prisma.customerProfile.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (firstCustomer) {
        targetCustomerId = firstCustomer.id;
      } else {
        // Fallback: check if any customer user exists or create default customer
        const custUser = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
        if (custUser) {
          const newProfile = await prisma.customerProfile.create({
            data: {
              userId: custUser.id,
              companyName: "Enterprise Client Corp",
              businessType: "Commercial Enterprise",
            },
          });
          targetCustomerId = newProfile.id;
        } else {
          return NextResponse.json(
            { error: "No customer account found. Please create a customer first." },
            { status: 400 }
          );
        }
      }
    }

    const count = await prisma.project.count();
    const projectId = `PRJ-2026-${String(count + 101).padStart(3, "0")}`;

    const newProject = await prisma.project.create({
      data: {
        projectId,
        name: name.trim(),
        description: description || "Enterprise software development project.",
        customerId: targetCustomerId,
        managerId: managerId || sessionUser.id,
        serviceCategory: serviceCategory || "Custom Software Development",
        budget: Number(budget || 0),
        priority: priority || "MEDIUM",
        status: status || "PLANNING",
        startDate: startDate ? new Date(startDate) : new Date(),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        techStack: techStack || "Next.js, TypeScript, PostgreSQL",
        requirements,
        stagingUrl,
        repoUrl,
        progress: 0,
      },
    });

    // Create root folder for this project
    await prisma.folder.create({
      data: {
        name: `${name.trim()} Documents`,
        projectId: newProject.id,
        customerId: targetCustomerId,
        createdById: sessionUser.id,
        isCustomerVisible: true,
      },
    });

    // Assign project members
    const membersToCreate: Array<{ projectId: string; userId: string; role: string }> = [];

    // Add manager
    if (newProject.managerId) {
      membersToCreate.push({
        projectId: newProject.id,
        userId: newProject.managerId,
        role: "MANAGER",
      });
    }

    // Add engineers
    if (Array.isArray(engineerIds)) {
      for (const engId of engineerIds) {
        if (!membersToCreate.some((m) => m.userId === engId)) {
          membersToCreate.push({
            projectId: newProject.id,
            userId: engId,
            role: "ENGINEER",
          });
        }
      }
    }

    if (membersToCreate.length > 0) {
      await prisma.projectMember.createMany({
        data: membersToCreate,
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: "CREATE_PROJECT",
        entityType: "PROJECT",
        entityId: newProject.id,
        details: `Project ${projectId} (${name}) created by ${sessionUser.name}`,
      },
    });

    return NextResponse.json({ success: true, project: newProject });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const {
      id,
      name,
      description,
      status,
      priority,
      budget,
      deliveryDate,
      startDate,
      techStack,
      progress,
      serviceCategory,
      managerId,
      customerId,
      stagingUrl,
      repoUrl,
      engineerIds,
    } = data;

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (sessionUser.effectiveRole === "MANAGER" && project.managerId !== sessionUser.id) {
      return NextResponse.json({ error: "Managers can only update projects assigned to them" }, { status: 403 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (budget !== undefined) updateData.budget = Number(budget);
    if (deliveryDate) updateData.deliveryDate = new Date(deliveryDate);
    if (startDate) updateData.startDate = new Date(startDate);
    if (techStack !== undefined) updateData.techStack = techStack;
    if (progress !== undefined) updateData.progress = Math.min(100, Math.max(0, Number(progress)));
    if (serviceCategory) updateData.serviceCategory = serviceCategory;
    if (managerId) updateData.managerId = managerId;
    if (customerId) updateData.customerId = customerId;
    if (stagingUrl !== undefined) updateData.stagingUrl = stagingUrl;
    if (repoUrl !== undefined) updateData.repoUrl = repoUrl;

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    // Update engineer squad if provided
    if (Array.isArray(engineerIds)) {
      await prisma.projectMember.deleteMany({
        where: { projectId: id, role: "ENGINEER" },
      });
      if (engineerIds.length > 0) {
        await prisma.projectMember.createMany({
          data: engineerIds.map((engId: string) => ({
            projectId: id,
            userId: engId,
            role: "ENGINEER",
          })),
        });
      }
    }

    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (sessionUser.effectiveRole === "MANAGER" && project.managerId !== sessionUser.id) {
      return NextResponse.json({ error: "Managers can only delete projects they manage" }, { status: 403 });
    }

    // Cascade delete relations
    await prisma.taskChecklist.deleteMany({
      where: { task: { projectId: id } },
    });
    await prisma.taskComment.deleteMany({
      where: { task: { projectId: id } },
    });
    await prisma.task.deleteMany({ where: { projectId: id } });
    await prisma.milestone.deleteMany({ where: { projectId: id } });
    await prisma.projectMember.deleteMany({ where: { projectId: id } });
    await prisma.file.deleteMany({ where: { projectId: id } });
    await prisma.folder.deleteMany({ where: { projectId: id } });
    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
