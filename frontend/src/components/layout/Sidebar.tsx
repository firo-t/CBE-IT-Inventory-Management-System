 "use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Building2, Package, ClipboardList, Truck, Wrench, BarChart3, Bell, ScrollText, Settings, LogOut } from "lucide-react";
import { getSession, logout } from "@/lib/auth";
import { useEffect, useState } from "react";
import type { Role } from "@/types/auth";

const nav: Record<Role, { label: string; href: string; icon: any }[]> = {
  ADMIN: [
    {label:"Dashboard",href:"/dashboard",icon:LayoutDashboard},{label:"Users",href:"/users",icon:Users},{label:"Branches",href:"/branches",icon:Building2},
    {label:"Assets",href:"/assets",icon:Package},{label:"Reports",href:"/reports",icon:BarChart3},{label:"Audit Logs",href:"/audit-logs",icon:ScrollText},
    {label:"Notifications",href:"/notifications",icon:Bell},{label:"Settings",href:"/settings",icon:Settings}
  ],
  INVENTORY_OFFICER: [
    {label:"Dashboard",href:"/dashboard",icon:LayoutDashboard},{label:"Assets",href:"/assets",icon:Package},{label:"Assignments",href:"/assignments",icon:ClipboardList},
    {label:"Dispatches",href:"/dispatches",icon:Truck},{label:"Maintenance Requests",href:"/maintenance/requests",icon:Wrench},{label:"Reports",href:"/reports",icon:BarChart3}
  ],
  TECHNICIAN: [
    {label:"Dashboard",href:"/dashboard",icon:LayoutDashboard},{label:"Maintenance",href:"/maintenance",icon:Wrench},{label:"Maintenance Requests",href:"/maintenance/requests",icon:ClipboardList},{label:"Assets",href:"/assets",icon:Package}
  ],
  BRANCH_MANAGER: [
    {label:"Dashboard",href:"/dashboard",icon:LayoutDashboard},{label:"Assets",href:"/assets",icon:Package},{label:"Maintenance Requests",href:"/maintenance/requests",icon:Wrench},{label:"Dispatches",href:"/dispatches",icon:Truck}
  ]
};

export default function Sidebar() {
  const path = usePathname(); const [role,setRole]=useState<Role>("ADMIN");
  useEffect(()=>{ const s=getSession(); if(s) setRole(s.role as Role); },[]);
  return <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-[#9b1749] text-white">
    <div className="border-b border-white/15 px-6 py-6"><div className="text-xl font-bold">CBE</div><div className="mt-1 text-xs text-white/70">IT Inventory Management</div></div>
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
      {nav[role].map(({label,href,icon:Icon})=><Link key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${path===href || path.startsWith(href+"/") ? "bg-white/15 font-semibold" : "text-white/80 hover:bg-white/10"}`}><Icon size={18}/>{label}</Link>)}
    </nav>
    <button onClick={()=>{logout();location.href="/login"}} className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10"><LogOut size={18}/>Sign out</button>
  </aside>;
}


