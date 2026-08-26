import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

interface AssetOption { id: string; assetId: string; name: string; }
export interface DeviceFormValues { assetId: string; deviceName: string; sensorType: string; macAddress: string; firmwareVersion: string; }
interface DeviceFormProps { action: (formData: FormData) => void | Promise<void>; assets: AssetOption[]; values?: DeviceFormValues; submitLabel: string; cancelHref: string; }
const inputClasses = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

export function DeviceForm({ action, assets, values, submitLabel, cancelHref }: DeviceFormProps) {
  return <form action={action}><Card title="Device information" description="Register the device against an asset and its linked equipment."><div className="grid gap-5 md:grid-cols-2"><label className="text-sm font-medium">Asset<select className={inputClasses} name="assetId" defaultValue={values?.assetId} required><option value="" disabled>Select an asset</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.assetId} · {asset.name}</option>)}</select></label><label className="text-sm font-medium">Device name<input className={inputClasses} name="deviceName" defaultValue={values?.deviceName} required /></label><label className="text-sm font-medium">Sensor type<input className={inputClasses} name="sensorType" defaultValue={values?.sensorType} placeholder="Multi-sensor" required /></label><label className="text-sm font-medium">MAC address<input className={inputClasses} name="macAddress" defaultValue={values?.macAddress} required /></label><label className="text-sm font-medium">Firmware version<input className={inputClasses} name="firmwareVersion" defaultValue={values?.firmwareVersion} required /></label></div><div className="mt-6 flex gap-3"><Button type="submit">{submitLabel}</Button><Button href={cancelHref} variant="secondary">Cancel</Button></div></Card></form>;
}
