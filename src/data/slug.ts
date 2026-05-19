// Slug derivation + validation for project slugs.
// Format spec from kennel-create-project-flow.docx §1.2 and §2.5.

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLUG_MAX = 40;

/** Lowercase, non-alphanumerics → hyphens, collapse runs, trim, cap at 40. */
export const deriveSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX);

export const isValidSlug = (slug: string): boolean =>
  slug.length >= 1 && slug.length <= SLUG_MAX && SLUG_RE.test(slug);
