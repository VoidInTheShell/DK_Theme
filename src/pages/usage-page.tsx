import { UsageExplorer } from "@/components/usage/usage-explorer";

export function UsagePage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 lg:px-6">
      <UsageExplorer selfOnly />
    </div>
  );
}
