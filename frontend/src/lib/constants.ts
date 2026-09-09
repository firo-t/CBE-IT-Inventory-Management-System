export const ROLES = {
  ADMIN: "ADMIN",
  INVENTORY_OFFICER: "INVENTORY_OFFICER",
  TECHNICIAN: "TECHNICIAN",
  BRANCH_MANAGER: "BRANCH_MANAGER",
} as const;

export const ASSET_STATUSES = [
  "Available", "Assigned", "In Transit", "Under Maintenance",
  "Damaged", "Lost", "Disposed", "Retired"
] as const;

export const MAINTENANCE_STATUSES = [
  "Reported", "Received", "Assigned", "Under Inspection",
  "Under Repair", "Waiting for Parts", "Repaired", "Completed", "Closed"
] as const;

export const ASSET_TYPES = [
  "Desktop Computer", "Laptop", "Monitor", "Printer", "UPS",
  "Scanner", "Keyboard", "Mouse", "Network Equipment", "Other IT Hardware"
] as const;
