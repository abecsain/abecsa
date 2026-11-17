import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import DashboardClientShell from "@/components/dashboard/DashboardClientShell";


export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  // Authorization check: Only MANAGER or ADMIN
  if (user.effectiveRole !== "MANAGER" && user.actualRole !== "ADMIN") {
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
