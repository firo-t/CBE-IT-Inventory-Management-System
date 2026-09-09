export interface User {
  user_id: string;
  full_name: string;
  employee_id: string;
  phone: string;
  email: string;
  role: string;
  branch?: string;
  status: "Active" | "Inactive";
}
