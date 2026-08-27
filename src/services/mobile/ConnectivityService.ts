export interface ConnectivityProbe { isOnline(): Promise<boolean>; }
export class ConnectivityService {
  constructor(private readonly probe: ConnectivityProbe) {}
  async status() { const checkedAt = new Date(); try { return { online: await this.probe.isOnline(), checkedAt }; } catch { return { online: false, checkedAt }; } }
}
export class AlwaysOnlineProbe implements ConnectivityProbe { async isOnline() { return true; } }
