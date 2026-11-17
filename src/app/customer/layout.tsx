import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import DashboardClientShell from "@/components/dashboard/DashboardClientShell";
import CustomerBottomNav from "@/components/customer/CustomerBottomNav";


export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  // Authorization check: CUSTOMER or ADMIN
  if (user.effectiveRole !== "CUSTOMER" && user.actualRole !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="relative pb-16 md:pb-0">
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

      {/* Mobile App Bottom Navigation Bar */}
      <CustomerBottomNav />
    </div>
  );
}
