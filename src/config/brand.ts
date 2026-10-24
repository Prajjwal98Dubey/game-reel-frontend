import brandJson from '../../brand.json';

/**
 * The product brand. The name is both the brand and the logo (a text wordmark) for now.
 * Change it in `brand.json` at the project root; `app.config.ts` reads the same file for the
 * installed app's display name.
 */
export const brand = {
  name: brandJson.name,
  /** The wordmark is set in lowercase, like the rest of the Sticker Deck headers (§17.5). */
  wordmark: brandJson.name.toLowerCase(),
  tagline: brandJson.tagline,
} as const;
