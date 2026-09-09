'use client';
import {useEffect,useState} from 'react';
import {api} from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Page from '@/components/ui/Page';
import Stat from '@/components/ui/Stat';
import {Package,Building2,Users,CheckCircle,Truck,Wrench,AlertTriangle,Activity,ClipboardCheck,Clock} from 'lucide-react';
import {getUser} from '@/lib/auth';
const roleName=(u:any)=>u?.role||'';
export default function Dashboard(){
 const [d,setD]=useState<any>(null); const [err,setErr]=useState(''); const u=getUser();
 useEffect(()=>{api.get('/dashboard').then(r=>setD(r.data)).catch(e=>setErr(e.response?.data?.message||'Unable to load dashboard.'))},[]);
 const s=d?.summary||{}; const recent=d?.recent||{}; const role=roleName(u);
 let stats:any[]=[]; let activity:any[]=[];
 if(role==='System Administrator / Admin'){stats=[['Total Assets',s.totalAssets,Package],['Total Branches',s.totalBranches,Building2],['Total Users',s.totalUsers,Users],['Available Assets',s.availableAssets,CheckCircle],['Assigned Assets',s.assignedAssets,Package],['Damaged Assets',s.damagedAssets,AlertTriangle],['Maintenance Active',Object.entries(s.maintenanceStats||{}).filter(([k])=>!['COMPLETED','CLOSED'].includes(k)).reduce((a,[_k,v])=>a+Number(v),0),Wrench]];activity=recent.recentActivities||[]}
 else if(role==='IT Inventory Officer'){stats=[['Available Assets',s.availableAssets,CheckCircle],['Assigned Assets',s.assignedAssets,Package],['Pending Dispatches',s.pendingDispatches,Truck],['Active Maintenance',s.activeMaintenance,Wrench]];activity=[...(recent.recentDispatchedAssets||[]),...(recent.recentReceivedAssets||[])].slice(0,8)}
 else if(role==='Hardware Technician'){stats=[['Assigned Requests',s.assignedRequests,ClipboardCheck],['Pending Inspection',s.pendingInspections,Clock],['Under Repair',s.underRepair,Wrench],['Waiting for Parts',s.waitingForParts,Package],['Completed',s.completedMaintenance,CheckCircle]];activity=recent.recentAssignedRequests||[]}
 else {stats=[['Branch Assets',s.branchTotalAssets,Package],['Assigned Equipment',s.branchAssignedAssets,ClipboardCheck],['In Transit',s.pendingInTransit,Truck],['Maintenance Requests',s.branchMaintenanceRequests,Wrench]];activity=recent.recentBranchMaintenance||[]}
 return <DashboardLayout><Page title="Dashboard" description={`${role || 'User'} operational overview.`}>{err&&<div className="alert" style={{marginBottom:16}}>{err}</div>}<div className="grid grid4">{stats.map(([l,v,I])=><Stat key={l} label={l} value={v??'—'} icon={I}/>)}</div><div className="grid grid2" style={{marginTop:18}}><div className="card"><h2 className="section-title">Role overview</h2><div className="muted">Dashboard data is supplied directly by <code>GET /dashboard</code> for your authenticated role.</div><div style={{marginTop:18}} className="activity"><span className="dot"/><div><b>{d?.role||role||'—'}</b><div className="muted">Role-specific inventory and maintenance metrics.</div></div></div></div><div className="card"><h2 className="section-title"><Activity size={17} style={{verticalAlign:'middle'}}/> Recent activity</h2>{activity.slice(0,7).map((x:any,i:number)=><div className="activity" key={i}><span className="dot"/><div><b>{x.action||x.title||x.status||x.asset?.tag_no||'Activity'}</b><div className="muted">{x.message||x.problem_description||x.created_at||x.reported_date||x.dispatched_date||''}</div></div></div>)}{!activity.length&&<div className="empty">No recent activity.</div>}</div></div></Page></DashboardLayout>
}
