/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly AIRTABLE_TOKEN: string;
  readonly MCR_AIRTABLE_BASE: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
