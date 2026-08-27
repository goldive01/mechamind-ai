import { BarcodeScannerPanel } from "@/components/mobile/BarcodeScannerPanel";

export default function MobileScanPage() { return <div className="space-y-5"><div><h1 className="text-2xl font-semibold">QR and barcode scanner</h1><p className="mt-1 text-sm text-slate-500">Mobile capture foundation for resolving field identifiers.</p></div><BarcodeScannerPanel/></div>; }
