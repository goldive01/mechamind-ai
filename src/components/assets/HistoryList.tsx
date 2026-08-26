interface HistoryItem {
  id: string;
  title: string;
  date: string;
  detail?: string | null;
  badge?: string;
}

interface HistoryListProps {
  items: HistoryItem[];
  emptyMessage: string;
}

export function HistoryList({ items, emptyMessage }: HistoryListProps) {
  if (items.length === 0) return <p className="text-sm text-slate-600 dark:text-slate-400">{emptyMessage}</p>;

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      {items.map((item) => (
        <div key={item.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
          <div><p className="font-medium">{item.title}</p>{item.detail ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.detail}</p> : null}<p className="mt-2 text-xs text-slate-500">{item.date}</p></div>
          {item.badge ? <span className="shrink-0 rounded-full border border-slate-300 px-3 py-1 text-xs dark:border-slate-700">{item.badge}</span> : null}
        </div>
      ))}
    </div>
  );
}
