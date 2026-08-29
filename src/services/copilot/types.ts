export type CopilotRole = "user" | "assistant";

export interface CopilotMessage {
  role: CopilotRole;
  content: string;
}

export interface CopilotAlert { severity: "low" | "medium" | "high" | "critical"; source: "health" | "sensor" | "inspection" | "alert"; message: string; recommendation?: unknown }

export interface CopilotAssetContext {
  access?: { userId: string; role: string | null; permissions: string[]; organisationId?: string; organisationName?: string };
  asset: {
    assetId: string;
    status: string;
    createdAt: string;
  };
  equipment: {
    name: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    category: string;
    location: string | null;
    description: string | null;
  };
  inspections: Array<{
    date: string;
    condition: string;
    notes: string | null;
    report: { diagnosis: string; recommendations: string; riskLevel: string } | null;
  }>;
  maintenanceHistory: Array<{
    date: string;
    type: string;
    performedBy: string;
    notes: string | null;
  }>;
  sensorReadings: Array<{
    deviceName: string;
    recordedAt: string;
    temperature: number | null;
    humidity: number | null;
    vibration: number | null;
    voltage: number | null;
    current: number | null;
  }>;
  health: {
    overallHealth: number;
    mechanicalHealth: number;
    electricalHealth: number;
    safetyScore: number;
    failureProbability: number;
    maintenancePriority: string;
    drivers: string[];
  };
  alerts: CopilotAlert[];
  workOrders: Array<{ id: string; title: string; description: string; priority: string; status: string; assignedTo: string | null; scheduledStart: string | null; dueDate: string | null; assignedEngineer?: { name: string; skills: string[] } | null; team?: string | null }>;
  inventory: { allocatedParts: Array<{ workOrderId: string; partNumber: string; name: string; quantity: number; availableQuantity: number; warehouse: string; shelf: string | null; deducted: boolean; repairReadiness: string }>; compatibleParts: Array<{ partNumber: string; name: string; availableQuantity: number; warehouse: string; shelf: string | null; repairReadiness: string }>; lowStock: Array<{ partNumber: string; name: string; availableQuantity: number; reorderLevel: number; warehouse: string; shelf: string | null }> };
}

export interface CopilotPrompt {
  system: string;
  user: string;
}

export interface CopilotMemoryContext { id: string; citation: string; sourceType: string; sourceId: string; assetId: string | null; title: string; summary: string; occurredAt: string; confidence: number; rank: number; successful: boolean | null; ranking: { recency: number; similarity: number; confidence: number; successOutcome: number; frequency: number } }
export interface CopilotKnowledgeContext { nodes: Array<{ id: string; citation: string; type: string; key: string; label: string; confidence: number }>; edges: Array<{ id: string; fromNodeId: string; toNodeId: string; relationship: string; confidence: number }>; facts: Array<{ id: string; nodeId: string; predicate: string; value: string; confidence: number }> }
