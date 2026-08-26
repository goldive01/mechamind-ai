"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

interface AnalysisResult {
  equipmentName: string;
  manufacturer: string;
  category: string;
  confidence: number;
  summary: string;
  detectedComponents: string[];
  safetyHazards: string[];
  possibleFaults: string[];
  maintenanceRecommendations: string[];
  estimatedCondition: string;
}

const initialResult: AnalysisResult = {
  equipmentName: "",
  manufacturer: "",
  category: "",
  confidence: 0,
  summary: "",
  detectedComponents: [],
  safetyHazards: [],
  possibleFaults: [],
  maintenanceRecommendations: [],
  estimatedCondition: "",
};

export default function ScannerPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult>(initialResult);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Unsupported image type. Upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image exceeds the maximum size of 10 MB.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setSaveSuccess(false);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const removeImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(null);
    setPreviewUrl(null);
    setError(null);
    setSaveSuccess(false);
  };

  const analyzeImage = async () => {
    if (!imageFile) {
      setError("Please upload an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(initialResult);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch("/api/ai/analyse", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to analyze image.");
      }

      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to analyze image.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveReport = async () => {
    if (!result.equipmentName) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      if (!imageFile) {
        throw new Error("The original image is no longer available. Upload it again before saving.");
      }

      const formData = new FormData();
      formData.append("analysis", JSON.stringify(result));
      formData.append("image", imageFile);

      const response = await fetch("/api/ai/save", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save report.");
      }

      setSaveSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save report.");
    } finally {
      setIsSaving(false);
    }
  };

  const summaryCards = useMemo(() => [
    { label: "Confidence", value: `${Math.round(result.confidence * 100)}%` },
    { label: "Condition", value: result.estimatedCondition || "Pending" },
    { label: "Hazards", value: String(result.safetyHazards.length || 0) },
  ], [result]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment scanner"
        description="Upload equipment imagery to receive AI-driven inspection analysis and save a report into the dashboard."
      />

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card title="Image input" description="Upload a single equipment image or drag and drop one here.">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${isDragging ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20" : "border-slate-300 dark:border-slate-700"}`}
          >
            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative mx-auto h-72 overflow-hidden rounded-xl">
                  <Image src={previewUrl} alt="Preview" fill unoptimized className="object-contain" />
                </div>
                <div className="flex justify-center gap-3">
                  <label className="cursor-pointer rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
                    Choose another image
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
                  </label>
                  <button onClick={removeImage} className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600">
                    Remove image
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-4xl">📷</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Drop an image here or browse from your device.</p>
                <label className="inline-flex cursor-pointer rounded-full bg-cyan-500 px-5 py-3 text-sm font-medium text-white">
                  Upload image
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
                </label>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={analyzeImage} disabled={!imageFile || isLoading}>
              {isLoading ? "Analyzing..." : "Analyze image"}
            </Button>
          </div>

          {isLoading ? (
            <div className="mt-4 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
              Processing image with AI...
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </Card>

        <Card title="Analysis results" description="Structured insights from the AI model appear here.">
          {result.equipmentName ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {summaryCards.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Summary</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{result.summary}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Equipment</h3>
                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{result.equipmentName} · {result.manufacturer} · {result.category}</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Detected components</h3>
                  <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
                    {result.detectedComponents.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Safety hazards</h3>
                  <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
                    {result.safetyHazards.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Possible faults</h3>
                  <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
                    {result.possibleFaults.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Recommendations</h3>
                  <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
                    {result.maintenanceRecommendations.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={saveReport} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save report"}
                </Button>
                {saveSuccess ? <p className="text-sm text-emerald-600">Report saved successfully.</p> : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">No analysis available yet. Upload an image to begin.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
