import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get("role");

  const whereClause: {
    role?: string;
  } = {};
  if (roleFilter) whereClause.role = roleFilter;

  // If Manager, they can view engineers and customers, but not other admin/managers confidential data
  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      status: true,
      department: true,
      jobTitle: true,
      hourlyRate: sessionUser.effectiveRole === "ADMIN", // Admin only for rate
      createdAt: true,
      customerProfile: true,
    },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, password, name, role, phone, department, jobTitle, companyName, businessType, address, gstNumber } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Email, password, name, and role are required" },
        { status: 400 }
      );
    }

    // Role creation permission check:
    // Admin can create ADMIN, MANAGER, ENGINEER, CUSTOMER
    // Manager can ONLY create ENGINEER or CUSTOMER
    if (sessionUser.effectiveRole === "MANAGER" && !["ENGINEER", "CUSTOMER"].includes(role)) {
      return NextResponse.json(
        { error: "Managers can only create Engineer or Customer accounts" },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name,
        role,
        phone,
        department: department || (role === "ENGINEER" ? "Engineering & Architecture" : undefined),
        jobTitle,
        status: "ACTIVE",
      },
    });

    // If role is CUSTOMER, create linked CustomerProfile
    if (role === "CUSTOMER") {
      await prisma.customerProfile.create({
        data: {
          userId: newUser.id,
          companyName: companyName || `${name} Company`,
          businessType: businessType || "Commercial Client",
          address,
          gstNumber,
          assignedManagerId: sessionUser.id,
          status: "ACTIVE",
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: "CREATE_USER",
        entityType: "USER",
        entityId: newUser.id,
        details: `Created new user ${name} (${role}) by ${sessionUser.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${role} account created successfully`,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id, name, phone, status, jobTitle, department, password } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Manager cannot edit Admin or Manager accounts
    if (sessionUser.effectiveRole === "MANAGER" && ["ADMIN", "MANAGER"].includes(targetUser.role)) {
      return NextResponse.json(
        { error: "Managers cannot modify Admin or Manager accounts" },
        { status: 403 }
      );
    }

    const updateData: {
      name?: string;
      phone?: string;
      status?: string;
      jobTitle?: string;
      department?: string;
      passwordHash?: string;
    } = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (status) updateData.status = status;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (department !== undefined) updateData.department = department;
    if (password) updateData.passwordHash = await hashPassword(password);

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: "UPDATE_USER",
        entityType: "USER",
        entityId: id,
        details: `Updated user ${updated.name} (${updated.role})`,
      },
    });

    const { passwordHash: _ph, visiblePassword: _vp, ...safeUser } = updated as any;

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const sessionUser = await getSessionUser();
  // Only ADMIN can delete accounts
  if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Only Admin can delete user accounts" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    if (id === sessionUser.id) {
      return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            managedProjects: true,
            assignedTasks: true,
            createdTasks: true,
            workLogs: true,
          },
        },
      },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user has linked projects or tasks, perform safe soft delete / deactivation to preserve integrity
    const hasActiveReferences =
      target._count.managedProjects > 0 ||
      target._count.assignedTasks > 0 ||
      target._count.createdTasks > 0 ||
      target._count.workLogs > 0;

    if (hasActiveReferences) {
      await prisma.user.update({
        where: { id },
        data: {
          status: "SUSPENDED",
          isLocked: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: sessionUser.id,
          action: "DEACTIVATE_USER",
          entityType: "USER",
          entityId: id,
          details: `User account ${target.name} (${target.email}) deactivated and suspended by ${sessionUser.name} due to active project dependencies`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "User account deactivated and suspended (historical project records preserved)",
      });
    }

    // Clean delete if no blocking dependencies
    await prisma.customerProfile.deleteMany({ where: { userId: id } });
    await prisma.projectMember.deleteMany({ where: { userId: id } });
    await prisma.notification.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: "DELETE_USER",
        entityType: "USER",
        entityId: id,
        details: `User account ${target.name} (${target.email}) permanently removed by ${sessionUser.name}`,
      },
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user account" }, { status: 500 });
  }
}
