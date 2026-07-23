import { LineChart } from "lucide-react";
import RequireRole from "@/components/admin/RequireRole";

export default function AnalyticsPage() {
  return (
    <RequireRole roles={[]}>
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-adminNavy">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Traffic, language mix, and reader engagement.</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
        <LineChart size={28} className="mb-3 text-gray-500" />
        <h2 className="text-sm font-bold text-adminNavy">Coming soon</h2>
        <p className="mt-1.5 max-w-sm text-sm text-gray-500">
          There&apos;s no analytics endpoint in the backend yet, so this page doesn&apos;t show real numbers. Once a
          `/api/analytics` route exists (visits, active users, language mix, traffic sources), this page can be
          wired up to it.
        </p>
      </div>
    </div>
    </RequireRole>
  );
}
