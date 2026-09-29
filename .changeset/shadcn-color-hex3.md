---
'@chobantonov/jsonforms-react-shadcn-extended-renderers': patch
---

Honor colorSaveFormat hex3 for picker and text edits using shared nearest-channel rounding. Reject transparent edits with localized guidance rather than discarding alpha, and preserve untouched values.
