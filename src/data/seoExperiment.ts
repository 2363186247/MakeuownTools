export type SeoTitleVariant = 'A';

// Low-impression phase: keep one stable title version to reduce ops noise.
export const SEO_TITLE_VARIANT: SeoTitleVariant = 'A';

export function pickSeoTitle(variantA: string, _variantB: string): string {
  return variantA;
}
