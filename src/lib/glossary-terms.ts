// ── REPLACE FOR NEW DOMAIN ────────────────────────────────────────────────
// Define the glossary terms for your app's data model.
// Each term appears as a section on /glossary.

export type GlossaryTerm = {
  id: string
  name: string
  definition: string
  source: string
  caveats: string
}

export const GLOSSARY_TERMS: GlossaryTerm[] = []
