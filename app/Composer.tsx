'use client';

import { useId, useRef, useState } from 'react';
import { MAX_CHARS } from './lib';
import { SAMPLES } from './samples';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onSample: (text: string) => void;
  busy: boolean;
};

export function Composer({ value, onChange, onSubmit, onSample, busy }: Props) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ingest(file: File) {
    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('/api/extract', { method: 'POST', body: data });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Upload failed.');
      onChange(body.text);
      setSource(`${body.name}, ${body.pages} page${body.pages === 1 ? '' : 's'}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const length = value.length;
  const over = length > MAX_CHARS;
  const empty = value.trim().length < 40;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!over && !empty && !busy) onSubmit();
      }}
      className="rounded-[22px] border border-line bg-card/90 p-2 shadow-[0_30px_80px_-40px_rgba(74,26,32,0.35)] backdrop-blur"
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) ingest(f);
        }}
        className={`relative rounded-[16px] border transition-colors ${
          dragging ? 'border-rose bg-rose-wash' : 'border-transparent bg-paper'
        }`}
      >
        <label htmlFor={id} className="sr-only">
          Contract text
        </label>
        <textarea
          id={id}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (source) setSource(null);
          }}
          rows={9}
          placeholder="Paste terms of service, a lease, an offer letter, or any contract. Or drop a PDF here."
          className="paper-lines block w-full resize-y rounded-[16px] bg-transparent px-5 py-4 font-read text-[17px] leading-8 text-ink outline-none placeholder:font-sans placeholder:text-[15px] placeholder:text-ink-faint"
        />
        {dragging && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-[16px] font-display text-2xl text-rose-deep">
            Drop the PDF to read it
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-2 pt-3 pb-1">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || busy}
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium text-ink transition-colors hover:border-rose hover:text-rose-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M10 13V3m0 0L6 7m4-4 4 4M4 13v2.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V13" />
          </svg>
          {uploading ? 'Reading PDF...' : 'Upload PDF'}
        </button>
        <span className="text-xs text-ink-faint" aria-live="polite">
          {source ? `Loaded ${source}` : null}
        </span>

        <span className={`ml-auto text-xs tabular-nums ${over ? 'font-semibold text-high' : 'text-ink-faint'}`}>
          {length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </span>
        <button
          type="submit"
          disabled={over || empty || busy}
          className="min-h-11 cursor-pointer rounded-full bg-rose px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(125,69,80,0.9)] transition-all hover:-translate-y-px hover:bg-rose-deep active:translate-y-0 disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-soft disabled:shadow-none"
        >
          {busy ? 'Reviewing...' : 'Review contract'}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        aria-label="Upload a contract as a PDF"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) ingest(f);
        }}
      />

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-2 pt-3 pb-2 mt-2">
        <span className="text-xs font-medium tracking-wide text-ink-soft uppercase">Try a sample</span>
        {SAMPLES.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={busy}
            onClick={() => {
              setSource(null);
              setError(null);
              onSample(s.text);
            }}
            className="min-h-9 cursor-pointer rounded-full bg-rose-wash px-3.5 text-[13px] font-medium text-rose-deep transition-colors hover:bg-blush disabled:cursor-not-allowed disabled:opacity-60"
          >
            {s.label}
          </button>
        ))}
      </div>

      {(error || over) && (
        <p role="alert" className="px-3 pb-2 text-sm text-high">
          {error ?? `That is over the ${MAX_CHARS.toLocaleString()} character limit. Trim it to the sections you care about.`}
        </p>
      )}
    </form>
  );
}
