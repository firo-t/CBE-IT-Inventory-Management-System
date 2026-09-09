 "use client";
import {useEffect,useState} from "react"; import {getSession} from "@/lib/auth"; import type {UserSession} from "@/types/auth";
export function useAuth(){const [user,setUser]=useState<UserSession|null>(null); useEffect(()=>setUser(getSession()),[]); return {user,isAuthenticated:!!user};}
