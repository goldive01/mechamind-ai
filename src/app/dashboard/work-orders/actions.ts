"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assignWorkOrderSchema, changeWorkOrderStatusSchema, createWorkOrderFromForm } from "@/dto/work-order.dto";
import { createWorkOrderService } from "@/services/workOrderFactory";

const refresh = (id: string, assetId?: string) => { revalidatePath("/dashboard/work-orders"); revalidatePath(`/dashboard/work-orders/${id}`); if (assetId) { revalidatePath(`/dashboard/assets/${assetId}`); revalidatePath(`/dashboard/assets/${assetId}/timeline`); } };
export async function createWorkOrder(formData: FormData) { const order = await createWorkOrderService().create(createWorkOrderFromForm(formData)); refresh(order.id, order.assetId); redirect(`/dashboard/work-orders/${order.id}`); }
export async function assignWorkOrder(formData: FormData) { const input = assignWorkOrderSchema.parse({ workOrderId: formData.get("workOrderId"), assignedTo: formData.get("assignedTo") || null }); const order = await createWorkOrderService().assign(input); refresh(order.id, order.assetId); }
export async function changeWorkOrderStatus(formData: FormData) { const input = changeWorkOrderStatusSchema.parse({ workOrderId: formData.get("workOrderId"), status: formData.get("status") }); const order = await createWorkOrderService().changeStatus(input); refresh(order.id, order.assetId); }
