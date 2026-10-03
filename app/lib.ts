export const MAX_CHARS = 20_000;
export const MAX_CLAUSES = 25;
export const MAX_PDF_BYTES = 8 * 1024 * 1024;
export const FLAG_AT = 0.5;

export const CATEGORY_IDS = [
  'autoRenewal',
  'dataSharing',
  'arbitration',
  'unilateralChanges',
  'feesPenalties',
  'liabilityLimit',
  'ipRights',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];
export type Level = 'high' | 'medium' | 'low';

export type Category = {
  id: CategoryId;
  label: string;
  short: string;
  question: string;
  explain: string;
  ask: string;
};

export const CATEGORIES: Record<CategoryId, Category> = {
  autoRenewal: {
    id: 'autoRenewal',
    label: 'Auto-renewal',
    short: 'Renews on its own',
    question:
      'Does this clause make the agreement, subscription or term renew or extend automatically unless the person actively cancels?',
    explain:
      'This keeps the deal going, and usually keeps charging you, unless you cancel in time. The cancellation window is often short and easy to miss.',
    ask: 'Put the renewal date and the cancellation deadline in your calendar the day you sign.',
  },
  dataSharing: {
    id: 'dataSharing',
    label: 'Data sharing',
    short: 'Shares or sells your data',
    question:
      'Does this clause allow personal data or usage data to be shared with, sold to, or used by third parties such as advertisers, partners or affiliates?',
    explain:
      'Your information can leave the company that collected it. Once it is with partners or advertisers, you have little say in where it goes next.',
    ask: 'Look for an opt-out link or privacy setting, and ask which third parties receive your data.',
  },
  arbitration: {
    id: 'arbitration',
    label: 'Arbitration',
    short: 'No court, no class action',
    question:
      'Does this clause require disputes to go to binding arbitration, waive the right to a jury trial, or block joining a class action?',
    explain:
      'If something goes wrong, you may not be able to sue in court or join with others who were harmed the same way. A private arbitrator decides instead.',
    ask: 'Check whether there is an opt-out period. Many contracts allow 30 days to opt out by mail or email.',
  },
  unilateralChanges: {
    id: 'unilateralChanges',
    label: 'One-sided changes',
    short: 'They can change the terms',
    question:
      'Does this clause let one party change the terms, prices, duties or rules on its own, without the other party agreeing?',
    explain:
      'The version you are signing may not be the version that applies later. Continuing to use the service often counts as accepting the new terms.',
    ask: 'Ask how you will be notified of changes and whether you can leave without a penalty when they happen.',
  },
  feesPenalties: {
    id: 'feesPenalties',
    label: 'Fees and penalties',
    short: 'Extra costs or exit penalties',
    question:
      'Does this clause impose termination penalties, early exit fees, late fees, deposits that may be kept, or other charges beyond the headline price?',
    explain:
      'The price on the front page is not the whole cost. Leaving early, paying late, or normal wear can trigger charges that add up fast.',
    ask: 'Add up the worst case: what you would owe if you had to leave in month two.',
  },
  liabilityLimit: {
    id: 'liabilityLimit',
    label: 'Liability cap',
    short: 'Limits what they owe you',
    question:
      'Does this clause limit, cap or exclude the liability, damages or responsibility of one party, or require the other party to indemnify them?',
    explain:
      'If they cause you a loss, this caps or removes what you can recover. Sometimes it also makes you pay their costs if a claim involves you.',
    ask: 'Compare the cap to what you actually stand to lose. A cap equal to one month of fees is very low.',
  },
  ipRights: {
    id: 'ipRights',
    label: 'Content and IP rights',
    short: 'Claims your work or content',
    question:
      'Does this clause give one party ownership of, or a broad license to, content, inventions, ideas or work created by the other party?',
    explain:
      'Something you make, upload, or invent may end up owned or freely usable by them, sometimes including work done on your own time.',
    ask: 'Ask for the rights to be limited to what is needed to provide the service or do the job.',
  },
};

