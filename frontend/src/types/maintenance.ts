export interface MaintenanceRequest {
  request_id: string;
  asset: string;
  branch: string;
  reported_by: string;
  problem_description: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  reported_date: string;
  status: string;
}

export interface MaintenanceRecord {
  maintenance_id: string;
  request_id: string;
  technician: string;
  diagnosis?: string;
  repair_action?: string;
  parts_used?: string;
  start_date?: string;
  completion_date?: string;
  remarks?: string;
  status: string;
}
