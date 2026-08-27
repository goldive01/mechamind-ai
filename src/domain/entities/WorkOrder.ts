export const workOrderPriorities = ["Low", "Medium", "High", "Critical"] as const;
export const workOrderStatuses = ["Draft", "Scheduled", "In Progress", "On Hold", "Completed", "Cancelled"] as const;

export type WorkOrderPriority = (typeof workOrderPriorities)[number];
export type WorkOrderStatus = (typeof workOrderStatuses)[number];

export interface WorkOrder {
  id: string;
  assetId: string;
  assetName: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assignedTo: string | null;
  scheduledStart: Date | null;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
