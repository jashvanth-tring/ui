import { useEffect, useRef, useState } from 'react';

export default function InlineStatusEditor({
  currentStatus,
  statuses,
  onStatusChange,
}: {
  currentStatus: { id: number; statusName: string } | null | undefined;
  statuses: { id: number; statusName: string }[];
  onStatusChange: (newStatusId: number, newStatusName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const [selected, setSelected] = useState(currentStatus ?? null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement | null>(null); 
  
  useEffect(() => {
    setSelected(currentStatus ?? null);
  }, [currentStatus?.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 200);
      setDropPos({
        top: rect.bottom,
        left: rect.left,
        width: Math.max(rect.width, 160),
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

    // ✅ Smooth scroll to selected item
  useEffect(() => {
    if (!open || !selectedRef.current)return ;
    
    const timeout = setTimeout(() => {
      selectedRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, 50);

  return () => clearTimeout(timeout);
}, [open]);

  const handleToggle = () => {
    if (!open && wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 200);
      setDropPos({
        top: rect.bottom,
        left: rect.left,
        width: Math.max(rect.width, 160),
      });
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={wrapRef} className="relative inline-block">
     <button
  type="button"
  onClick={handleToggle}
  aria-expanded={open}
  className={`inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 cursor-pointer hover:bg-slate-200 transition-colors select-none ${
    open ? 'ring-1 ring-slate-400' : ''
  }`}
>
  {selected?.statusName || '—'}
  <svg
    className="w-2.5 h-2.5 opacity-40"
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M2 3.5l3 3 3-3" />
  </svg>
</button>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: dropUp ? undefined : dropPos.top + 4,
            bottom: dropUp ? window.innerHeight - dropPos.top + 4 : undefined,
            left: dropPos.left,
            minWidth: dropPos.width,
            zIndex: 9999,
          }}
          className="max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg py-1"
        >
          {(statuses ?? []).map((s) => (
            <div
              key={s.id}
              ref={selected?.id === s.id ? selectedRef : null} 
              onClick={() => {
                setSelected(s);
                onStatusChange(s.id, s.statusName);
                setOpen(false);
              }}
              className={`flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                selected?.id === s.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {s.statusName}
              {selected?.id === s.id && (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M2 6l2.5 2.5L10 3" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}