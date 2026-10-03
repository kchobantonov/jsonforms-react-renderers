import {
  JsonSchema,
  LayoutProps,
  RankedTester,
  Resolve,
  UISchemaElement,
  composePaths,
  rankWith,
  toDataPath,
  uiTypeIs,
} from '@jsonforms/core';
import { useJsonForms, withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';
import { isAllowedImageUrl, resolveUrlPolicy } from '../util/urlPolicy';

/**
 * `ImageView` - a display-only image, sourced directly or from the data.
 *
 * Section 13 puts `src`, `scope` and `alt` at the **top level** of the
 * element, not in `options`. At least one of `src` and `scope` must be
 * supplied, and the two are not interchangeable fallbacks for one another: a
 * defined `src` wins outright, *including the empty string*, which is how an
 * author says "no image here" without removing the element.
 */

export const imageViewRendererTester: RankedTester = rankWith(
  1,
  uiTypeIs('ImageView')
);

export type ImageViewElement = UISchemaElement & {
  type: 'ImageView';
  src?: string;
  scope?: string;
  alt?: string;
};

/** Stable machine-readable codes, per section 21. */
export type ImageViewDiagnosticCode =
  | 'image.noSource'
  | 'image.missingAlt'
  | 'image.scopeNotString'
  | 'image.nonStringSource'
  | 'image.urlRefused';

export interface ImageViewDiagnostic {
  code: ImageViewDiagnosticCode;
  severity: 'warning' | 'error';
  message: string;
}

/**
 * Whether a scoped schema permits a string.
 *
 * An untyped schema permits anything, so it passes. A `type` that is an array
 * passes if `string` is among its members - `["string", "null"]` is a normal
 * way to spell an optional image.
 */
const permitsString = (schema: JsonSchema | undefined): boolean => {
  if (schema === undefined) {
    return false;
  }
  const type = (schema as { type?: unknown }).type;
  if (type === undefined) {
    return true;
  }
  return Array.isArray(type) ? type.includes('string') : type === 'string';
};

export interface ResolvedImageView {
  /** The URL to render, or undefined for "show no image". */
  src?: string;
  alt: string;
  diagnostics: ImageViewDiagnostic[];
}

/**
 * The whole of section 13's source resolution, with no React in it.
 *
 * Kept separate from the component because the precedence is the part worth
 * testing directly: which of `src` and `scope` wins, when an empty value is a
 * deliberate blank rather than a missing one, and which failures are silent.
 */
export const resolveImageView = (
  element: ImageViewElement,
  args: {
    schema?: JsonSchema;
    rootSchema?: JsonSchema;
    data?: unknown;
    path?: string;
    config?: unknown;
  }
): ResolvedImageView => {
  const diagnostics: ImageViewDiagnostic[] = [];
  const options = (element as { options?: Record<string, unknown> }).options;

  /*
    `options.src` / `options.alt` are where this renderer used to read from,
    before the top-level fields existed. Kept as a fallback so forms authored
    against the old shape keep working; the top-level field wins when both are
    present. See adjustment 23.
  */
  const src =
    element.src !== undefined
      ? element.src
      : typeof options?.src === 'string'
      ? (options.src as string)
      : undefined;
  const altField =
    element.alt !== undefined
      ? element.alt
      : typeof options?.alt === 'string'
      ? (options.alt as string)
      : undefined;

  /*
    `alt` is required, and `alt: ""` is the documented way to mark an image
    decorative. Defaulting a missing one to `""` silently declares every image
    decorative, so the omission is reported - but the image still renders,
    since withholding content over a missing annotation helps nobody.
  */
  if (altField === undefined) {
    diagnostics.push({
      code: 'image.missingAlt',
      severity: 'warning',
      message:
        'ImageView requires a top-level `alt`. Use `alt: ""` to mark the image decorative.',
    });
  }
  const alt = altField ?? '';

  const policy = resolveUrlPolicy(args.config);
  const checkUrl = (candidate: string): string | undefined => {
    if (candidate === '') {
      return undefined;
    }
    if (!isAllowedImageUrl(candidate, policy)) {
      diagnostics.push({
        code: 'image.urlRefused',
        severity: 'error',
        message:
          'The image source is blocked by the configured URL policy. Use an allowed image URL or adjust the image URL policy.',
      });
      return undefined;
    }
    return candidate;
  };

  /*
    A defined `src` is the source, full stop. The specification is explicit
    that an invalid one "does not silently fall through to scope" - falling
    through would show a different image than the one the author named.
  */
  if (src !== undefined) {
    return { src: checkUrl(src), alt, diagnostics };
  }

  if (element.scope === undefined) {
    diagnostics.push({
      code: 'image.noSource',
      severity: 'error',
      message: 'ImageView requires at least one of `src` and `scope`.',
    });
    return { alt, diagnostics };
  }

  const scopedSchema = Resolve.schema(
    args.schema ?? (args.rootSchema as JsonSchema),
    element.scope,
    args.rootSchema as JsonSchema
  );
  if (!permitsString(scopedSchema)) {
    diagnostics.push({
      code: 'image.scopeNotString',
      severity: 'error',
      message: `The schema at ${element.scope} does not permit strings.`,
    });
    return { alt, diagnostics };
  }

  // Control scope semantics, so an ImageView inside an array item resolves
  // against that item rather than the root.
  const dataPath = composePaths(args.path ?? '', toDataPath(element.scope));
  const value = Resolve.data(args.data, dataPath);

  // "Empty or missing source data displays no image" - not an error; the
  // property simply has not been filled in yet.
  if (value === undefined || value === null || value === '') {
    return { alt, diagnostics };
  }
  if (typeof value !== 'string') {
    diagnostics.push({
      code: 'image.nonStringSource',
      severity: 'error',
      message: `The value at ${
        element.scope
      } is a ${typeof value}, not a URL string.`,
    });
    return { alt, diagnostics };
  }
  return { src: checkUrl(value), alt, diagnostics };
};

const DIAGNOSTIC_STYLE: React.CSSProperties = {
  border: '1px solid currentColor',
  borderRadius: 4,
  padding: '0.5rem 0.75rem',
  boxSizing: 'border-box',
  minWidth: 0,
  maxWidth: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  overflowWrap: 'anywhere',
  fontSize: '0.85rem',
};

const ImageDiagnostic = ({
  diagnostic,
}: {
  diagnostic: ImageViewDiagnostic;
}) => {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  return (
    <div
      role='alert'
      data-image-diagnostic={diagnostic.code}
      style={DIAGNOSTIC_STYLE}
    >
      <span
        style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button
          type='button'
          aria-label='Image warning details'
          aria-describedby={open ? id : undefined}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onClick={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
          style={{
            display: 'inline-flex',
            padding: 0,
            border: 0,
            background: 'transparent',
            color: 'inherit',
            cursor: 'help',
          }}
        >
          <svg
            width='18'
            height='18'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.75'
            aria-hidden='true'
          >
            <path d='M12 3 2 21h20L12 3Z' />
            <path d='M12 9v5' />
            <circle cx='12' cy='17' r='.75' />
          </svg>
        </button>
        {open && (
          <span
            id={id}
            role='tooltip'
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              zIndex: 10,
              width: 'min(22rem, 70vw)',
              boxSizing: 'border-box',
              padding: '0.5rem 0.75rem',
              background: 'Canvas',
              color: 'CanvasText',
              border: '1px solid currentColor',
              borderRadius: 4,
              overflowWrap: 'anywhere',
              fontWeight: 'normal',
            }}
          >
            {diagnostic.message}
          </span>
        )}
      </span>
      <span>
        {diagnostic.code === 'image.urlRefused'
          ? 'Image blocked'
          : 'Image configuration warning'}
      </span>
    </div>
  );
};

export const ImageViewRendererComponent = ({
  config,
  uischema,
  schema,
  path,
  visible,
}: LayoutProps) => {
  const ctx = useJsonForms();
  const element = uischema as ImageViewElement;
  const resolved = resolveImageView(element, {
    schema,
    rootSchema: ctx.core?.schema,
    data: ctx.core?.data,
    path,
    config,
  });

  if (visible === false) {
    return null;
  }

  return (
    <>
      {resolved.src !== undefined && (
        <img
          src={resolved.src}
          alt={resolved.alt}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      )}
      {resolved.diagnostics.map((diagnostic) => (
        <ImageDiagnostic key={diagnostic.code} diagnostic={diagnostic} />
      ))}
    </>
  );
};

export const ImageViewRenderer = withJsonFormsLayoutProps(
  ImageViewRendererComponent
);
