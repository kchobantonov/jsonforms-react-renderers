import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('..', import.meta.url));
const source = resolve(root, 'scripts/shadcn-upstream');
const manifest = JSON.parse(
  readFileSync(resolve(source, 'manifest.json'), 'utf8')
);
const check = process.argv.includes('--check');
let drift = false;
for (const file of Object.keys(manifest.files)) {
  let expected = readFileSync(resolve(source, file), 'utf8')
    .replaceAll('from "cn"', 'from "./utils"')
    .replaceAll('@/registry/new-york-v4/ui/', './');
  // The pinned Button uses React 19 ref props; our hosts also support React 18.
  // Keep this compatibility change reproducible without editing the snapshot.
  if (file === 'button.tsx') {
    expected = expected
      .replace(
        'function Button({',
        `const Button = React.forwardRef<HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }
>(function Button({`
      )
      .replace(
        `}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {`,
        '}, ref) {'
      )
      .replace(
        '      data-slot="button"',
        '      ref={ref}\n      data-slot="button"'
      )
      .replace('\n}\n\nexport { Button', '\n})\n\nexport { Button');
  }
  // File controls need the native input ref for opening/resetting the picker.
  if (file === 'input.tsx') {
    expected = expected
      .replace(
        'function Input({ className, type, ...props }: React.ComponentProps<"input">) {',
        `const Input = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input">>(
  function Input({ className, type, ...props }, ref) {`
      )
      .replace('      type={type}', '      ref={ref}\n      type={type}')
      .replace('\n}\n\nexport { Input }', '\n})\n\nexport { Input }');
  }
  // Radix Portal passes a ref to its overlay child even without a caller ref.
  if (file === 'dialog.tsx') {
    expected = expected
      .replace(
        'function DialogOverlay({',
        `const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({`
      )
      .replace(
        '}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {',
        '}, ref) {'
      )
      .replace(
        '      data-slot="dialog-overlay"',
        '      ref={ref}\n      data-slot="dialog-overlay"'
      )
      .replace(
        '\n}\n\nfunction DialogContent',
        '\n})\n\nfunction DialogContent'
      );
  }
  for (const host of [
    'apps/jsonforms-react-shadcn-demo',
    'packages/jsonforms-react-shadcn-webcomponent',
  ]) {
    let hostExpected = expected;
    if (file === 'dialog.tsx' && host.includes('webcomponent')) {
      hostExpected = hostExpected
        .replace(
          'function Dialog({',
          '// Keep portals inside the styled shadow tree instead of document.body.\nconst DialogPortalContainer = React.createContext<HTMLElement | null>(null)\n\nfunction Dialog({'
        )
        .replace(
          '  return <DialogPrimitive.Root data-slot="dialog" {...props} />',
          `  const [container, setContainer] = React.useState<HTMLDivElement | null>(null)
  return <div ref={setContainer} style={{ display: "contents" }}>
    <DialogPortalContainer.Provider value={container}>
      <DialogPrimitive.Root data-slot="dialog" {...props} />
    </DialogPortalContainer.Provider>
  </div>`
        )
        .replace(
          '  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />',
          `  const container = React.useContext(DialogPortalContainer)
  if (!container) return null
  return <DialogPrimitive.Portal data-slot="dialog-portal" container={container} {...props} />`
        );
    }
    const target = resolve(root, host, 'src/components/ui', file);
    if (check) {
      if (readFileSync(target, 'utf8') !== hostExpected) {
        console.error(`Upstream drift: ${target}`);
        drift = true;
      }
    } else writeFileSync(target, hostExpected);
  }
}
if (drift) process.exitCode = 1;
else
  console.log(
    `shadcn ${manifest.revision}: ${
      Object.keys(manifest.files).length
    } components ${check ? 'verified' : 'synced'} in both hosts.`
  );
