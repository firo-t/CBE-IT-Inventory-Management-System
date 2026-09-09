 "use client";
import { Bell, Search } from "lucide-react";
import Link from "next/link";
export default function Navbar() {
 return <header className="fixed left-64 right-0 top-0 z-20 h-16 border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
  <div className="flex h-full items-center justify-between">
   <div className="relative w-80"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input placeholder="Search assets, tags, serial numbers..." className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-[#c2185b]"/></div>
   <div className="flex items-center gap-4"><Link href="/notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Bell size={19}/><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#c2185b]"/></Link><div className="flex items-center gap-3 border-l pl-4"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#fce7ef] font-bold text-[#9b1749]">A</div><div><div className="text-sm font-semibold">Administrator</div><div className="text-xs text-slate-500">System Administrator</div></div></div></div>
  </div>
 </header>;
}
