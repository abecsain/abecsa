import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: { include: { user: true } },
      manager: true,
      members: { include: { user: true } },
      tasks: { include: { assignedTo: true, checklists: true } },
      milestones: true,
      files: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, project });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const data = await req.json();

  const updateData: any = {};
  if (data.name) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status) updateData.status = data.status;
  if (data.priority) updateData.priority = data.priority;
  if (data.budget !== undefined) updateData.budget = Number(data.budget);
  if (data.deliveryDate) updateData.deliveryDate = new Date(data.deliveryDate);
  if (data.progress !== undefined) updateData.progress = Math.min(100, Math.max(0, Number(data.progress)));
  if (data.serviceCategory) updateData.serviceCategory = data.serviceCategory;
  if (data.managerId) updateData.managerId = data.managerId;
  if (data.customerId) updateData.customerId = data.customerId;
  if (data.techStack !== undefined) updateData.techStack = data.techStack;

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
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

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
}
