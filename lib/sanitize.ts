// NOTE: this is a defense-in-depth, regex-based sanitizer. Regex sanitization of
// arbitrary HTML can never be made fully bulletproof (malformed markup, unusual
// attribute encodings, etc. can slip through). For production use, replace this
// with a real allowlist-based sanitizer such as `sanitize-html` or DOMPurify
// running server-side (e.g. via jsdom). This version is meaningfully hardened
// versus a naive pass but should not be treated as a complete XSS defense.
const DANGEROUS_TAGS = ['script','style','object','embed','applet','link','meta','base','form'];
const DANGEROUS_URI_ATTRS = ['href','src','action','formaction','poster','background'];

export function sanitizeHtml(input: string) {
  let html = String(input || '');

  // Strip HTML comments (can be used to smuggle content past naive parsers/renderers).
  html = html.replace(/<!--[\s\S]*?-->/g, '');

  // Remove dangerous tags and their content entirely.
  for (const tag of DANGEROUS_TAGS) {
    html = html.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
    // Also strip self-closing / unclosed variants.
    html = html.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi'), '');
  }

  // Strip event handler attributes (onclick, onerror, onload, ...), covering
  // quoted, single-quoted, and unquoted attribute values.
  html = html
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '');

  // Neutralize dangerous URI schemes (javascript:, vbscript:, data:) in URL-bearing
  // attributes, again across quoted and unquoted forms.
  for (const attr of DANGEROUS_URI_ATTRS) {
    html = html
      .replace(new RegExp(`\\s${attr}\\s*=\\s*"\\s*(?:javascript|vbscript|data)\\s*:[^"]*"`, 'gi'), ` ${attr}="#"`)
      .replace(new RegExp(`\\s${attr}\\s*=\\s*'\\s*(?:javascript|vbscript|data)\\s*:[^']*'`, 'gi'), ` ${attr}="#"`)
      .replace(new RegExp(`\\s${attr}\\s*=\\s*(?:javascript|vbscript|data):[^\\s>]*`, 'gi'), ` ${attr}="#"`);
  }

  // Remove srcdoc (arbitrary inline document for iframes) and inline style
  // expression()/url(javascript:) vectors.
  html = html
    .replace(/\ssrcdoc\s*=\s*"[^"]*"/gi, '')
    .replace(/\ssrcdoc\s*=\s*'[^']*'/gi, '')
    .replace(/\sstyle\s*=\s*"([^"]*)"/gi, (m, v) => (/expression\(|javascript:/i.test(v) ? '' : m))
    .replace(/\sstyle\s*=\s*'([^']*)'/gi, (m, v) => (/expression\(|javascript:/i.test(v) ? '' : m));

  // Only allow youtube-embedded iframes; strip anything else.
  html = html.replace(
    /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
    (tag) => (/\bsrc\s*=\s*["']\s*https:\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)\//i.test(tag) ? tag : '')
  );
  html = html.replace(/<iframe\b[^>]*\/>/gi, '');

  return html.trim();
}
