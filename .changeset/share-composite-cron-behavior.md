---
'@chobantonov/jsonforms-react-renderer-common': patch
'@chobantonov/jsonforms-react-antd-renderers': patch
'@chobantonov/jsonforms-react-shadcn-renderers': patch
'@chobantonov/jsonforms-react-extended-renderers': patch
'@chobantonov/jsonforms-react-antd-extended-renderers': patch
'@chobantonov/jsonforms-react-shadcn-extended-renderers': patch
---

Share composite dialog draft handling, composite cell presentation, confirmation state, scalar composition feedback, additional-property discovery, mixed tree behavior, and cron picker behavior across renderer sets. Reuse the shared additional-property schema resolver in the extended renderer so overlapping patterns retain all constraints. Keep toolkit-specific controls while applying the same invalid code-draft guard to both composite dialogs.

Share mask editing and caret restoration across the two masked inputs while preserving their composition handling. Reuse mixed-schema type detection and keyword filtering in the generic renderer. Both renderer sets now use the same tuple editor, mixed detail dispatch, and allOf renderer. Duration controls share component formatting.

Share object detail rendering, additional-property actions, validation summaries, and row detail presentation. AntD date and time pickers now use the same value and bounds handling. AntD also rechecks the current value and edit permissions before committing a confirmed mixed-tree deletion.
