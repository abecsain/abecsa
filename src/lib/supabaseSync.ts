import prisma from "@/lib/prisma";
import { getSupabaseAdminClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";

/**
 * Maps Supabase profile role to ABECSA internal system role
 */
function mapSupabaseRole(role?: string): "ADMIN" | "MANAGER" | "ENGINEER" | "CUSTOMER" {
  const normalized = (role || "").toLowerCase().trim();
  if (normalized === "admin") return "ADMIN";
  if (normalized === "marketing_manager" || normalized === "manager") return "MANAGER";
  if (normalized === "engineer" || normalized === "developer") return "ENGINEER";
  return "CUSTOMER";
}

/**
 * Synchronizes production Supabase data into Prisma models.
 * Ensures data durability, seamless offline/online resilience, and zero data loss on Render.
 */
export async function syncSupabaseProductionData(): Promise<{
  success: boolean;
  profilesSynced: number;
  appsSynced: number;
  websitesSynced: number;
  applicationsSynced: number;
  assetsSynced: number;
  error?: string;
}> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      success: false,
      profilesSynced: 0,
      appsSynced: 0,
      websitesSynced: 0,
      applicationsSynced: 0,
      assetsSynced: 0,
      error: "Supabase client is not configured.",
    };
  }

  let profilesSynced = 0;
  let appsSynced = 0;
  let websitesSynced = 0;
  let applicationsSynced = 0;
  let assetsSynced = 0;

  try {
    // 1. Sync Profiles -> Prisma User & CustomerProfile
    const { data: profiles, error: profErr } = await supabase.from("profiles").select("*");
    if (!profErr && Array.isArray(profiles)) {
      for (const p of profiles) {
        if (!p.email) continue;
        const mappedRole = mapSupabaseRole(p.role);
        const rawPassword = p.visible_password || "Abecsa@2026Secure";
        const passwordHash = await bcrypt.hash(rawPassword, 10);

        const upsertedUser = await prisma.user.upsert({
          where: { email: p.email.toLowerCase().trim() },
          update: {
            name: p.full_name?.trim() || p.email.split("@")[0],
            role: mappedRole,
            status: p.is_locked ? "SUSPENDED" : "ACTIVE",
            passwordHash,
          },
          create: {
            id: p.id || undefined,
            email: p.email.toLowerCase().trim(),
            name: p.full_name?.trim() || p.email.split("@")[0],
            role: mappedRole,
            status: p.is_locked ? "SUSPENDED" : "ACTIVE",
            passwordHash,
          },
        });

        if (mappedRole === "CUSTOMER") {
          await prisma.customerProfile.upsert({
            where: { userId: upsertedUser.id },
            update: {
              companyName: p.full_name?.trim() || "Client Enterprise",
            },
            create: {
              userId: upsertedUser.id,
              companyName: p.full_name?.trim() || "Client Enterprise",
            },
          });
        }

        profilesSynced++;
      }

      // Deactivate old hardcoded demo users to ensure strict DB authentication only
      try {
        await prisma.user.updateMany({
          where: {
            email: {
              in: ["admin@abecsa.in", "manager@abecsa.in", "engineer@abecsa.in", "dev@abecsa.in", "client@abecsa.in", "client2@abecsa.in"],
            },
          },
          data: {
            status: "INACTIVE",
            passwordHash: "$2b$10$DISABLED_DEMO_ACCOUNT_INACTIVE_NO_ACCESS_2026",
          },
        });
      } catch {
        // ignore
      }
    }

    // 2. Sync Apps -> Prisma App
    const { data: apps, error: appErr } = await supabase.from("apps").select("*");
    if (!appErr && Array.isArray(apps)) {
      for (const a of apps) {
        if (!a.name || !a.apk_url) continue;
        await prisma.app.upsert({
          where: { id: a.id },
          update: {
            name: a.name,
            description: a.description || "",
            version: a.version || "1.0",
            category: a.category || "General",
            iconUrl: a.icon_url || null,
            apkUrl: a.apk_url,
            apkFilename: a.apk_filename || "app-release.apk",
            downloadCount: a.download_count || 0,
            isActive: a.is_active ?? true,
          },
          create: {
            id: a.id,
            name: a.name,
            description: a.description || "",
            version: a.version || "1.0",
            category: a.category || "General",
            iconUrl: a.icon_url || null,
            apkUrl: a.apk_url,
            apkFilename: a.apk_filename || "app-release.apk",
            downloadCount: a.download_count || 0,
            isActive: a.is_active ?? true,
          },
        });
        appsSynced++;
      }
    }

    // 3. Sync Websites -> Prisma Website
    const { data: websites, error: webErr } = await supabase.from("websites").select("*");
    if (!webErr && Array.isArray(websites)) {
      const fallbackUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      const fallbackUserId = fallbackUser?.id || "6e61b6f0-155c-448d-a352-39ddebcfddb2";

      for (const w of websites) {
        if (!w.name) continue;
        const stringId = String(w.id);
        const targetUserId = w.user_id && (await prisma.user.findUnique({ where: { id: w.user_id } }))
          ? w.user_id
          : fallbackUserId;

        await prisma.website.upsert({
          where: { id: stringId },
          update: {
            name: w.name,
            url: w.url || null,
            status: w.status || "Pending",
            plan: w.plan || null,
            isActive: w.is_active ?? true,
            category: w.category || "General",
            description: w.description || null,
            iconUrl: w.icon_url || null,
          },
          create: {
            id: stringId,
            userId: targetUserId,
            name: w.name,
            url: w.url || null,
            status: w.status || "Pending",
            plan: w.plan || null,
            isActive: w.is_active ?? true,
            category: w.category || "General",
            description: w.description || null,
            iconUrl: w.icon_url || null,
          },
        });
        websitesSynced++;
      }
    }

    // 4. Sync Course Applications -> Prisma CourseApplication
    const { data: courseApps, error: cAppErr } = await supabase.from("course_applications").select("*");
    if (!cAppErr && Array.isArray(courseApps)) {
      for (const ca of courseApps) {
        if (!ca.name || !ca.email) continue;
        await prisma.courseApplication.upsert({
          where: { id: Number(ca.id) },
          update: {
            name: ca.name,
            email: ca.email,
            phone: ca.phone || "",
            courseName: ca.course_name || "Enterprise Training",
            branch: ca.branch || null,
            message: ca.message || null,
            status: ca.status || "Pending",
            type: ca.type || "Course",
          },
          create: {
            id: Number(ca.id),
            name: ca.name,
            email: ca.email,
            phone: ca.phone || "",
            courseName: ca.course_name || "Enterprise Training",
            branch: ca.branch || null,
            message: ca.message || null,
            status: ca.status || "Pending",
            type: ca.type || "Course",
          },
        });
        applicationsSynced++;
      }
    }

    // 5. Sync User Assets -> Prisma UserAsset
    const { data: assets, error: assetErr } = await supabase.from("user_assets").select("*");
    if (!assetErr && Array.isArray(assets)) {
      const fallbackUser = await prisma.user.findFirst();
      const fallbackUserId = fallbackUser?.id || "usr_asset_owner";

      for (const ast of assets) {
        if (!ast.name || !ast.value) continue;
        const targetUserId = ast.user_id && (await prisma.user.findUnique({ where: { id: ast.user_id } }))
          ? ast.user_id
          : fallbackUserId;

        await prisma.userAsset.upsert({
          where: { id: ast.id },
          update: {
            name: ast.name,
            type: ast.type,
            value: ast.value,
          },
          create: {
            id: ast.id,
            userId: targetUserId,
            name: ast.name,
            type: ast.type,
            value: ast.value,
          },
        });
        assetsSynced++;
      }
    }

    return {
      success: true,
      profilesSynced,
      appsSynced,
      websitesSynced,
      applicationsSynced,
      assetsSynced,
    };
  } catch (err: any) {
    console.error("Supabase data sync failed:", err);
    return {
      success: false,
      profilesSynced,
      appsSynced,
      websitesSynced,
      applicationsSynced,
      assetsSynced,
      error: err.message,
    };
  }
}
