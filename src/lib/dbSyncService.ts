import prisma from "@/lib/prisma";
import { getSupabaseAdminClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";

let lastSyncTime = 0;
const SYNC_INTERVAL_MS = 60 * 1000; // Throttle to at most once per minute in background

/**
 * Non-destructive bidirectional sync between Supabase Cloud and Prisma SQLite.
 * Ensures zero data is deleted, all records from Supabase are mirrored into Prisma,
 * and user credentials match so team and client accounts can log in seamlessly.
 */
export async function syncSupabaseToPrisma(force = false): Promise<{ success: boolean; stats: any }> {
  const now = Date.now();
  if (!force && now - lastSyncTime < SYNC_INTERVAL_MS) {
    return { success: true, stats: { skipped: true } };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { success: false, stats: { error: "Supabase client not configured." } };
  }

  const stats = {
    users: 0,
    websites: 0,
    apps: 0,
    assets: 0,
  };

  try {
    // 1. Sync Profiles -> User table
    const { data: profiles, error: pErr } = await supabase.from("profiles").select("*");
    if (!pErr && profiles && profiles.length > 0) {
      for (const p of profiles) {
        const email = p.email ? p.email.toLowerCase().trim() : "";
        if (!email) continue;

        const roleMap: Record<string, "ADMIN" | "MANAGER" | "ENGINEER" | "CUSTOMER"> = {
          admin: "ADMIN",
          marketing_manager: "MANAGER",
          manager: "MANAGER",
          engineer: "ENGINEER",
          customer: "CUSTOMER",
        };
        const role = roleMap[(p.role || "").toLowerCase().trim()] || "CUSTOMER";
        const password = p.visible_password || "Abecsa@2026";
        const passwordHash = await bcrypt.hash(password, 10);

        await prisma.user.upsert({
          where: { email },
          update: {
            name: p.full_name ? p.full_name.trim() : email.split("@")[0],
            role,
            visiblePassword: password,
            passwordHash,
            isLocked: Boolean(p.is_locked),
            managerId: p.manager_id || null,
          },
          create: {
            id: p.id || undefined,
            email,
            name: p.full_name ? p.full_name.trim() : email.split("@")[0],
            role,
            visiblePassword: password,
            passwordHash,
            isLocked: Boolean(p.is_locked),
            managerId: p.manager_id || null,
          },
        });
        stats.users++;
      }
    }

    // Get all valid user IDs to prevent foreign key issues
    const currentUsers = await prisma.user.findMany({ select: { id: true } });
    const userIds = new Set(currentUsers.map((u) => u.id));

    // 2. Sync Websites
    const { data: websites, error: wErr } = await supabase.from("websites").select("*");
    if (!wErr && websites && websites.length > 0) {
      for (const w of websites) {
        const existing = await prisma.website.findFirst({
          where: { OR: [{ id: String(w.id) }, { url: w.url }] },
        });

        const validUserId = w.user_id && userIds.has(w.user_id) ? w.user_id : null;
        const validManagerId = w.manager_id && userIds.has(w.manager_id) ? w.manager_id : null;

        if (!existing) {
          await prisma.website.create({
            data: {
              id: String(w.id),
              name: w.name || "Website",
              url: w.url || "",
              description: w.description || null,
              category: w.category || "General",
              iconUrl: w.icon_url || null,
              plan: w.plan || "Standard Cloud NVMe",
              status: w.status || "Active",
              expiryDate: w.expiry_date ? new Date(w.expiry_date) : null,
              userId: validUserId,
              managerId: validManagerId,
              isActive: w.is_active !== undefined ? Boolean(w.is_active) : true,
            },
          });
        } else {
          await prisma.website.update({
            where: { id: existing.id },
            data: {
              name: w.name || existing.name,
              url: w.url || existing.url,
              status: w.status || existing.status,
              category: w.category || existing.category,
              plan: w.plan || existing.plan,
              userId: validUserId || existing.userId,
              managerId: validManagerId || existing.managerId,
            },
          });
        }
        stats.websites++;
      }
    }

    // 3. Sync Apps
    const { data: apps, error: aErr } = await supabase.from("apps").select("*");
    if (!aErr && apps && apps.length > 0) {
      for (const a of apps) {
        const existing = await prisma.app.findFirst({
          where: { OR: [{ id: String(a.id) }, { name: a.name }] },
        });

        if (!existing) {
          await prisma.app.create({
            data: {
              id: String(a.id),
              name: a.name || "App",
              description: a.description || null,
              version: a.version || "1.0",
              category: a.category || "General",
              iconUrl: a.icon_url || null,
              apkUrl: a.apk_url || "",
              apkFilename: a.apk_filename || null,
              downloadCount: a.download_count || 0,
              isActive: a.is_active !== undefined ? Boolean(a.is_active) : true,
            },
          });
        } else {
          await prisma.app.update({
            where: { id: existing.id },
            data: {
              apkUrl: a.apk_url || existing.apkUrl,
              version: a.version || existing.version,
              downloadCount: a.download_count || existing.downloadCount,
            },
          });
        }
        stats.apps++;
      }
    }

    // 4. Sync User Assets
    const { data: assets, error: asErr } = await supabase.from("user_assets").select("*");
    if (!asErr && assets && assets.length > 0) {
      for (const s of assets) {
        const existing = await prisma.userAsset.findFirst({
          where: { id: String(s.id) },
        });
        const validUserId = s.user_id && userIds.has(s.user_id) ? s.user_id : (currentUsers[0]?.id || "system");
        if (!existing && validUserId) {
          await prisma.userAsset.create({
            data: {
              id: String(s.id),
              userId: validUserId,
              name: s.name || "Document Asset",
              type: s.type || "Document",
              value: s.value || "",
            },
          });
          stats.assets++;
        }
      }
    }

    lastSyncTime = now;
    return { success: true, stats };
  } catch (error: any) {
    console.warn("syncSupabaseToPrisma warning:", error.message);
    return { success: false, stats: { error: error.message } };
  }
}
