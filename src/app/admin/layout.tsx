import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardClientShell from "@/components/dashboard/DashboardClientShell";


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  // Authorization check: Only actual ADMIN or effective ADMIN
  if (user.effectiveRole !== "ADMIN" && user.actualRole !== "ADMIN") {
    redirect("/login");
  }

  return (
    <DashboardClientShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        effectiveRole: user.effectiveRole,
        actualRole: user.actualRole,
        jobTitle: user.jobTitle,
      }}
    >
      {children}
    </DashboardClientShell>
  );
}