export const AGGRESSIVENESS = [
  'standard, balanced wording you would find in most contracts of this kind',
  'slightly one-sided but common in contracts of this kind',
  'noticeably one-sided or unusual compared with a standard contract',
  'aggressive, far outside what a standard contract of this kind would say',
];

export const AGGRESSIVENESS_LABEL = ['Standard', 'Slightly one-sided', 'Unusual', 'Aggressive'];

export type RawClause = { id: string; heading: string | null; text: string };

export type JevClause = {
  flags: Record<CategoryId, number>;
  aggressiveness: number;
  notice: number;
};

export type Clause = RawClause &
  JevClause & {
    categories: CategoryId[];
    risk: number;
    level: Level;
    priority: number;
  };

export type Summary = {
  score: number;
  level: Level;
  counts: Record<CategoryId, number>;
  levels: Record<Level, number>;
  readFirst: string[];
};

const HEADING_RE = /^(?:(?:section|article|clause)\s+[\divx]+[.:)]?|\d+(?:\.\d+)*[.)]?\s+[A-Z][^.]{0,60}$|[A-Z][A-Z\s&,'-]{2,60}$)/i;
const NUMBERED_START = /^\s*(?:(?:section|article|clause)\s+[\divx]+|\d+(?:\.\d+)*[.)]|\([a-z0-9]+\))\s/i;

function looksLikeHeading(line: string) {
  const t = line.trim();
  if (t.length === 0 || t.length > 70) return false;
  if (/[.;:,]$/.test(t) && !/^\d+(\.\d+)*\.$/.test(t)) return false;
  return HEADING_RE.test(t) || t.split(/\s+/).length <= 6;
}

function splitLong(text: string, max = 1400): string[] {
  if (text.length <= max) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [text];
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && (cur + s).length > max * 0.6) {
      out.push(cur.trim());
      cur = '';
    }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Split a contract into clauses, keeping short headings attached to the text they introduce. */
export function splitClauses(
  input: string,
  cap = MAX_CLAUSES,
): { title: string | null; clauses: RawClause[]; merged: boolean } {
  const lines = input.replace(/\r\n?/g, '\n').split('\n');
  const blocks: string[] = [];
  let cur: string[] = [];
  const flush = () => {
    const b = cur.join('\n').trim();
    if (b) blocks.push(b);
    cur = [];
  };
  for (const line of lines) {
    if (!line.trim()) flush();
    else {
      if (NUMBERED_START.test(line) && cur.length && !looksLikeHeading(cur[cur.length - 1])) flush();
      cur.push(line.trim());
    }
  }
  flush();

  let title: string | null = null;
  if (blocks.length > 1 && !blocks[0].includes('\n') && looksLikeHeading(blocks[0])) title = blocks.shift()!;

  type Draft = { heading: string | null; text: string };
  const drafts: Draft[] = [];
  let pending: string | null = null;
  for (const block of blocks) {
    const [first, ...rest] = block.split('\n');
    if (rest.length === 0 && looksLikeHeading(first)) {
      pending = pending ? `${pending} ${first}` : first;
      continue;
    }
    let heading = pending;
    let body = block;
    if (rest.length > 0 && looksLikeHeading(first)) {
      heading = heading ? `${heading} ${first}` : first;
      body = rest.join('\n');
    }
    pending = null;
    const parts = splitLong(body.replace(/\s*\n\s*/g, ' '));
    parts.forEach((p, i) => drafts.push({ heading: i === 0 ? heading : null, text: p }));
  }
  if (pending && drafts.length === 0) drafts.push({ heading: null, text: pending });

  // Fold fragments too short to be a real clause into the previous one.
  const folded: Draft[] = [];
  let carry = '';
  for (const d of drafts) {
    const prev = folded[folded.length - 1];
    if (d.text.length < 50 && !d.heading && prev) prev.text = `${prev.text} ${d.text}`;
    else if (d.text.length < 50 && !d.heading && !prev) carry = `${carry}${d.text} `;
    else {
      folded.push({ heading: d.heading, text: carry + d.text });
      carry = '';
    }
  }
  if (carry.trim()) folded.push({ heading: null, text: carry.trim() });

  let merged = false;
  while (folded.length > cap) {
    merged = true;
    let best = 0;
    for (let i = 1; i < folded.length - 1; i++) {
      const size = (j: number) => folded[j].text.length + folded[j + 1].text.length;
      if (size(i) < size(best)) best = i;
    }
    const a = folded[best];
    const b = folded.splice(best + 1, 1)[0];
    a.text = b.heading ? `${a.text}\n\n${b.heading}. ${b.text}` : `${a.text} ${b.text}`;
  }

  return {
    title,
    clauses: folded.map((d, i) => ({ id: `c${i + 1}`, heading: d.heading, text: d.text })),
    merged,
  };
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));

