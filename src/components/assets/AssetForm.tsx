import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

export interface AssetFormValues {
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  category: string;
  location: string;
  description: string;
  status: string;
  primaryImage: string;
}

interface AssetFormProps {
  action: (formData: FormData) => void | Promise<void>;
  values?: AssetFormValues;
  submitLabel: string;
  cancelHref: string;
}

const inputClasses = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

export function AssetForm({ action, values, submitLabel, cancelHref }: AssetFormProps) {
  return (
    <form action={action}>
      <Card title="Asset information" description="Record the operational and equipment details for this asset.">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-medium">Equipment name<input className={inputClasses} name="name" defaultValue={values?.name} required /></label>
          <label className="text-sm font-medium">Manufacturer<input className={inputClasses} name="manufacturer" defaultValue={values?.manufacturer} required /></label>
          <label className="text-sm font-medium">Model<input className={inputClasses} name="model" defaultValue={values?.model} required /></label>
          <label className="text-sm font-medium">Serial number<input className={inputClasses} name="serialNumber" defaultValue={values?.serialNumber} required /></label>
          <label className="text-sm font-medium">Category<input className={inputClasses} name="category" defaultValue={values?.category} required /></label>
          <label className="text-sm font-medium">Location<input className={inputClasses} name="location" defaultValue={values?.location} /></label>
          <label className="text-sm font-medium">Status
            <select className={inputClasses} name="status" defaultValue={values?.status ?? "Active"}>
              <option>Active</option><option>Needs Attention</option><option>Inactive</option>
            </select>
          </label>
          <label className="text-sm font-medium">Primary image path<input className={inputClasses} name="primaryImage" defaultValue={values?.primaryImage} placeholder="/uploads/2026/08/02/image.jpg" /></label>
          <label className="text-sm font-medium md:col-span-2">Description<textarea className={inputClasses} name="description" defaultValue={values?.description} rows={4} /></label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit">{submitLabel}</Button>
          <Button href={cancelHref} variant="secondary">Cancel</Button>
        </div>
      </Card>
    </form>
  );
}
