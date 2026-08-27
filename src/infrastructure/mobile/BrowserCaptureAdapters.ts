import { geoPositionSchema, scanResultSchema, voiceNoteSchema, type GeoPositionDto, type ScanResultDto, type VoiceNoteDto } from "@/dto/field-mobile.dto";
import type { BarcodeScanner, CameraCapture, GpsCapture, VoiceNoteRecorder } from "@/services/mobile/CaptureAdapters";

interface DetectedBarcode { rawValue: string; format: string }
interface BarcodeDetectorInstance { detect(source: ImageBitmapSource): Promise<DetectedBarcode[]> }
interface BarcodeDetectorConstructor { new(options?: { formats?: string[] }): BarcodeDetectorInstance }

export class BrowserBarcodeScanner implements BarcodeScanner {
  async scan(source: ImageBitmapSource): Promise<ScanResultDto[]> { const Detector = (globalThis as typeof globalThis & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector; if (!Detector) throw new Error("Barcode scanning is not supported by this browser."); const values = await new Detector().detect(source); return values.map((item) => scanResultSchema.parse({ value: item.rawValue, format: item.format })); }
}
export class BrowserCameraCapture implements CameraCapture { async capture(file: File) { if (!file.type.startsWith("image/")) throw new Error("Camera capture must be an image."); return { file, previewUrl: URL.createObjectURL(file) }; } }
export class BrowserGpsCapture implements GpsCapture {
  capture(): Promise<GeoPositionDto> { return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition((position) => resolve(geoPositionSchema.parse({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy })), reject, { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 })); }
}
export class BrowserVoiceNoteRecorder implements VoiceNoteRecorder {
  private recorder: MediaRecorder | null = null; private startedAt = 0; private chunks: Blob[] = [];
  async start() { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); this.chunks = []; this.startedAt = Date.now(); this.recorder = new MediaRecorder(stream); this.recorder.ondataavailable = (event) => { if (event.data.size) this.chunks.push(event.data); }; this.recorder.start(); }
  async stop(workOrderId: string): Promise<VoiceNoteDto> { const recorder = this.recorder; if (!recorder) throw new Error("Voice recording has not started."); const blob = await new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(this.chunks, { type: recorder.mimeType || "audio/webm" })); recorder.stop(); recorder.stream.getTracks().forEach((track) => track.stop()); }); this.recorder = null; return voiceNoteSchema.parse({ workOrderId, mimeType: blob.type, durationMs: Math.max(1, Date.now() - this.startedAt), size: blob.size, localUri: URL.createObjectURL(blob) }); }
}
