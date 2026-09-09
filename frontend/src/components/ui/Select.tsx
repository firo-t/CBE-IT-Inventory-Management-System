import React from "react";
export default function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return <label className="block text-sm font-medium text-slate-700">
    {label && <span className="mb-1.5 block">{label}</span>}
    <select {...props} className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 outline-none focus:border-[#c2185b] focus:ring-2 focus:ring-[#c2185b]/10">{children}</select>
  </label>;
}
