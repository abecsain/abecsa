import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { safeErrorResponse } from "@/lib/security";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        customer: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        manager: { select: { id: true, name: true, email: true, phone: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        tasks: { include: { assignedTo: { select: { id: true, name: true } }, checklists: true } },
        milestones: true,
        files: { where: sessionUser.effectiveRole === "CUSTOMER" ? { isCustomerVisible: true } : undefined },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Strict IDOR Protection:
    // 1. Customer can only access projects belonging to their verified CustomerProfile
    if (sessionUser.effectiveRole === "CUSTOMER") {
      if (!sessionUser.customerProfile || project.customerId !== sessionUser.customerProfile.id) {
        return NextResponse.json({ error: "Forbidden: Access to this project is denied" }, { status: 403 });
      }
    }

    // 2. Engineer can only access projects where they are assigned as a member
    if (sessionUser.effectiveRole === "ENGINEER") {
      const isMember = project.members.some((m) => m.userId === sessionUser.id);
      if (!isMember) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this project" }, { status: 403 });
      }
    }

    // 3. Manager can only access projects assigned to them (unless actual ADMIN)
    if (sessionUser.effectiveRole === "MANAGER" && sessionUser.actualRole !== "ADMIN") {
      if (project.managerId !== sessionUser.id) {
        return NextResponse.json({ error: "Forbidden: You are not the manager for this project" }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    return safeErrorResponse(error, "Failed to fetch project details");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Ownership check for Managers
    if (sessionUser.effectiveRole === "MANAGER" && sessionUser.actualRole !== "ADMIN") {
      if (project.managerId !== sessionUser.id) {
        return NextResponse.json({ error: "Forbidden: Managers can only update projects assigned to them" }, { status: 403 });
      }
    }

    const data = await req.json();
    const updateData: any = {};
    if (typeof data.name === "string" && data.name.trim()) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = typeof data.description === "string" ? data.description.trim() : null;
    if (typeof data.status === "string") updateData.status = data.status;
    if (typeof data.priority === "string") updateData.priority = data.priority;
    if (data.budget !== undefined && !isNaN(Number(data.budget))) updateData.budget = Number(data.budget);
    if (data.deliveryDate) updateData.deliveryDate = new Date(data.deliveryDate);
    if (data.progress !== undefined && !isNaN(Number(data.progress))) {
      updateData.progress = Math.min(100, Math.max(0, Number(data.progress)));
    }
    if (typeof data.serviceCategory === "string") updateData.serviceCategory = data.serviceCategory;
    if (data.managerId && sessionUser.actualRole === "ADMIN") updateData.managerId = data.managerId;
    if (data.customerId && sessionUser.actualRole === "ADMIN") updateData.customerId = data.customerId;
    if (data.techStack !== undefined) updateData.techStack = typeof data.techStack === "string" ? data.techStack : JSON.stringify(data.techStack);

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    if (Array.isArray(data.engineerIds)) {
      await prisma.projectMember.deleteMany({
        where: { projectId: id, role: "ENGINEER" },
      });
      if (data.engineerIds.length > 0) {
        await prisma.projectMember.createMany({
          data: data.engineerIds.map((engId: string) => ({
            projectId: id,
            userId: engId,
            role: "ENGINEER",
          })),
        });
      }
    }

    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    return safeErrorResponse(error, "Failed to update project");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (sessionUser.effectiveRole === "MANAGER" && sessionUser.actualRole !== "ADMIN") {
      if (project.managerId !== sessionUser.id) {
        return NextResponse.json({ error: "Forbidden: Managers can only delete projects they manage" }, { status: 403 });
      }
    }

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

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: "DELETE_PROJECT",
        entityType: "PROJECT",
        entityId: id,
        details: `Deleted project ${project.name} (${project.projectId}) by ${sessionUser.name}`,
      },
    });

    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    return safeErrorResponse(error, "Failed to delete project");
  }
}
