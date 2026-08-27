"use client";

import { useState } from "react";
import { BrowserBarcodeScanner } from "@/infrastructure/mobile/BrowserCaptureAdapters";

export function BarcodeScannerPanel() {
  const [result, setResult] = useState(""); const [error, setError] = useState("");
  const scan = async (file: File | undefined) => { if (!file) return; setError(""); try { const bitmap = await createImageBitmap(file); const values = await new BrowserBarcodeScanner().scan(bitmap); bitmap.close(); setResult(values[0]?.value ?? "No QR code or barcode detected."); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to scan this image."); } };
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-semibold">Scan asset or work order</h2><p className="mt-2 text-sm text-slate-500">Use the rear camera to capture a QR code or barcode. Manual entry remains available when browser scanning is unsupported.</p><input type="file" accept="image/*" capture="environment" onChange={(event) => scan(event.target.files?.[0])} className="mt-4 block w-full text-sm"/><label className="mt-4 block text-sm font-medium">Detected or manual value<input value={result} onChange={(event) => setResult(event.target.value)} placeholder="Asset ID, work-order ID, or barcode" className="mt-2 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-3 dark:border-slate-700"/></label>{error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}</section>;
}
