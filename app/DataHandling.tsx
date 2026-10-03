import { CATEGORY_IDS, MAX_CHARS, MAX_CLAUSES, MAX_PDF_BYTES } from './lib';

const MAX_PDF_MB = MAX_PDF_BYTES / 1024 / 1024;

export function DataHandling() {
  const steps = [
    {
      title: 'If you upload a PDF',
      body: `The file goes to the server, which reads it in memory, pulls out the text and sends back only that text and the page count. The PDF is not written to disk or kept. Files over ${MAX_PDF_MB}MB are refused, and a scanned PDF with no text layer is turned away with a request to paste the text instead.`,
    },
    {
      title: 'When you press review',
      body: `Up to ${MAX_CHARS.toLocaleString('en-US')} characters are split into clauses, at most ${MAX_CLAUSES}. Each clause is sent to the Jev model from TypeSafe with ${CATEGORY_IDS.length} yes or no questions, one per check above, plus how aggressive it is and whether a typical person needs to notice it.`,
    },
    {
      title: 'What is kept',
      body: 'FinePrint does not save your contract, the extracted text or the review. The results live in this page and are gone when you reload it. The only thing stored is a short-lived request count per IP address to rate limit the free reviews.',
    },
  ];

  return (
    <section id="privacy" aria-labelledby="privacy-title" className="scroll-mt-6 pt-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="privacy-title" className="font-display text-4xl text-ink sm:text-5xl">
          What happens to your contract
        </h2>
        <p className="mt-3 text-ink-soft">
          Contracts often hold names, salaries and addresses, so here is exactly what the app does with yours.
        </p>
      </div>
      <ol className="mx-auto mt-10 grid max-w-5xl gap-3 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-[20px] border border-line bg-card/80 p-5">
            <span aria-hidden className="font-display text-3xl leading-none text-rose italic">
              {i + 1}
            </span>
            <h3 className="mt-3 font-display text-2xl text-ink">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
