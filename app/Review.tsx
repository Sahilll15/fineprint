'use client';

import { useState } from 'react';
import {
  AGGRESSIVENESS_LABEL,
  CATEGORIES,
  CATEGORY_IDS,
  explainClause,
  type CategoryId,
  type Clause,
  type Level,
  type Summary,
} from './lib';

export type ReviewData = {
  title: string | null;
  clauses: Clause[];
  summary: Summary;
  merged: boolean;
  inputTokens: number;
  cost: number;
};

export const CATEGORY_TONE: Record<CategoryId, string> = {
  autoRenewal: '#b4566a',
  dataSharing: '#6d5aa8',
  arbitration: '#3f6d8f',
  unilateralChanges: '#a8692c',
  feesPenalties: '#a3303f',
  liabilityLimit: '#56704d',
  ipRights: '#8a4f8c',
};

const LEVEL_COPY: Record<Level, { word: string; doc: string; chip: string }> = {
  high: { word: 'Read carefully', doc: 'Several clauses lean hard against you.', chip: 'High' },
  medium: { word: 'Some things to check', doc: 'A few clauses deserve a second look.', chip: 'Watch' },
  low: { word: 'Mostly standard', doc: 'Nothing here stands out as unusual.', chip: 'Standard' },
};

const LEVEL_STYLE: Record<Level, string> = {
  high: 'border-l-high bg-high-bg/70',
  medium: 'border-l-mid-line bg-mid-bg/70',
  low: 'border-l-transparent',
};

const BADGE_STYLE: Record<Level, string> = {
  high: 'bg-high text-white',
  medium: 'bg-mid-bg text-mid ring-1 ring-mid-line',
  low: 'bg-low-bg text-low',
};

function Gauge({ score, level }: { score: number; level: Level }) {
  const r = 70;
  const len = Math.PI * r;
  const color = level === 'high' ? 'var(--color-high)' : level === 'medium' ? 'var(--color-mid)' : 'var(--color-low)';
  return (
    <div className="relative mx-auto w-full max-w-[220px]">
      <svg viewBox="0 0 180 104" className="w-full" role="img" aria-label={`Risk score ${score} out of 100`}>
        <path d="M20 94 A70 70 0 0 1 160 94" fill="none" stroke="var(--color-line)" strokeWidth="14" strokeLinecap="round" />
        <path
          d="M20 94 A70 70 0 0 1 160 94"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - score / 100)}
          className="gauge-arc"
          style={{ ['--len' as string]: `${len}` }}
        />
        {[0.35, 0.6].map((t) => {
          const a = Math.PI * (1 - t);
          return (
            <line
              key={t}
              x1={90 + 58 * Math.cos(a)}
              y1={94 - 58 * Math.sin(a)}
              x2={90 + 50 * Math.cos(a)}
              y2={94 - 50 * Math.sin(a)}
              stroke="var(--color-ink-faint)"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="font-display text-5xl leading-none text-ink tabular-nums">{score}</div>
        <div className="mt-1 text-[11px] font-medium tracking-[0.14em] text-ink-faint uppercase">risk of 100</div>
      </div>
    </div>
  );
}

function Flag({ id }: { id: CategoryId }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-[12px] font-medium text-ink">
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: CATEGORY_TONE[id] }} />
      {CATEGORIES[id].label}
    </span>
  );
}

