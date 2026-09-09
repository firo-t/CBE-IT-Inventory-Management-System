export interface Assignment {
  assignment_id: string;
  asset: string;
  employee_id: string;
  employee_name: string;
  branch: string;
  assigned_date: string;
  assigned_by: string;
  returned_date?: string;
  status: string;
}
