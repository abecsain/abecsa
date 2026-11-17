import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const assignedToId = searchParams.get("assignedToId");
  const view = searchParams.get("view"); // "ALL" | "MINE"

  const whereClause: {
    projectId?: string;
    assignedToId?: string;
  } = {};

  if (projectId) whereClause.projectId = projectId;

  if (assignedToId && assignedToId !== "ALL") {
    if (assignedToId === "ME") {
      whereClause.assignedToId = sessionUser.id;
    } else {
      whereClause.assignedToId = assignedToId;
    }
  } else if (sessionUser.effectiveRole === "ENGINEER" && view === "MINE") {
    whereClause.assignedToId = sessionUser.id;
  }
  // When view is ALL or by default, all sprint tasks in the engineering pipeline are returned so the board is populated!

  const tasks = await prisma.task.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        select: {
          id: true,
          projectId: true,
          name: true,
          progress: true,
          customer: { select: { companyName: true } },
        },
      },
      assignedTo: { select: { id: true, name: true, email: true } },
      checklists: true,
      comments: {
        include: { user: { select: { name: true, role: true } } },
      },
    },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER", "ENGINEER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const { projectId, title, description, assignedToId, priority, dueDate, estimatedHours } = data;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    // Resolve target project
    let targetProjectId = projectId && projectId.trim() !== "" ? projectId : null;
    if (!targetProjectId) {
      const firstProject = await prisma.project.findFirst({
        orderBy: { updatedAt: "desc" },
      });
      if (!firstProject) {
        return NextResponse.json({ error: "No active projects found. Create a project first." }, { status: 400 });
      }
      targetProjectId = firstProject.id;
    }

    // If engineer creates task, default assignedToId to themselves if not given
    const targetAssignedToId = assignedToId && assignedToId.trim() !== "" 
      ? assignedToId 
      : (sessionUser.effectiveRole === "ENGINEER" ? sessionUser.id : undefined);

    const task = await prisma.task.create({
      data: {
        projectId: targetProjectId,
        title: title.trim(),
        description: description || "Engineering sprint task execution item.",
        assignedToId: targetAssignedToId,
        createdById: sessionUser.id,
        priority: priority || "MEDIUM",
        status: "TODO",
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours: Number(estimatedHours || 0),
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        project: { select: { name: true } },
      },
    });

    // Notify assigned engineer if assigned
    if (targetAssignedToId && targetAssignedToId !== sessionUser.id) {
      await prisma.notification.create({
        data: {
          userId: targetAssignedToId,
          title: "New Engineering Task Assigned",
          message: `Task "${title.trim()}" in ${task.project.name} has been assigned to you.`,
          type: "INFO",
          linkUrl: "/engineer/tasks",
        },
      });
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      id,
      status,
      title,
      description,
      priority,
      assignedToId,
      actualHours,
      deliverableUrl,
      comment,
      checklistToggleId,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Role check: Engineer can update their assigned tasks; Admin/Manager can update any task
    if (
      sessionUser.effectiveRole === "ENGINEER" &&
      existingTask.assignedToId !== sessionUser.id
    ) {
      return NextResponse.json(
        { error: "Engineers can only update their own assigned tasks" },
        { status: 403 }
      );
    }

    // Toggle checklist item if requested
    if (checklistToggleId) {
      const checklistItem = await prisma.taskChecklist.findUnique({
        where: { id: checklistToggleId },
      });
      if (checklistItem) {
        await prisma.taskChecklist.update({
          where: { id: checklistToggleId },
          data: { isCompleted: !checklistItem.isCompleted },
        });
      }
    }

    // Add comment if provided
    if (comment) {
      await prisma.taskComment.create({
        data: {
          taskId: id,
          userId: sessionUser.id,
          comment,
          isInternal: true,
        },
      });
    }

    // Add checklist item if requested
    if (body.checklistAddTitle) {
      await prisma.taskChecklist.create({
        data: {
          taskId: id,
          title: body.checklistAddTitle.trim(),
          isCompleted: false,
        },
      });
    }

    // Delete checklist item if requested
    if (body.checklistDeleteId) {
      await prisma.taskChecklist.delete({
        where: { id: body.checklistDeleteId },
      });
    }

    // Update main task fields
    const updateData: {
      status?: string;
      title?: string;
      description?: string;
      priority?: string;
      assignedToId?: string;
      dueDate?: Date;
      estimatedHours?: number;
      actualHours?: number;
      deliverableUrl?: string;
    } = {};

    if (status) updateData.status = status;
    if (title && ["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) updateData.title = title.trim();
    if (description !== undefined && ["ADMIN", "MANAGER", "ENGINEER"].includes(sessionUser.effectiveRole)) updateData.description = description;
    if (priority && ["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) updateData.priority = priority;
    if (assignedToId !== undefined && ["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) updateData.assignedToId = assignedToId || undefined;
    if (body.dueDate && ["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) updateData.dueDate = new Date(body.dueDate);
    if (body.estimatedHours !== undefined && ["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) updateData.estimatedHours = Number(body.estimatedHours);
    if (actualHours !== undefined) updateData.actualHours = Number(actualHours);
    if (deliverableUrl !== undefined) updateData.deliverableUrl = deliverableUrl;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, projectId: true } },
        checklists: true,
      },
    });

    // DYNAMIC PROJECT PROGRESS RECALCULATION:
    // If status changed or tasks exist, recalculate overall project completion percentage!
    const allProjectTasks = await prisma.task.findMany({
      where: { projectId: existingTask.projectId },
      select: { status: true },
    });

    if (allProjectTasks.length > 0) {
      const completedTasks = allProjectTasks.filter((t) => t.status === "COMPLETED").length;
      const calculatedProgress = Math.round((completedTasks / allProjectTasks.length) * 100);

      await prisma.project.update({
        where: { id: existingTask.projectId },
        data: { progress: calculatedProgress },
      });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error("Task patch error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER", "ENGINEER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Role check: Engineer can only delete tasks they created; Admin & Manager can delete any task
    if (sessionUser.effectiveRole === "ENGINEER" && task.createdById !== sessionUser.id) {
      return NextResponse.json(
        { error: "Engineers can only delete tasks they created" },
        { status: 403 }
      );
    }

    // Delete associated comments and checklists first
    await prisma.taskChecklist.deleteMany({ where: { taskId: id } });
    await prisma.taskComment.deleteMany({ where: { taskId: id } });
    await prisma.task.delete({ where: { id } });

    // Recalculate project progress
    const remainingTasks = await prisma.task.findMany({
      where: { projectId: task.projectId },
      select: { status: true },
    });

    const newProgress =
      remainingTasks.length > 0
        ? Math.round(
            (remainingTasks.filter((t) => t.status === "COMPLETED").length /
              remainingTasks.length) *
              100
          )
        : 0;

    await prisma.project.update({
      where: { id: task.projectId },
      data: { progress: newProgress },
    });

    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Task delete error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
