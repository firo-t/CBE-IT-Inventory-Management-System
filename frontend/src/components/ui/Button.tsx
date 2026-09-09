import React from "react";

export default function Button({
  children, variant = "primary", type = "button", onClick, disabled
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-[#c2185b] text-white hover:bg-[#9b1749]",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-slate-600 hover:bg-slate-100"
  };
  return <button type={type} disabled={disabled} onClick={onClick}
    className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${styles[variant]}`}>
    {children}
  </button>;
}
