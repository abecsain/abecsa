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
  const customerId = searchParams.get("customerId");

  const folderWhere: any = {};
  const fileWhere: any = {};

  if (sessionUser.effectiveRole === "CUSTOMER") {
    if (!sessionUser.customerProfile) {
      return NextResponse.json({ folders: [], files: [] });
    }
    const customerProfileId = sessionUser.customerProfile.id;

    // Customer can only see:
    // 1. Files specifically assigned to their company account (isCustomerVisible: true AND customerId: theirId)
    // 2. Files published for everyone (isCustomerVisible: true AND customerId: null)
    // They NEVER see Confidential files (isCustomerVisible: false) or files assigned to other customers
    folderWhere.isCustomerVisible = true;
    folderWhere.OR = [
      { customerId: customerProfileId },
      { customerId: null },
    ];

    fileWhere.isCustomerVisible = true;
    fileWhere.OR = [
      { customerId: customerProfileId },
      { customerId: null },
    ];
  } else {
    if (projectId) {
      folderWhere.projectId = projectId;
      fileWhere.projectId = projectId;
    }
    if (customerId) {
      folderWhere.customerId = customerId;
      fileWhere.customerId = customerId;
    }
  }

  const [folders, files] = await Promise.all([
    prisma.folder.findMany({
      where: folderWhere,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, companyName: true, user: { select: { name: true, email: true } } } },
        _count: { select: { files: true, children: true } },
      },
    }),
    prisma.file.findMany({
      where: fileWhere,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, companyName: true, user: { select: { name: true, email: true } } } },
        folder: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true, role: true } },
      },
    }),
  ]);

  return NextResponse.json({ folders, files });
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER", "ENGINEER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const {
      type, // "FOLDER" | "FILE"
      name,
      parentId,
      projectId,
      customerId,
      visibility, // "CONFIDENTIAL" | "SHOW_EVERYONE" | "ASSIGNED"
      isCustomerVisible,
      fileName,
      originalName,
      fileUrl,
      fileType,
      fileSize = 1048576,
      mimeType,
      description,
      folderId,
    } = data;

    const cleanParentId = parentId && parentId.trim() !== "" ? parentId : undefined;
    const cleanProjectId = projectId && projectId.trim() !== "" ? projectId : undefined;
    const cleanFolderId = folderId && folderId.trim() !== "" ? folderId : undefined;

    // Resolve visibility and customer assignment based on options:
    let finalCustomerVisible = true;
    let finalCustomerId: string | undefined = undefined;

    if (visibility === "CONFIDENTIAL") {
      finalCustomerVisible = false;
      finalCustomerId = undefined;
    } else if (visibility === "SHOW_EVERYONE") {
      finalCustomerVisible = true;
      finalCustomerId = undefined;
    } else if (visibility === "ASSIGNED") {
      finalCustomerVisible = true;
      finalCustomerId = customerId && customerId.trim() !== "" ? customerId : undefined;
    } else {
      // Legacy compatibility
      finalCustomerVisible = isCustomerVisible !== undefined ? Boolean(isCustomerVisible) : true;
      finalCustomerId = customerId && customerId.trim() !== "" ? customerId : undefined;
    }

    if (type === "FOLDER") {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
      }

      const folder = await prisma.folder.create({
        data: {
          name: name.trim(),
          parentId: cleanParentId,
          projectId: cleanProjectId,
          customerId: finalCustomerId,
          createdById: sessionUser.id,
          isCustomerVisible: finalCustomerVisible,
        },
        include: {
          customer: { select: { id: true, companyName: true, user: { select: { name: true, email: true } } } },
          _count: { select: { files: true, children: true } },
        },
      });

      return NextResponse.json({ success: true, folder });
    }

    if (type === "FILE") {
      if (!fileName || !fileUrl) {
        return NextResponse.json({ error: "File name and URL are required" }, { status: 400 });
      }

      const file = await prisma.file.create({
        data: {
          folderId: cleanFolderId,
          projectId: cleanProjectId,
          customerId: finalCustomerId,
          uploadedById: sessionUser.id,
          fileName: fileName.trim(),
          originalName: originalName || fileName.trim(),
          fileUrl,
          fileType: fileType || "IMAGE",
          fileSize: Number(fileSize),
          mimeType: mimeType || "application/octet-stream",
          isCustomerVisible: finalCustomerVisible,
          description,
        },
        include: {
          customer: { select: { id: true, companyName: true, user: { select: { name: true, email: true } } } },
          folder: { select: { id: true, name: true } },
          uploadedBy: { select: { id: true, name: true, role: true } },
        },
      });

      // If visible to customer and assigned to specific customer, notify customer
      if (finalCustomerVisible && finalCustomerId) {
        const clientProfile = await prisma.customerProfile.findUnique({
          where: { id: finalCustomerId },
        });

        if (clientProfile?.userId) {
          await prisma.notification.create({
            data: {
              userId: clientProfile.userId,
              title: "New File Shared in Your Vault",
              message: `${sessionUser.name} uploaded "${originalName || fileName}" to your client portal.`,
              type: "INFO",
              linkUrl: "/customer/vault",
            },
          });
        }
      }

      return NextResponse.json({ success: true, file });
    }

    return NextResponse.json({ error: "Invalid type specified" }, { status: 400 });
  } catch (error) {
    console.error("Vault POST error:", error);
    return NextResponse.json({ error: "Failed to create vault item" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER", "ENGINEER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const { id, type, name, fileName, visibility, customerId, isCustomerVisible, description } = data;

    if (!id || !type) {
      return NextResponse.json({ error: "ID and type are required" }, { status: 400 });
    }

    const updateData: any = {};

    if (visibility !== undefined) {
      if (visibility === "CONFIDENTIAL") {
        updateData.isCustomerVisible = false;
        updateData.customerId = null;
      } else if (visibility === "SHOW_EVERYONE") {
        updateData.isCustomerVisible = true;
        updateData.customerId = null;
      } else if (visibility === "ASSIGNED") {
        updateData.isCustomerVisible = true;
        updateData.customerId = customerId && customerId.trim() !== "" ? customerId : null;
      }
    } else {
      if (isCustomerVisible !== undefined) {
        updateData.isCustomerVisible = Boolean(isCustomerVisible);
      }
      if (customerId !== undefined) {
        updateData.customerId = customerId && customerId.trim() !== "" ? customerId : null;
      }
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (type === "FOLDER") {
      if (name) updateData.name = name.trim();
      const folder = await prisma.folder.update({
        where: { id },
        data: updateData,
        include: {
          customer: { select: { id: true, companyName: true, user: { select: { name: true, email: true } } } },
          _count: { select: { files: true, children: true } },
        },
      });
      return NextResponse.json({ success: true, folder });
    }

    if (type === "FILE") {
      if (fileName) {
        updateData.fileName = fileName.trim();
        updateData.originalName = fileName.trim();
      }
      const file = await prisma.file.update({
        where: { id },
        data: updateData,
        include: {
          customer: { select: { id: true, companyName: true, user: { select: { name: true, email: true } } } },
          folder: { select: { id: true, name: true } },
          uploadedBy: { select: { id: true, name: true, role: true } },
        },
      });
      return NextResponse.json({ success: true, file });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Vault PATCH error:", error);
    return NextResponse.json({ error: "Failed to update vault item" }, { status: 500 });
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
    const type = searchParams.get("type"); // "FOLDER" | "FILE"

    if (!id || !type) {
      return NextResponse.json({ error: "ID and type are required" }, { status: 400 });
    }

    if (type === "FOLDER") {
      // Delete children files first
      await prisma.file.deleteMany({ where: { folderId: id } });
      await prisma.folder.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Folder deleted successfully" });
    }

    if (type === "FILE") {
      await prisma.file.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "File deleted successfully" });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Vault DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete vault item" }, { status: 500 });
  }
}
