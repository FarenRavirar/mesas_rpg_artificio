export interface PaymentClassification {
  isPaid: boolean;
  priceText: string | null;
  confidence: number;
}

const PAID_PATTERNS: RegExp[] = [
  /\bmesa\s+paga\b/i,
  /\br\$\s*\d+[\d.,]*/i,
  /\bvalor\b/i,
  /\bpagament[oa]\b/i,
  /\bpor\s+sess[aã]o\b/i,
  /\bpix\b/i,
  /\bcobran[çc]a\b/i,
];

const FREE_PATTERNS: RegExp[] = [
  /\bmesa\s+gratuit[ao]\b/i,
  /\bgr[aá]tis\b/i,
  /\bgratuit[ao]\b/i,
  /\bsem\s+custo\b/i,
  /\bsess[aã]o\s+zero\s+gratuit[ao]\b/i,
];

const extractPriceText = (content: string): string | null => {
  const line = content
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => /r\$|valor|mesa\s+paga|pagament[oa]/i.test(item));

  if (!line) return null;
  return line.slice(0, 240);
};

export const classifyPayment = (content: string): PaymentClassification => {
  const safeContent = content ?? '';

  const paidHits = PAID_PATTERNS.filter((pattern) => pattern.test(safeContent)).length;
  const freeHits = FREE_PATTERNS.filter((pattern) => pattern.test(safeContent)).length;

  const priceText = extractPriceText(safeContent);

  if (paidHits === 0 && freeHits === 0) {
    return {
      isPaid: false,
      priceText,
      confidence: 0.45,
    };
  }

  if (paidHits >= freeHits) {
    const confidence = Math.min(0.98, 0.55 + paidHits * 0.12);
    return {
      isPaid: true,
      priceText,
      confidence,
    };
  }

  const confidence = Math.min(0.98, 0.55 + freeHits * 0.1);
  return {
    isPaid: false,
    priceText,
    confidence,
  };
};
