import { createHmac, timingSafeEqual } from "node:crypto";
import type { ToolName } from "@/dto/tool-result.dto";

interface ConfirmationPayload { tool: ToolName; argumentsHash: string; expiresAt: number }
const encode = (value: string) => Buffer.from(value).toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

export class ConfirmationService {
  constructor(private readonly secret = process.env.COPILOT_CONFIRMATION_SECRET ?? process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY ?? "mechamind-local-confirmation-secret", private readonly ttlMs = 5 * 60_000) {}
  issue(tool: ToolName, input: unknown) {
    const payload: ConfirmationPayload = { tool, argumentsHash: this.hash(JSON.stringify(input)), expiresAt: Date.now() + this.ttlMs };
    const body = encode(JSON.stringify(payload));
    return { token: `${body}.${this.sign(body)}`, expiresAt: new Date(payload.expiresAt).toISOString() };
  }
  verify(token: string | undefined, tool: ToolName, input: unknown) {
    if (!token) return false;
    try {
      const [body, signature] = token.split(".");
      if (!body || !signature) return false;
      const expected = Buffer.from(this.sign(body));
      const actual = Buffer.from(signature);
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
      const payload = JSON.parse(decode(body)) as ConfirmationPayload;
      return payload.tool === tool && payload.argumentsHash === this.hash(JSON.stringify(input)) && payload.expiresAt >= Date.now();
    } catch { return false; }
  }
  private sign(value: string) { return createHmac("sha256", this.secret).update(value).digest("base64url"); }
  private hash(value: string) { return createHmac("sha256", this.secret).update(`args:${value}`).digest("hex"); }
}

