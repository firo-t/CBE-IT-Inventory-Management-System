export type Role =
  | "ADMIN"
  | "INVENTORY_OFFICER"
  | "TECHNICIAN"
  | "BRANCH_MANAGER";

export interface UserSession {
  user_id: string;
  full_name: string;
  employee_id: string;
  email: string;
  role: Role;
  branch_id?: string;
}
