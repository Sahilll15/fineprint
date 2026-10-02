'use client';

import { useEffect, useState } from 'react';
import type { RawClause } from './lib';

export function Loading({ clauses }: { clauses: RawClause[] }) {
  const [at, setAt] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setAt((n) => Math.min(n + 1, clauses.length - 1)), 420);
    return () => clearInterval(t);
  }, [clauses.length]);

  return (
    <section aria-live="polite" aria-busy="true" className="animate-rise">
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold tracking-[0.16em] text-rose-deep uppercase">Reading</p>
        <h2 className="mt-1 font-display text-4xl text-ink sm:text-5xl">
          Going through {clauses.length} clause{clauses.length === 1 ? '' : 's'}
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Each clause gets checked against seven risk categories. This takes a few seconds.
        </p>
      </div>
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[22px] border border-line bg-card">
        {clauses.slice(0, 10).map((c, i) => (
          <div
            key={c.id}
            className={`flex gap-4 border-b border-line px-6 py-4 transition-colors duration-500 last:border-b-0 ${
              i === at ? 'bg-blush-soft' : ''
            }`}
          >
            <span
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${i < at ? 'bg-rose' : i === at ? 'animate-shimmer bg-rose' : 'bg-line-strong'}`}
            />
            <div className="min-w-0 flex-1">
              {c.heading && <p className="mb-1 text-[12px] font-semibold tracking-wide text-ink-soft uppercase">{c.heading}</p>}
              <p className={`line-clamp-2 font-read text-[15px] leading-relaxed ${i <= at ? 'text-ink' : 'text-ink-faint'}`}>
                {c.text}
              </p>
            </div>
          </div>
        ))}
        {clauses.length > 10 && (
          <p className="bg-paper px-6 py-3 text-center text-xs text-ink-soft">and {clauses.length - 10} more</p>
        )}
      </div>
    </section>
  );
}
