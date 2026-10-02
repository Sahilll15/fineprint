import { NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';
import { check, tooMany } from '../../server/ratelimit';

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  const gate = check(req, 'extract');
  if (!gate.ok) return tooMany(gate.retryAfter);

  // formData() buffers the whole body, so reject oversized or unsized uploads first.
  const length = Number(req.headers.get('content-length') ?? NaN);
  if (!Number.isFinite(length) || length > MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'That PDF is over 8MB. Try a smaller file or paste the text.' }, { status: 413 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  const file = form.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'That is not a PDF. Upload a PDF, or paste the text instead.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'That PDF is over 8MB. Try a smaller file or paste the text.' }, { status: 400 });
  }

  try {
    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    const { text, totalPages } = await extractText(pdf, { mergePages: true });
    const cleaned = text.replace(/\n{3,}/g, '\n\n').trim();

    if (cleaned.length < 50) {
      return NextResponse.json(
        { error: 'No readable text in that PDF. It may be a scan, so paste the text instead.' },
        { status: 422 },
      );
    }

    return NextResponse.json({ text: cleaned, pages: totalPages, name: file.name });
  } catch {
    return NextResponse.json({ error: 'Could not read that PDF. Try pasting the text instead.' }, { status: 422 });
  }
}
