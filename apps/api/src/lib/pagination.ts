export interface Page {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function parsePage(q: Record<string, unknown> | undefined): Page {
  const page = Math.max(1, Number(q?.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(q?.pageSize ?? 20) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function pageEnvelope<T>(items: T[], total: number, page: Page) {
  return { items, total, page: page.page, pageSize: page.pageSize, pages: Math.ceil(total / page.pageSize) };
}
