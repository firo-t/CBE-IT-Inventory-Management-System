import {useCallback,useState} from "react"; import {api} from "@/lib/api";
export function useNotifications(){const [notifications,setNotifications]=useState<any[]>([]);const fetchNotifications=useCallback(async()=>{const r=await api.get("/notifications");setNotifications(r.data)},[]);return {notifications,fetchNotifications};}
