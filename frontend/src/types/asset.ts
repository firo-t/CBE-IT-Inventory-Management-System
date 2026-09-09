export interface Asset {
  asset_id: string;
  tag_no: string;
  serial_no: string;
  asset_type_id?: string;
  asset_type?: string;
  model: string;
  ws_no?: string;
  condition: string;
  description?: string;
  status: string;
  current_branch_id?: string;
  current_branch?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AssetFormValues {
  tag_no: string;
  serial_no: string;
  asset_type: string;
  model: string;
  ws_no?: string;
  condition: string;
  description?: string;
  status: string;
  current_branch_id?: string;
}
