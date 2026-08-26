"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { CopilotResponse } from "@/services/copilot/ResponseParser";

interface AssetOption { assetId: string; name: string }
interface UiMessage { id: string; role: "user" | "assistant"; content: string; response?: CopilotResponse | null }
interface StoredConversation { id: string; assetIds: string[]; messages: Array<UiMessage & { createdAt: string }> }
type StreamEvent = { type: "conversation"; conversationId: string } | { type: "delta"; content: string } | { type: "complete"; messageId: string; response: CopilotResponse } | { type: "error"; error: string };

const storageKey = "mechamind-copilot-conversation";
const welcome: UiMessage = { id: "welcome", role: "assistant", content: "I’m ready to investigate asset health, inspections, maintenance history, and live sensor behaviour. Select relevant assets and describe the engineering question." };

function Markdown({ children }: { children: string }) {
  return <div className="space-y-3 break-words [&_a]:text-cyan-600 [&_a]:underline [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 dark:[&_code]:bg-slate-800 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:whitespace-pre-wrap [&_ul]:list-disc [&_ul]:pl-5"><ReactMarkdown>{children}</ReactMarkdown></div>;
}

function MessageBubble({ message }: { message: UiMessage }) {
  const assistant = message.role === "assistant";
  return <div className={`flex ${assistant ? "justify-start" : "justify-end"}`}><article className={`max-w-3xl rounded-2xl px-5 py-4 text-sm leading-7 ${assistant ? "border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200" : "bg-cyan-500 text-white"}`}><Markdown>{message.content}</Markdown>{message.response ? <div className="mt-4 space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700"><span className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] dark:border-slate-700">{message.response.severity}</span>{message.response.recommendations.length ? <div><p className="font-semibold">Recommendations</p><ul className="mt-2 list-disc space-y-1 pl-5">{message.response.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}{message.response.evidence.length ? <div><p className="font-semibold">Evidence</p><ul className="mt-2 space-y-2">{message.response.evidence.map((item, index) => <li key={`${item.assetId}-${item.source}-${index}`} className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/70"><span className="font-semibold">{item.assetId} · {item.source}</span><p className="mt-1">{item.detail}</p></li>)}</ul></div> : null}</div> : null}</article></div>;
}

export function CopilotChat({ assets }: { assets: AssetOption[] }) {
  const [messages, setMessages] = useState<UiMessage[]>([welcome]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    const id = window.localStorage.getItem(storageKey);
    if (!id) return;
    queueMicrotask(() => setRestoring(true));
    void fetch("/api/copilot/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "load", conversationId: id }) })
      .then(async (response) => {
        if (!response.ok) throw new Error("Stored conversation is unavailable.");
        const payload = await response.json() as { conversation: StoredConversation };
        setConversationId(payload.conversation.id);
        setSelectedAssets(payload.conversation.assetIds);
        setMessages(payload.conversation.messages.length ? payload.conversation.messages : [welcome]);
      })
      .catch(() => window.localStorage.removeItem(storageKey))
      .finally(() => setRestoring(false));
  }, []);

  const toggleAsset = (assetId: string) => setSelectedAssets((current) => current.includes(assetId) ? current.filter((id) => id !== assetId) : current.length < 8 ? [...current, assetId] : current);
  const newConversation = () => { setConversationId(null); setMessages([welcome]); setSelectedAssets([]); setError(null); window.localStorage.removeItem(storageKey); };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || loading) return;
    const userMessage: UiMessage = { id: crypto.randomUUID(), role: "user", content };
    const streamId = crypto.randomUUID();
    setMessages((current) => [...current, userMessage, { id: streamId, role: "assistant", content: "" }]);
    setInput(""); setLoading(true); setError(null);
    try {
      const response = await fetch("/api/copilot/chat", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" }, body: JSON.stringify({ action: "chat", conversationId: conversationId ?? undefined, message: content, assetIds: selectedAssets }) });
      if (!response.ok || !response.body) { const payload = await response.json().catch(() => null) as { error?: string } | null; throw new Error(payload?.error ?? "Unable to reach the engineering copilot."); }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const item of lines) {
          if (!item) continue;
          const event = JSON.parse(item) as StreamEvent;
          if (event.type === "conversation") { setConversationId(event.conversationId); window.localStorage.setItem(storageKey, event.conversationId); }
          if (event.type === "delta") setMessages((current) => current.map((message) => message.id === streamId ? { ...message, content: message.content + event.content } : message));
          if (event.type === "complete") setMessages((current) => current.map((message) => message.id === streamId ? { id: event.messageId, role: "assistant", content: event.response.answer, response: event.response } : message));
          if (event.type === "error") throw new Error(event.error);
        }
        if (done) break;
      }
    } catch (caught) {
      setMessages((current) => current.filter((message) => message.id !== streamId || message.content));
      setError(caught instanceof Error ? caught.message : "Unable to reach the engineering copilot.");
    } finally { setLoading(false); }
  };

  return <div className="grid min-h-[calc(100vh-13rem)] gap-6 xl:grid-cols-[280px_1fr]">
    <aside className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Asset context</p><button type="button" onClick={newConversation} disabled={loading} className="text-xs font-medium text-cyan-600 hover:text-cyan-500 disabled:opacity-50">New chat</button></div><p className="mt-2 text-xs leading-5 text-slate-500">Select up to eight assets to ground the engineering response.</p><div className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto">{assets.map((asset) => <label key={asset.assetId} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${selectedAssets.includes(asset.assetId) ? "border-cyan-500 bg-cyan-500/10" : "border-slate-200 dark:border-slate-800"}`}><input type="checkbox" checked={selectedAssets.includes(asset.assetId)} onChange={() => toggleAsset(asset.assetId)} className="mt-1" /><span><span className="font-medium">{asset.assetId}</span><span className="mt-1 block text-xs text-slate-500">{asset.name}</span></span></label>)}</div></aside>
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 shadow-sm dark:border-slate-800 dark:bg-slate-950/60"><div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><p className="text-sm font-semibold">Engineering Copilot</p></div><p className="mt-1 text-xs text-slate-500">{restoring ? "Restoring conversation…" : selectedAssets.length ? `${selectedAssets.length} assets in context` : "General engineering mode"}</p></div><div className="flex-1 space-y-5 overflow-y-auto p-6">{messages.map((message) => message.content ? <MessageBubble key={message.id} message={message} /> : null)}{loading && !messages.at(-1)?.content ? <div className="flex justify-start"><div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900" aria-label="Copilot is typing"><span className="h-2 w-2 animate-bounce rounded-full bg-cyan-500" /><span className="h-2 w-2 animate-bounce rounded-full bg-cyan-500 [animation-delay:120ms]" /><span className="h-2 w-2 animate-bounce rounded-full bg-cyan-500 [animation-delay:240ms]" /></div></div> : null}<div ref={endRef} /></div><div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={3} maxLength={8000} placeholder="Ask about failure risk, inspection findings, sensor anomalies, or maintenance actions…" className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950" disabled={loading || restoring} />{error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}<div className="mt-3 flex items-center justify-between"><p className="text-xs text-slate-500">Enter to send · Shift+Enter for a new line</p><button type="button" onClick={() => void sendMessage()} disabled={!input.trim() || loading || restoring} className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Thinking…" : "Send"}</button></div></div></section>
  </div>;
}
