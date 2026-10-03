export const SITE_URL = 'https://fineprint-beta.vercel.app';
export const SITE_NAME = 'FinePrint';
export const SITE_TITLE = 'FinePrint: find risky clauses in contracts and terms';
export const SITE_DESCRIPTION =
  'Paste a contract, lease, offer letter or terms of service and see which clauses carry risk, like auto-renewal, arbitration and fees. Not legal advice.';
export const SITE_KEYWORDS = ['contract review', 'terms of service checker', 'contract risk checker', 'lease review', 'offer letter review', 'auto-renewal clause', 'arbitration clause', 'read the fine print'];

const AUTHOR = {
  '@type': 'Person',
  name: 'Sahil Chalke',
  url: 'https://sahilchalke.com',
  sameAs: ['https://github.com/Sahilll15', 'https://x.com/chalke1015'],
};

export const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  author: AUTHOR,
  creator: AUTHOR,
};

export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
