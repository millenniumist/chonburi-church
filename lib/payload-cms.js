// Shared Payload local-API access for the site's data layer. All site reads
// go through the Payload CMS (schema "payload"); the legacy Prisma tables in
// cc_financial are no longer read by the site.
import { getPayload } from 'payload';
import config from '../payload.config';

export function getPayloadClient() {
  return getPayload({ config });
}

// Payload richText fields hold Lexical JSON; the site renders plain text.
// Walks the tree and joins text nodes (paragraphs separated by blank lines).
export function lexicalToText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const root = value.root;
  if (!root?.children) return '';
  const paragraph = (node) =>
    (node.children ?? [])
      .map((child) => (child.type === 'text' ? child.text : paragraph(child)))
      .join('');
  return root.children.map(paragraph).filter(Boolean).join('\n\n');
}
