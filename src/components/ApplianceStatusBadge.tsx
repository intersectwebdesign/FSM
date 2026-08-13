export function ApplianceStatusBadge({
  overdue,
  result,
}: {
  overdue: boolean | null;
  result: string | null;
}) {
  if (!result) {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-800">
        Not yet tested
      </span>
    );
  }
  if (overdue) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        Retest due
      </span>
    );
  }
  if (result === "fail") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
        Fail
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
      Pass
    </span>
  );
}
