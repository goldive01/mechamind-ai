import { z } from "zod";
import { workOrderPriorities, workOrderStatuses } from "@/domain/entities/WorkOrder";

const optionalDate = z.union([z.date(), z.iso.datetime().transform((value) => new Date(value))]).nullable().optional();
export const workOrderPrioritySchema = z.enum(workOrderPriorities);
export const workOrderStatusSchema = z.enum(workOrderStatuses);
export const createWorkOrderSchema = z.object({
  assetId: z.string().trim().min(1), title: z.string().trim().min(3).max(160), description: z.string().trim().min(3).max(5000),
  priority: workOrderPrioritySchema.default("Medium"), assignedTo: z.string().trim().min(2).max(120).nullable().optional(), scheduledStart: optionalDate, dueDate: optionalDate,
}).refine((value) => !value.scheduledStart || !value.dueDate || value.dueDate >= value.scheduledStart, { message: "Due date must be on or after the scheduled start.", path: ["dueDate"] });
export const assignWorkOrderSchema = z.object({ workOrderId: z.string().min(1), assignedTo: z.string().trim().min(2).max(120).nullable() });
export const changeWorkOrderStatusSchema = z.object({ workOrderId: z.string().min(1), status: workOrderStatusSchema });
export const workOrderListQuerySchema = z.object({ status: workOrderStatusSchema.optional(), priority: workOrderPrioritySchema.optional(), assetId: z.string().trim().optional(), assignedTo: z.string().trim().optional() }).default({});

export type CreateWorkOrderDto = z.infer<typeof createWorkOrderSchema>;
export type AssignWorkOrderDto = z.infer<typeof assignWorkOrderSchema>;
export type ChangeWorkOrderStatusDto = z.infer<typeof changeWorkOrderStatusSchema>;
export type WorkOrderListQueryDto = z.infer<typeof workOrderListQuerySchema>;

const dateFromForm = (value: FormDataEntryValue | null) => typeof value === "string" && value ? new Date(value) : null;
export function createWorkOrderFromForm(formData: FormData): CreateWorkOrderDto {
  return createWorkOrderSchema.parse({ assetId: formData.get("assetId"), title: formData.get("title"), description: formData.get("description"), priority: formData.get("priority"), assignedTo: formData.get("assignedTo") || null, scheduledStart: dateFromForm(formData.get("scheduledStart")), dueDate: dateFromForm(formData.get("dueDate")) });
}
