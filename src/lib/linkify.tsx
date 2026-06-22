// Turns plain-text blog/memory content into safe, clickable links + emails.
// Builds React elements directly (no dangerouslySetInnerHTML), so there is no
// HTML-injection/XSS surface — only <a> nodes with attacker-controlled `href`
// values, which we always force through safe schemes (https:/mailto:) below.
import type { ReactNode } from "react";

const EMAIL_SRC = String.raw`[\w.+-]+@[\w-]+\.[\w.-]+`;
const URL_SRC = String.raw`https?:\/\/[^\s<]+`;
const WWW_SRC = String.raw`www\.[^\s<]+`;
const BARE_DOMAIN_SRC = String.raw`[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}(?:\/[^\s<]*)?`;

const COMBINED_RE = new RegExp(
  `(${EMAIL_SRC})|(${URL_SRC})|(${WWW_SRC})|(\\b${BARE_DOMAIN_SRC})`,
  "g",
);

// Trailing punctuation that's almost always sentence punctuation, not part of the URL.
const TRAILING_PUNCT_RE = /[.,!?;:'")\]}]+$/;

function splitTrailingPunctuation(match: string): { core: string; trailing: string } {
  const m = match.match(TRAILING_PUNCT_RE);
  if (!m) return { core: match, trailing: "" };
  // Keep balanced closing parens that have a matching opening paren inside the match.
  let trailing = m[0];
  let core = match.slice(0, match.length - trailing.length);
  while (trailing.startsWith(")") && (core.match(/\(/g)?.length ?? 0) > (core.match(/\)/g)?.length ?? 0)) {
    core += ")";
    trailing = trailing.slice(1);
  }
  return { core, trailing };
}

const LINK_CLASSNAME = "text-amber-700 underline decoration-amber-300 hover:text-amber-800 hover:decoration-amber-500 break-words";

/** Renders text with URLs/emails turned into safe `<a>` links, preserving line breaks. */
export function linkifyText(text: string): ReactNode[] {
  const lines = text.split("\n");
  const out: ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) out.push(<br key={`br-${lineIdx}`} />);

    let lastIndex = 0;
    let match: RegExpExecArray | null;
    COMBINED_RE.lastIndex = 0;
    let key = 0;

    while ((match = COMBINED_RE.exec(line)) !== null) {
      const [full, email, url, www, bare] = match;
      const { core, trailing } = splitTrailingPunctuation(full);
      if (!core) continue;

      if (match.index > lastIndex) {
        out.push(line.slice(lastIndex, match.index));
      }

      if (email) {
        const safeEmail = core.replace(/[^\w.+@-]/g, "");
        out.push(
          <a key={`l-${lineIdx}-${key++}`} href={`mailto:${safeEmail}`} className={LINK_CLASSNAME}>
            {core}
          </a>,
        );
      } else {
        const href = url ? core : `https://${core}`;
        out.push(
          <a
            key={`l-${lineIdx}-${key++}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASSNAME}
          >
            {core}
          </a>,
        );
      }

      if (trailing) out.push(trailing);
      lastIndex = match.index + full.length;
      void www; void bare;
    }

    if (lastIndex < line.length) {
      out.push(line.slice(lastIndex));
    }
  });

  return out;
}

export function Linkify({ text }: { text: string }) {
  return <>{linkifyText(text)}</>;
}
