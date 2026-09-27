import { RuleEffect } from '@jsonforms/core';
import type { LinkElement } from '@chobantonov/jsonforms-react-extended-renderers';
import { TranslationCatalogs, translatorFor } from '../i18nCatalogs';
import { registerProjectExamples } from './registry';

/** Typed so the Link-specific top-level fields survive the UISchemaElement check. */
const link = (
  label: string,
  href: string,
  target?: LinkElement['target'],
  i18n?: string
): LinkElement => ({ type: 'Link', label, href, target, i18n } as LinkElement);

/**
 * A Link has no scope, so - like a Group or a Category - core can derive no
 * translation prefix for it and only an explicit `i18n` can supply one.
 * Without it the lookup key is the literal label text and the catalog entry is
 * never consulted. Switch the demo's locale to Bulgarian to see these apply.
 */
const linkTranslations: TranslationCatalogs = {
  en: {
    'handbook.label': 'Employee handbook',
    'jsonformsDocs.label': 'JSON Forms documentation',
    'emailHr.label': 'Email HR',
  },
  bg: {
    'handbook.label': 'Наръчник на служителя',
    'jsonformsDocs.label': 'Документация на JSON Forms',
    'emailHr.label': 'Имейл до Човешки ресурси',
  },
};

const logo = new URL('../logo.svg', import.meta.url).href;
const imageView = {
  type: 'ImageView',
  options: { src: logo, alt: 'JSON Forms logo' },
  rule: {
    effect: RuleEffect.SHOW,
    condition: { scope: '#/properties/showImage', schema: { const: true } },
  },
};

export const schema = {
  type: 'object',
  properties: {
    showImage: { type: 'boolean', title: 'Show image' },
  },
};

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Label', text: 'Presentation elements' },
    { type: 'Spacer' },
    { type: 'Separator' },
    { type: 'Control', scope: '#/properties/showImage' },
    { type: 'Spacer', options: { height: 48 } },
    imageView,
    { type: 'Separator' },
    link('JSON Forms documentation', 'https://jsonforms.io/docs/', '_blank'),
  ],
};

export const data = { showImage: true };

registerProjectExamples([
  {
    name: 'spacer',
    label: 'Spacer',
    schema: { type: 'object', properties: {} },
    data: {},
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Label', text: 'Default spacing (32 pixels)' },
        { type: 'Spacer' },
        { type: 'Separator' },
        { type: 'Label', text: 'Custom spacing (64 pixels)' },
        { type: 'Spacer', options: { height: 64 } },
        { type: 'Separator' },
        { type: 'Label', text: 'Zero spacing' },
        { type: 'Spacer', options: { height: 0 } },
        { type: 'Separator' },
      ],
    },
  },
  {
    name: 'image-view',
    label: 'ImageView',
    schema,
    data,
    uischema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Label',
          text: 'Resize the preview to see the image fit its container.',
        },
        { type: 'Control', scope: '#/properties/showImage' },
        imageView,
      ],
    },
  },
  {
    name: 'separator',
    label: 'Separator',
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
    },
    data: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Label', text: 'Personal details' },
        { type: 'Control', scope: '#/properties/firstName' },
        { type: 'Control', scope: '#/properties/lastName' },
        { type: 'Separator' },
        { type: 'Label', text: 'Contact details' },
        { type: 'Control', scope: '#/properties/email' },
      ],
    },
  },
  {
    name: 'link',
    label: 'Link',
    schema: { type: 'object', properties: {} },
    data: {},
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Label', text: 'An ordinary link' },
        link('Employee handbook', '/handbook', undefined, 'handbook'),
        { type: 'Separator' },
        { type: 'Label', text: 'Opening a new tab forces rel=noopener' },
        link(
          'JSON Forms documentation',
          'https://jsonforms.io/docs/',
          '_blank',
          'jsonformsDocs'
        ),
        { type: 'Separator' },
        { type: 'Label', text: 'A mail link' },
        link('Email HR', 'mailto:hr@example.com', undefined, 'emailHr'),
        { type: 'Separator' },
        {
          type: 'Label',
          text: 'An empty href renders plain text, inventing no destination',
        },
        link('Not yet available', ''),
        { type: 'Separator' },
        {
          type: 'Label',
          text: 'The URL policy refuses this scheme, so it is not navigable',
        },
        link('Refused by policy', 'javascript:alert(1)'),
        { type: 'Separator' },
        {
          type: 'Label',
          text: 'The three links above carry an i18n prefix; this one does not, so it stays English in every locale',
        },
        link('Untranslated link', '/untranslated'),
      ],
    },
    translations: linkTranslations,
    i18n: { locale: 'en', translate: translatorFor(linkTranslations, 'en') },
  },
  {
    name: 'presentation',
    label: 'Spacer, ImageView and Separator',
    schema,
    uischema,
    data,
  },
]);
