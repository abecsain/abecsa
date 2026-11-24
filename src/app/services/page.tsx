import { Suspense } from "react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";
import SolutionsEngine from "@/components/solutions/SolutionsEngine";

export const metadata = {
  title: "Services & Dynamic Pricing Engine | ABECSA",
  description:
    "Interactive software solutions configurator, custom package builder, real-time database capacity estimator, and dynamic milestone quotation engine.",
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; package?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialTab = resolvedParams?.tab?.toUpperCase() || "BUILDER";

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <PublicNavbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-500">Loading Dynamic Pricing Engine...</p>
              </div>
            </div>
          }
        >
          <SolutionsEngine initialTab={initialTab} />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}
