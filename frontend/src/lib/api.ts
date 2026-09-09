import axios from 'axios';
export const api=axios.create({baseURL:process.env.NEXT_PUBLIC_API_URL||'http://localhost:3001',headers:{'Content-Type':'application/json'}});
api.interceptors.request.use(c=>{if(typeof window!=='undefined'){const t=localStorage.getItem('cbe_access_token');if(t)c.headers.Authorization=`Bearer ${t}`;}return c});
api.interceptors.response.use(r=>r,e=>{if(e.response?.status===401&&typeof window!=='undefined'){localStorage.removeItem('cbe_access_token');localStorage.removeItem('cbe_user');}return Promise.reject(e)});
export const blobDownload=async(path:string,params:any={})=>{const r=await api.get(path,{params,responseType:'blob'});const url=URL.createObjectURL(r.data);const a=document.createElement('a');a.href=url;a.download=path.split('/').filter(Boolean).pop()+'.'+(path.endsWith('/pdf')?'pdf':'xlsx');a.click();URL.revokeObjectURL(url)};
