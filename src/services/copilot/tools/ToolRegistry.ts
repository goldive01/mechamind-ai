import type { ToolName } from "@/dto/tool-result.dto";
import type { ToolDefinition } from "@/services/copilot/tools/types";

export class ToolRegistry {
  private readonly definitions = new Map<ToolName, ToolDefinition>();
  constructor(definitions: ToolDefinition[]) { definitions.forEach((definition) => this.register(definition)); }
  register(definition: ToolDefinition) {
    if (this.definitions.has(definition.name)) throw new Error(`Tool already registered: ${definition.name}`);
    this.definitions.set(definition.name, definition);
  }
  get(name: ToolName) { return this.definitions.get(name); }
  list() { return [...this.definitions.values()]; }
}

