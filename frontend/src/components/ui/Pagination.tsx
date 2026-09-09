export default function Pagination() {
  return <div className="flex items-center justify-between border-t px-5 py-4 text-sm text-slate-500">
    <span>Showing 1–10 of 10</span><div className="flex gap-2"><button className="rounded border px-3 py-1.5">Previous</button><button className="rounded bg-[#c2185b] px-3 py-1.5 text-white">1</button><button className="rounded border px-3 py-1.5">Next</button></div>
  </div>;
}
