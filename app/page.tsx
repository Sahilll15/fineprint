'use client';

import { useRef, useState } from 'react';
import { Composer } from './Composer';
import { CATEGORIES, CATEGORY_IDS, splitClauses, type RawClause } from './lib';
import { Loading } from './Loading';
import { CATEGORY_TONE, Review, type ReviewData } from './Review';
import { SAMPLES } from './samples';

type State =
  | { kind: 'idle' }
  | { kind: 'loading'; clauses: RawClause[] }
  | { kind: 'done'; data: ReviewData }
  | { kind: 'error'; message: string };

function Logo() {
  return (
    <svg aria-hidden viewBox="0 0 64 64" className="h-7 w-7">
      <rect width="64" height="64" rx="16" fill="#4a1a20" />
      <path d="M20 16h18l8 8v24H20z" fill="#fbf8f7" />
      <path d="M38 16v8h8" fill="#e2b4bc" />
      <rect x="25" y="29" width="16" height="3" rx="1.5" fill="#d9909a" />
      <rect x="25" y="35" width="12" height="3" rx="1.5" fill="#dccfd1" />
      <rect x="25" y="41" width="14" height="3" rx="1.5" fill="#a3303f" />
    </svg>
  );
}

export default function Home() {
  const [text, setText] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const workRef = useRef<HTMLDivElement>(null);

  async function review(input: string) {
    const { clauses } = splitClauses(input);
    setState({ kind: 'loading', clauses });
    requestAnimationFrame(() => workRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Review failed with status ${res.status}.`);
      setState({ kind: 'done', data: body as ReviewData });
      requestAnimationFrame(() => workRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Review failed.' });
    }
  }

  const busy = state.kind === 'loading';

  return (
    <div className="min-h-dvh bg-frame">
      <div className="bg-frame-deep px-4 py-2 text-center text-[11px] font-semibold tracking-[0.18em] text-blush uppercase">
        <span className="hidden sm:inline">
          Seven risk checks on every clause <span className="mx-2 text-white/40">/</span>{' '}
        </span>
        Not legal advice
      </div>

      <div className="p-2 sm:p-4 lg:p-6">
        <div className="relative isolate overflow-clip rounded-[22px] bg-paper sm:rounded-[30px]">
          <div aria-hidden className="glow animate-drift pointer-events-none absolute -top-40 -left-40 -z-10 h-[680px] w-[680px]" />
          <div aria-hidden className="glow pointer-events-none absolute top-[30%] -right-60 -z-10 h-[520px] w-[520px] opacity-60" />

          <header className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-5 sm:px-8">
            <a href="#top" className="flex items-center gap-2.5 font-display text-2xl text-ink" aria-label="FinePrint home">
              <Logo />
              FinePrint
            </a>
            <nav className="hidden gap-5 text-sm text-ink-soft md:flex" aria-label="Sections">
              <a href="#review" className="hover:text-ink">Review</a>
              <a href="#checks" className="hover:text-ink">What we check</a>
              <a href="#disclaimer" className="hover:text-ink">Disclaimer</a>
            </nav>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setText(SAMPLES[0].text);
                review(SAMPLES[0].text);
              }}
              className="ml-auto min-h-9 cursor-pointer rounded-full border border-line-strong bg-card/70 px-4 text-[13px] font-medium text-ink transition-colors hover:border-rose disabled:opacity-60"
            >
              Try a sample
            </button>
          </header>

          <main id="top" className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
            {state.kind !== 'done' && (
              <section className="mx-auto max-w-3xl pt-10 pb-12 text-center sm:pt-16">
                <h1 className="animate-rise font-display text-[52px] leading-[0.98] tracking-[-0.01em] text-ink sm:text-[84px]">
                  Every clause,
                  <br />
                  <span className="text-rose/70 italic">read before you sign.</span>
                </h1>
                <p
                  className="animate-rise mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-ink-soft sm:text-[17px]"
                  style={{ animationDelay: '80ms' }}
                >
                  Paste a lease, an offer letter or a set of terms. FinePrint marks up every clause for auto-renewals,
                  data sharing, arbitration, surprise fees and rights grabs, then tells you which three to read first.
                </p>
                <div className="animate-rise mt-8 flex flex-wrap justify-center gap-3" style={{ animationDelay: '160ms' }}>
                  <a
                    href="#review"
                    className="inline-flex min-h-11 items-center rounded-full bg-rose px-6 text-sm font-semibold text-white transition-colors hover:bg-rose-deep"
                  >
                    Review a contract
                  </a>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setText(SAMPLES[1].text);
                      review(SAMPLES[1].text);
                    }}
                    className="min-h-11 cursor-pointer rounded-full bg-rose-wash px-6 text-sm font-semibold text-rose-deep transition-colors hover:bg-blush disabled:opacity-60"
                  >
                    See a sample review
                  </button>
                </div>
              </section>
            )}

            <div id="review" ref={workRef} className="scroll-mt-4 space-y-10">
              {state.kind === 'done' ? (
                <div className="pt-4">
                  <Review
                    data={state.data}
                    onReset={() => {
                      setState({ kind: 'idle' });
                      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
                    }}
                  />
                </div>
              ) : state.kind === 'loading' ? (
                <Loading clauses={state.clauses} />
              ) : (
                <div className="mx-auto max-w-3xl">
                  {state.kind === 'error' && (
                    <div role="alert" className="animate-rise mb-4 flex flex-wrap items-center gap-3 rounded-[18px] border border-high-line bg-high-bg px-5 py-4">
                      <p className="flex-1 text-sm text-high">{state.message}</p>
                      <button
                        type="button"
                        onClick={() => review(text)}
                        disabled={text.trim().length < 40}
                        className="min-h-9 cursor-pointer rounded-full bg-card px-4 text-sm font-semibold text-high ring-1 ring-high-line disabled:opacity-60"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                  <Composer
                    value={text}
                    onChange={setText}
                    onSubmit={() => review(text)}
                    onSample={(t) => {
                      setText(t);
                      review(t);
                    }}
                    busy={busy}
                  />
                </div>
              )}
            </div>

            {state.kind !== 'loading' && (
              <section id="checks" className="scroll-mt-6 pt-20">
                <div className="mx-auto max-w-2xl text-center">
                  <h2 className="font-display text-4xl text-ink sm:text-5xl">What FinePrint looks for</h2>
                  <p className="mt-3 text-ink-soft">
                    Each clause is checked for these seven patterns, scored for how unusual it is next to a standard
                    contract, and marked when a typical person would want to know about it.
                  </p>
                </div>
                <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {CATEGORY_IDS.map((id, i) => (
                    <div
                      key={id}
                      className="rounded-[20px] border border-line bg-card/80 p-5 transition-transform duration-300 hover:-translate-y-0.5"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <span aria-hidden className="block h-1.5 w-8 rounded-full" style={{ background: CATEGORY_TONE[id] }} />
                      <h3 className="mt-4 font-display text-2xl text-ink">{CATEGORIES[id].label}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{CATEGORIES[id].explain}</p>
                    </div>
                  ))}
                  <div className="rounded-[20px] bg-frame p-5 text-white">
                    <span aria-hidden className="block h-1.5 w-8 rounded-full bg-blush" />
                    <h3 className="mt-4 font-display text-2xl">Plus two more</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/80">
                      How aggressive the wording is on a four step scale, and whether a typical person needs to notice it.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </main>

          <footer id="disclaimer" className="border-t border-line bg-card/60">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-ink-soft sm:flex-row sm:items-start sm:justify-between sm:px-8">
              <p className="max-w-2xl leading-relaxed">
                <span className="font-semibold text-ink">FinePrint is not legal advice.</span> It flags clauses that
                often deserve a closer look, and it can be wrong in both directions. Nothing here creates a lawyer and
                client relationship. Before signing anything important, talk to a qualified lawyer where you live.
              </p>
              <p className="shrink-0 text-ink-faint">Scored with TypeSafe Jev</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
