export type CopilotRole = "user" | "assistant";

export interface CopilotMessage {
  role: CopilotRole;
  content: string;
}

export interface CopilotAlert { severity: "low" | "medium" | "high" | "critical"; source: "health" | "sensor" | "inspection" | "alert"; message: string; recommendation?: unknown }

export interface CopilotAssetContext {
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
}

export interface CopilotPrompt {
  system: string;
  user: string;
}
