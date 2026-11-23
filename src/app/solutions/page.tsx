import { Suspense } from "react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";
import SolutionsEngine from "@/components/solutions/SolutionsEngine";

export const metadata = {
  title: "Software & Solutions Catalog | Dynamic Pricing & Package Builder | ABECSA",
  description:
    "Explore ABECSA software catalog, configure custom business software bundles, estimate database capacities, compare packages, and calculate transparent dynamic pricing.",
};

export default function SolutionsPage({
  searchParams,
}: {
  searchParams?: { tab?: string; package?: string };
}) {
  const initialTab = searchParams?.tab?.toUpperCase() || "BUILDER";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicNavbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-500">Loading Solutions Engine...</p>
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
