import { REPO_URL, TOOLS } from './site';

const link = 'font-medium text-rose-deep underline-offset-4 hover:underline';

export function SiteFooter() {
  return (
    <footer id="disclaimer" className="border-t border-line bg-card/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 text-sm leading-relaxed text-ink-soft sm:px-8 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3">
          <p>
            <span className="font-semibold text-ink">FinePrint is not legal advice.</span> It flags clauses that often deserve a closer
            look, and it can be wrong in both directions. Nothing here creates a lawyer and client relationship. Before signing anything
            important, talk to a qualified lawyer where you live.
          </p>
          <p>
            The descriptions of each check are fixed text in the app. Only the flags and scores come from the Jev model from TypeSafe.
            Your text is sent there to be scored and is not saved by FinePrint.
          </p>
          <p className="flex flex-wrap gap-x-5 gap-y-1">
            <span>
              Built by{' '}
              <a href="https://sahilchalke.com" className={link}>
                Sahil Chalke
              </a>
            </span>
            <a href={REPO_URL} className={link}>
              Source code on GitHub
            </a>
          </p>
        </div>
        <nav aria-labelledby="more-tools">
          <h2 id="more-tools" className="text-[11px] font-semibold tracking-[0.18em] text-ink-soft uppercase">
            More tools
          </h2>
          <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {TOOLS.map((t) => (
              <li key={t.url}>
                <a href={t.url} className={link}>
                  {t.name}
                </a>
                <span className="text-ink-faint">, {t.blurb}</span>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
