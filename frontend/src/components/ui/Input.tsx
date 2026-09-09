import React from "react";
export default function Input({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return <label className="block text-sm font-medium text-slate-700">
    {label && <span className="mb-1.5 block">{label}</span>}
    <input {...props} className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 outline-none transition focus:border-[#c2185b] focus:ring-2 focus:ring-[#c2185b]/10" />
    {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
  </label>;
}
