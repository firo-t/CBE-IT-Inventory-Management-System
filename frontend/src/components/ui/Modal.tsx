import React from "react";
export default function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
    <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
      <div className="flex items-center justify-between border-b p-5"><h2 className="font-semibold">{title}</h2><button onClick={onClose}>✕</button></div>
      <div className="p-5">{children}</div>
    </div>
  </div>;
}
