import type { GeoPositionDto, ScanResultDto, VoiceNoteDto } from "@/dto/field-mobile.dto";

export interface BarcodeScanner { scan(source: ImageBitmapSource): Promise<ScanResultDto[]>; }
export interface CameraCapture { capture(file: File): Promise<{ file: File; previewUrl: string }>; }
export interface VoiceNoteRecorder { start(): Promise<void>; stop(workOrderId: string): Promise<VoiceNoteDto>; }
export interface GpsCapture { capture(): Promise<GeoPositionDto>; }
export interface SignatureCapture { clear(): void; exportPng(): string; }