function ClauseBlock({
  clause,
  index,
  dimmed,
  open,
  onToggle,
}: {
  clause: Clause;
  index: number;
  dimmed: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const flagged = clause.level !== 'low' || clause.categories.length > 0;
  return (
    <article
      id={clause.id}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      className={`group animate-rise scroll-mt-6 grid gap-x-6 border-l-[3px] py-4 pr-3 pl-4 transition-opacity duration-300 sm:pl-6 lg:grid-cols-[minmax(0,1fr)_190px] ${
        LEVEL_STYLE[clause.level]
      } ${dimmed ? 'opacity-30' : 'opacity-100'}`}
    >
      <div className="min-w-0">
        {clause.heading && (
          <h3 className="mb-1.5 font-sans text-[13px] font-semibold tracking-wide text-ink-soft uppercase">
            {clause.heading}
          </h3>
        )}
        <p className="font-read text-[17px] leading-[1.7] whitespace-pre-line text-ink">{clause.text}</p>

        {open && (
          <div className="animate-rise mt-4 rounded-xl border border-line bg-card p-4 font-sans text-sm leading-relaxed text-ink-soft">
            <p className="text-ink">{explainClause(clause)}</p>
            {clause.categories.map((id) => (
              <div key={id} className="mt-3 border-t border-line pt-3">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: CATEGORY_TONE[id] }} />
                  {CATEGORIES[id].label}
                  <span className="font-normal text-ink-faint tabular-nums">
                    {Math.round(clause.flags[id] * 100)}% likely
                  </span>
                </p>
                <p className="mt-1">{CATEGORIES[id].explain}</p>
                <p className="mt-1">
                  <span className="font-medium text-rose-deep">What to do. </span>
                  {CATEGORIES[id].ask}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside
        aria-label="Margin notes"
        className="order-first mb-3 flex flex-wrap items-start gap-1.5 lg:order-none lg:mb-0 lg:flex-col lg:border-l lg:border-dashed lg:border-line-strong lg:pl-4"
      >
        <div className="flex items-center gap-2">
          <span className="font-display text-lg leading-none text-ink-faint italic">{index + 1}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide ${BADGE_STYLE[clause.level]}`}>
            {LEVEL_COPY[clause.level].chip}
          </span>
        </div>
        {clause.categories.map((id) => (
          <Flag key={id} id={id} />
        ))}
        {flagged && (
          <span className="text-[12px] text-ink-faint lg:mt-1">
            {AGGRESSIVENESS_LABEL[Math.round(clause.aggressiveness)]} wording
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="min-h-8 cursor-pointer rounded-full px-1 text-[12px] font-semibold text-rose-deep underline-offset-4 hover:underline lg:mt-1"
        >
          {open ? 'Hide note' : flagged ? 'Why it is flagged' : 'Show note'}
        </button>
      </aside>
    </article>
  );
}

export function Review({ data, onReset }: { data: ReviewData; onReset: () => void }) {
  const { clauses, summary } = data;
  const [filter, setFilter] = useState<Set<CategoryId>>(new Set());
  const [open, setOpen] = useState<Set<string>>(() => new Set(summary.readFirst));

  const byId = new Map(clauses.map((c) => [c.id, c]));
  const matches = (c: Clause) => filter.size === 0 || c.categories.some((id) => filter.has(id));
  const shown = clauses.filter(matches).length;

  const toggle = <T,>(set: Set<T>, v: T) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    return next;
  };

  const usedCategories = CATEGORY_IDS.filter((id) => summary.counts[id] > 0);

  return (
    <section aria-labelledby="review-title" className="animate-rise">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-rose-deep uppercase">Review</p>
          <h2 id="review-title" className="mt-1 font-display text-4xl leading-tight text-ink sm:text-5xl">
            {data.title ?? 'Your document'}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {clauses.length} clauses read. {LEVEL_COPY[summary.level].doc}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="min-h-10 cursor-pointer rounded-full border border-line-strong bg-card px-5 text-sm font-medium text-ink transition-colors hover:border-rose hover:text-rose-deep"
        >
          Review another
        </button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="order-2 overflow-hidden rounded-[22px] border border-line bg-card shadow-[0_30px_80px_-50px_rgba(74,26,32,0.4)] lg:order-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line bg-paper px-5 py-3 text-xs text-ink-soft sm:px-6">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-high" /> High
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-mid-line" /> Worth a look
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-2.5 rounded-sm border border-line-strong" /> Standard
            </span>
            <span className="ml-auto" aria-live="polite">
              {filter.size > 0 ? `${shown} of ${clauses.length} clauses match` : 'Select a note to see why'}
            </span>
          </div>
          <div className="divide-y divide-line">
            {clauses.map((c, i) => (
              <ClauseBlock
                key={c.id}
                clause={c}
                index={i}
                dimmed={!matches(c)}
                open={open.has(c.id)}
                onToggle={() => setOpen((s) => toggle(s, c.id))}
              />
            ))}
          </div>
          {data.merged && (
            <p className="border-t border-line bg-paper px-6 py-3 text-xs text-ink-soft">
              This document was long, so some short neighbouring sections were read together.
            </p>
          )}
        </div>

        <aside className="order-1 space-y-4 lg:sticky lg:top-6 lg:order-2" aria-label="Summary">
          <div className="rounded-[22px] border border-line bg-card p-5">
            <Gauge score={summary.score} level={summary.level} />
            <p className="mt-3 text-center font-display text-2xl text-ink">{LEVEL_COPY[summary.level].word}</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {(['high', 'medium', 'low'] as Level[]).map((l) => (
                <div key={l} className="rounded-xl bg-paper px-2 py-2">
                  <dt className="text-[11px] text-ink-soft">{l === 'medium' ? 'Worth a look' : LEVEL_COPY[l].chip}</dt>
                  <dd className="font-display text-2xl text-ink tabular-nums">{summary.levels[l]}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-[22px] border border-line bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Filter by category</h3>
              {filter.size > 0 && (
                <button
                  type="button"
                  onClick={() => setFilter(new Set())}
                  className="min-h-8 cursor-pointer text-xs font-medium text-rose-deep hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            {usedCategories.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">No clause matched any risk category.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {usedCategories.map((id) => {
                  const on = filter.has(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setFilter((s) => toggle(s, id))}
                      className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-all ${
                        on ? 'border-transparent text-white shadow-sm' : 'border-line-strong bg-card text-ink hover:border-ink-faint'
                      }`}
                      style={on ? { background: CATEGORY_TONE[id] } : undefined}
                    >
                      {!on && <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: CATEGORY_TONE[id] }} />}
                      {CATEGORIES[id].label}
                      <span className={`tabular-nums ${on ? 'text-white/85' : 'text-ink-faint'}`}>{summary.counts[id]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {summary.readFirst.length > 0 && (
            <div className="rounded-[22px] bg-frame p-5 text-white">
              <h3 className="font-display text-2xl">Read these {summary.readFirst.length} first</h3>
              <ol className="mt-3 space-y-2">
                {summary.readFirst.map((id, i) => {
                  const c = byId.get(id)!;
                  return (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        onClick={() => setOpen((s) => new Set(s).add(id))}
                        className="flex gap-3 rounded-xl p-2 transition-colors hover:bg-white/10"
                      >
                        <span className="font-display text-2xl leading-none text-blush italic">{i + 1}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {c.heading ?? `${c.text.slice(0, 48)}...`}
                          </span>
                          <span className="block text-xs text-white/75">
                            {c.categories.length
                              ? c.categories.map((k) => CATEGORIES[k].short).join(', ')
                              : `${AGGRESSIVENESS_LABEL[Math.round(c.aggressiveness)]} wording`}
                          </span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <p className="rounded-[18px] border border-line bg-paper p-4 text-xs leading-relaxed text-ink-soft">
            <span className="font-semibold text-ink">Not legal advice.</span> FinePrint points at clauses worth reading
            twice. It can miss things or flag harmless ones. For anything that matters, ask a lawyer.
            <span className="mt-2 block text-ink-faint tabular-nums">
              {data.inputTokens.toLocaleString()} tokens read, about ${data.cost.toFixed(4)}
            </span>
          </p>
        </aside>
      </div>
    </section>
  );
}
