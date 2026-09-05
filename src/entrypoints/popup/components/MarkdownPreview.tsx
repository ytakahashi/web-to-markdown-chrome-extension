import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { isDisplayableUrl } from "../../../core/markdown/safe-url";

export type MarkdownPreviewProps = {
  autoFocus?: boolean;
  markdown: string;
};

function PreviewLink({ children, href }: ComponentPropsWithoutRef<"a">) {
  const url = href?.trim();
  if (!url || !isDisplayableUrl(url)) {
    return <span>{children}</span>;
  }

  return (
    <a href={url} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  );
}

function PreviewImage({ alt, src }: ComponentPropsWithoutRef<"img">) {
  const label = alt?.trim() || "Image";

  // Rendering an image would contact its source and disclose that the page was
  // previewed. Keep the source visible as text without creating a request.
  return (
    <span className="markdown-preview__image-placeholder">
      🖼 {label}
      {src ? ` (${src})` : ""}
    </span>
  );
}

export function MarkdownPreview({
  autoFocus = false,
  markdown,
}: MarkdownPreviewProps) {
  const previewRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // React does not apply autoFocus behavior to a generic article element.
    if (autoFocus) {
      previewRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <article
      aria-label="Markdown preview"
      className="markdown-preview"
      ref={previewRef}
      tabIndex={0}
    >
      <ReactMarkdown
        components={{ a: PreviewLink, img: PreviewImage }}
        remarkPlugins={[remarkGfm]}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
