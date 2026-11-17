import { PrismaClient } from "@prisma/client";
import { signToken } from "@/lib/auth";

const BASE_URL = "http://localhost:3737";
const prisma = new PrismaClient();

async function runTest() {
  console.log("=== BEGIN VAULT CONFIDENTIALITY & CUSTOMER ASSIGNMENT TEST ===");

  // 1. Get users and profiles
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@abecsa.in" } });
  const client1User = await prisma.user.findUnique({
    where: { email: "client@abecsa.in" },
    include: { customerProfile: true },
  });
  const client2User = await prisma.user.findUnique({
    where: { email: "client2@abecsa.in" },
    include: { customerProfile: true },
  });

  if (!adminUser || !client1User?.customerProfile || !client2User?.customerProfile) {
    throw new Error("Missing test users or profiles");
  }

  const adminToken = signToken({
    userId: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    name: adminUser.name,
  });

  const client1Token = signToken({
    userId: client1User.id,
    email: client1User.email,
    role: client1User.role,
    name: client1User.name,
  });

  const client2Token = signToken({
    userId: client2User.id,
    email: client2User.email,
    role: client2User.role,
    name: client2User.name,
  });

  console.log("1. Authenticated Admin, Client 1 (NexaCorp), and Client 2.");

  // 2. Admin creates 4 files with different access levels
  console.log("2. Admin creating files with 3 visibility options...");

  // File A: CONFIDENTIAL (Don't show anyone)
  const resA = await fetch(`${BASE_URL}/api/vault`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `abecsa_session=${adminToken}`,
    },
    body: JSON.stringify({
      type: "FILE",
      fileName: "Internal_Audit_Confidential.pdf",
      fileUrl: "/logo.png",
      fileType: "PDF",
      visibility: "CONFIDENTIAL",
      description: "Strictly confidential - company staff only",
    }),
  });
  const dataA = await resA.json();
  const fileA = dataA.file;
  console.log("✓ File A created (CONFIDENTIAL):", fileA.id);

  // File B: SHOW_EVERYONE (Visible to show everyone)
  const resB = await fetch(`${BASE_URL}/api/vault`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `abecsa_session=${adminToken}`,
    },
    body: JSON.stringify({
      type: "FILE",
      fileName: "ABECSA_Enterprise_Security_Whitepaper.pdf",
      fileUrl: "/logo.png",
      fileType: "PDF",
      visibility: "SHOW_EVERYONE",
      description: "Public whitepaper for all clients",
    }),
  });
  const dataB = await resB.json();
  const fileB = dataB.file;
  console.log("✓ File B created (SHOW_EVERYONE):", fileB.id);

  // File C: ASSIGNED to Client 1 (Ananya Deshmukh / NexaCorp)
  const resC = await fetch(`${BASE_URL}/api/vault`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `abecsa_session=${adminToken}`,
    },
    body: JSON.stringify({
      type: "FILE",
      fileName: "NexaCorp_Contract_Confidential_Signed.pdf",
      fileUrl: "/logo.png",
      fileType: "PDF",
      visibility: "ASSIGNED",
      customerId: client1User.customerProfile.id,
      description: "Direct confidential agreement for NexaCorp only",
    }),
  });
  const dataC = await resC.json();
  const fileC = dataC.file;
  console.log("✓ File C created (ASSIGNED to Client 1):", fileC.id);

  // File D: ASSIGNED to Client 2 (Rohan Gupta)
  const resD = await fetch(`${BASE_URL}/api/vault`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `abecsa_session=${adminToken}`,
    },
    body: JSON.stringify({
      type: "FILE",
      fileName: "Client2_Dedicated_Delivery_Architecture.png",
      fileUrl: "/logo.png",
      fileType: "IMAGE",
      visibility: "ASSIGNED",
      customerId: client2User.customerProfile.id,
      description: "Direct delivery architecture for Client 2 only",
    }),
  });
  const dataD = await resD.json();
  const fileD = dataD.file;
  console.log("✓ File D created (ASSIGNED to Client 2):", fileD.id);

  // 3. Verify Admin sees all 4
  console.log("3. Verifying Admin view...");
  const adminRes = await fetch(`${BASE_URL}/api/vault`, {
    headers: { Cookie: `abecsa_session=${adminToken}` },
  });
  const adminData = await adminRes.json();
  const adminFileIds = adminData.files.map((f: any) => f.id);
  if (!adminFileIds.includes(fileA.id) || !adminFileIds.includes(fileB.id) || !adminFileIds.includes(fileC.id) || !adminFileIds.includes(fileD.id)) {
    throw new Error("Admin should see all files");
  }
  console.log("✓ Admin sees all files (Confidential, Shared, and Assigned to individual clients).");

  // 4. Verify Client 1 view
  console.log("4. Verifying Client 1 (NexaCorp) view...");
  const client1Res = await fetch(`${BASE_URL}/api/vault`, {
    headers: { Cookie: `abecsa_session=${client1Token}` },
  });
  const client1Data = await client1Res.json();
  const client1FileIds = client1Data.files.map((f: any) => f.id);

  if (client1FileIds.includes(fileA.id)) {
    throw new Error("Client 1 should NOT see Confidential File A!");
  }
  if (!client1FileIds.includes(fileB.id)) {
    throw new Error("Client 1 SHOULD see Visible to Show Everyone File B!");
  }
  if (!client1FileIds.includes(fileC.id)) {
    throw new Error("Client 1 SHOULD see Assigned File C!");
  }
  if (client1FileIds.includes(fileD.id)) {
    throw new Error("Client 1 should NOT see File D assigned to Client 2!");
  }
  console.log("✓ Client 1 isolation verified: sees File B & File C only; CANNOT see Confidential File A or Client 2's File D!");

  // 5. Verify Client 2 view
  console.log("5. Verifying Client 2 view...");
  const client2Res = await fetch(`${BASE_URL}/api/vault`, {
    headers: { Cookie: `abecsa_session=${client2Token}` },
  });
  const client2Data = await client2Res.json();
  const client2FileIds = client2Data.files.map((f: any) => f.id);

  if (client2FileIds.includes(fileA.id)) {
    throw new Error("Client 2 should NOT see Confidential File A!");
  }
  if (!client2FileIds.includes(fileB.id)) {
    throw new Error("Client 2 SHOULD see Visible to Show Everyone File B!");
  }
  if (client2FileIds.includes(fileC.id)) {
    throw new Error("Client 2 should NOT see File C assigned to Client 1!");
  }
  if (!client2FileIds.includes(fileD.id)) {
    throw new Error("Client 2 SHOULD see Assigned File D!");
  }
  console.log("✓ Client 2 isolation verified: sees File B & File D only; CANNOT see Confidential File A or Client 1's File C!");

  // 6. Test Modifying Access Level dynamically via PATCH
  console.log("6. Testing dynamic access level modification via PATCH...");
  // Turn File A from CONFIDENTIAL to SHOW_EVERYONE
  const patchRes = await fetch(`${BASE_URL}/api/vault`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: `abecsa_session=${adminToken}`,
    },
    body: JSON.stringify({
      id: fileA.id,
      type: "FILE",
      visibility: "SHOW_EVERYONE",
    }),
  });
  const patchData = await patchRes.json();
  if (!patchData.success) throw new Error("Failed to patch File A");

  // Now both Client 1 and Client 2 should see File A!
  const client1ResAfter = await fetch(`${BASE_URL}/api/vault`, {
    headers: { Cookie: `abecsa_session=${client1Token}` },
  });
  const client1DataAfter = await client1ResAfter.json();
  const client1IdsAfter = client1DataAfter.files.map((f: any) => f.id);
  if (!client1IdsAfter.includes(fileA.id)) {
    throw new Error("Client 1 should now see File A after switching to SHOW_EVERYONE!");
  }
  console.log("✓ Dynamic PATCH verified: File A was made Visible to Everyone, and Client 1 instantly sees it!");

  // 7. Cleanup
  console.log("7. Cleaning up test files...");
  await fetch(`${BASE_URL}/api/vault?id=${fileA.id}&type=FILE`, {
    method: "DELETE",
    headers: { Cookie: `abecsa_session=${adminToken}` },
  });
  await fetch(`${BASE_URL}/api/vault?id=${fileB.id}&type=FILE`, {
    method: "DELETE",
    headers: { Cookie: `abecsa_session=${adminToken}` },
  });
  await fetch(`${BASE_URL}/api/vault?id=${fileC.id}&type=FILE`, {
    method: "DELETE",
    headers: { Cookie: `abecsa_session=${adminToken}` },
  });
  await fetch(`${BASE_URL}/api/vault?id=${fileD.id}&type=FILE`, {
    method: "DELETE",
    headers: { Cookie: `abecsa_session=${adminToken}` },
  });

  console.log("==================================================================");
  console.log("ALL VAULT CONFIDENTIALITY & CUSTOMER ASSIGNMENT TESTS PASSED 100%");
  console.log("==================================================================");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
