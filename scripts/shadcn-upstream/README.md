# Pinned shadcn sources

`manifest.json` records the upstream revision and source path for each component.
These are the upstream new-york-v4 Radix components, except Collapsible, which uses the upstream Base UI implementation required by the renderers.

Run `pnpm shadcn:sync` to install the pinned copies in both hosts. Run `pnpm shadcn:check` to detect drift. The `cn` and sibling UI import paths are rewritten. Button, Input, and DialogOverlay additionally receive a `forwardRef` compatibility transform for React 18; their styles and behavior remain upstream. Do not format or customize these generated host files independently.

Tailwind 4 is required. Current upstream ref handling targets React 19. The ref compatibility transforms support the existing React 18 hosts without changing the pinned source. `utils.ts` and `index.ts` are local integration files, not upstream UI components.
