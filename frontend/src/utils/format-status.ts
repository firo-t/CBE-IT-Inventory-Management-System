export function statusClass(status: string) {
  const s = status.toLowerCase();
  if (["available", "completed", "repaired", "received", "active"].includes(s))
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["assigned", "in transit", "under inspection", "reported"].includes(s))
    return "bg-blue-50 text-blue-700 border-blue-200";
  if (["under maintenance", "under repair", "waiting for parts", "pending"].includes(s))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (["damaged", "lost", "disposed", "retired", "critical"].includes(s))
    return "bg-red-50 text-red-700 border-red-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}
