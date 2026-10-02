import { NextResponse } from 'next/server';
import {
  AGGRESSIVENESS,
  CATEGORIES,
  CATEGORY_IDS,
  MAX_CHARS,
  scoreClause,
  splitClauses,
  summarize,
  type CategoryId,
  type RawClause,
} from '../../lib';
import { askJev } from '../../server/jev';
import { check, tooMany } from '../../server/ratelimit';

const PRICE_PER_INPUT_TOKEN = 0.042 / 1_000_000;
const CONCURRENCY = 8;

const flagQuestions = Object.fromEntries(
  CATEGORY_IDS.map((id) => [id, { type: 'boolean' as const, instructions: CATEGORIES[id].question }]),
) as Record<CategoryId, { type: 'boolean'; instructions: string }>;

async function reviewClause(clause: RawClause, title: string | null) {
  const { answers, inputTokens } = await askJev(
    { document: title ?? 'a contract or terms of service', clauseHeading: clause.heading, clause: clause.text },
    {
      ...flagQuestions,
      aggressiveness: {
        type: 'score',
        instructions: 'How unusual or aggressive is this clause compared with a standard contract of the same kind?',
        criteria: AGGRESSIVENESS,
      },
      notice: {
        type: 'boolean',
        instructions:
          'Would a typical person signing this need to notice this clause, because it could cost them money, rights or control?',
      },
    },
  );

  const flags = Object.fromEntries(CATEGORY_IDS.map((id) => [id, answers[id].probability])) as Record<
    CategoryId,
    number
  >;
  return {
    clause: scoreClause(clause, {
      flags,
      aggressiveness: answers.aggressiveness.score,
      notice: answers.notice.probability,
    }),
    inputTokens,
  };
}

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return out;
}

export async function POST(req: Request) {
  let text: unknown;
  try {
    ({ text } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Send the contract text as JSON.' }, { status: 400 });
  }

  if (typeof text !== 'string' || text.trim().length < 40) {
    return NextResponse.json({ error: 'Paste a contract or upload a PDF first.' }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      {
        error: `That document is ${text.length.toLocaleString()} characters. The limit is ${MAX_CHARS.toLocaleString()}, so paste the sections you care about most.`,
      },
      { status: 413 },
    );
  }

  const { title, clauses: raw, merged } = splitClauses(text);
  if (raw.length === 0) {
    return NextResponse.json({ error: 'Could not find any clauses in that text.' }, { status: 400 });
  }

  const gate = check(req, 'analyze');
  if (!gate.ok) return tooMany(gate.retryAfter);

  try {
    const reviewed = await pool(raw, CONCURRENCY, (c) => reviewClause(c, title));
    const clauses = reviewed.map((r) => r.clause);
    const inputTokens = reviewed.reduce((sum, r) => sum + r.inputTokens, 0);

    return NextResponse.json({
      title,
      clauses,
      summary: summarize(clauses),
      merged,
      inputTokens,
      cost: inputTokens * PRICE_PER_INPUT_TOKEN,
    });
  } catch (err) {
    console.error('analyze failed', err);
    return NextResponse.json(
      { error: 'The review service did not answer. Wait a moment and try again.' },
      { status: 502 },
    );
  }
}
