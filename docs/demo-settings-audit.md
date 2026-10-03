# Demo settings audit

Reviewed against App.tsx, DemoSettings.tsx and shared state hooks on 2026-10-02.

The shared demo overlays Settings values on example config on every change.
The top-level merge is shallow; namespaced settings handlers explicitly retain
existing namespace members. This is not a universal deep-merge guarantee. Explicit UI schema options still override config. A setting only affects controls to which it applies.

For the shadcn demo:

| Setting | Application |
| --- | --- |
| Mode, direction, accent, radius, density | Demo/provider props and theme; visual browser verification remains necessary. |
| Locale | JSON Forms translator updates with locale. |
| Validation | JSON Forms validationMode updates. |
| Demo layout | Demo layout state. |
| Read-only | Form-wide readonly prop. |
| Hide required asterisk | Live labels and array/mixed headings; regression covered. |
| Show unfocused description | Shared help policy; live change regression covered. |
| Restrict | Text maxlength and array bounds; text live change regression covered. |
| Collapse new items | Applies on Add in accordion presentation; tested enabled and disabled. |
| Hide array summary validation | Hides descendant header notices, retains direct array errors. |
| Start panels collapsed | Writes jsonformsExtended.collapsed. Groups, mixed frames and collapsible array panels react to effective setting changes; item/accordion initialization follows its own state policy. |
| Group / Mixed / Accordion / Array expansion | Namespaced component overrides with an inherit choice; local UI-schema options take precedence. |
| Show container error indicators | Namespaced indicator default; local settings and validation visibility still apply. |
| Hide array item avatar | Reads merged config in array item presentation. |
| Filter errors before touch and keyword list | Shared preTouchErrors policy reads merged config. |
| Additional properties default and empty property names | AdditionalProperties reads merged config. |

This is a wiring audit plus focused regression coverage, not exhaustive browser certification of every control or renderer family. Initialization and future-action settings intentionally differ from immediate visual toggles. Native/provider appearance should also be checked in a browser.

Evidence: shadcn settingsConfig.test.tsx; common expansionSettings.test.tsx,
arrayPanelState.ts and groupState.ts. Conditional field discovery and detail
modes are authored through example config/UI schema, not dedicated Settings toggles.