export function levelFor(risk: number): Level {
  if (risk >= 0.6) return 'high';
  if (risk >= 0.35) return 'medium';
  return 'low';
}

/** Blend Jev's numbers into one 0..1 risk per clause. Aggressiveness leads; flags and noticeability add weight. */
export function scoreClause(raw: RawClause, jev: JevClause): Clause {
  const flags = Object.fromEntries(CATEGORY_IDS.map((id) => [id, clamp01(jev.flags[id])])) as Record<
    CategoryId,
    number
  >;
  const aggressiveness = Math.min(3, Math.max(0, jev.aggressiveness || 0));
  const notice = clamp01(jev.notice);
  const categories = CATEGORY_IDS.filter((id) => flags[id] >= FLAG_AT).sort((a, b) => flags[b] - flags[a]);
  const topFlag = Math.max(0, ...Object.values(flags));
  const breadth = Math.min(categories.length, 3) / 3;

  let risk = 0.42 * (aggressiveness / 3) + 0.33 * topFlag + 0.15 * notice + 0.1 * breadth;
  // A clause with no category hit and standard wording should not read as risky just because it matters.
  if (categories.length === 0) risk = Math.min(risk, 0.45);
  risk = clamp01(risk);

  return {
    ...raw,
    flags,
    aggressiveness,
    notice,
    categories,
    risk,
    level: levelFor(risk),
    priority: risk * (0.6 + 0.4 * notice),
  };
}

export function summarize(clauses: Clause[]): Summary {
  const counts = Object.fromEntries(CATEGORY_IDS.map((id) => [id, 0])) as Record<CategoryId, number>;
  const levels: Record<Level, number> = { high: 0, medium: 0, low: 0 };
  for (const c of clauses) {
    levels[c.level]++;
    for (const id of c.categories) counts[id]++;
  }

  const risks = clauses.map((c) => c.risk).sort((a, b) => b - a);
  const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
  // The worst few clauses dominate: one brutal clause matters more than ten harmless ones.
  const score = Math.round(100 * clamp01(0.65 * mean(risks.slice(0, 3)) + 0.35 * mean(risks)));

  const readFirst = [...clauses]
    .filter((c) => c.level !== 'low' || c.categories.length > 0)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map((c) => c.id);

  return { score, level: score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low', counts, levels, readFirst };
}

export function explainClause(c: Clause): string {
  const tone = AGGRESSIVENESS_LABEL[Math.round(c.aggressiveness)].toLowerCase();
  if (c.categories.length === 0) {
    return c.level === 'low'
      ? 'Nothing here matched the risk categories, and the wording reads as standard.'
      : `No specific risk category matched, but the wording reads as ${tone} next to a typical contract. Worth a slow read.`;
  }
  const names = c.categories.map((id) => CATEGORIES[id].label.replace(/^./, (ch) => ch.toLowerCase()));
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  const noticeLine =
    c.notice >= 0.6 ? ' Most people would want to know about this before signing.' : '';
  return `Flagged for ${list}. Compared with a typical contract the wording reads as ${tone}.${noticeLine}`;
}
