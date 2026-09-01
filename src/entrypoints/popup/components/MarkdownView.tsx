export type MarkdownViewProps = {
  autoFocus?: boolean;
  markdown: string;
};

export function MarkdownView({
  autoFocus = false,
  markdown,
}: MarkdownViewProps) {
  return (
    <textarea
      aria-label="Markdown output"
      autoFocus={autoFocus}
      className="markdown-view"
      readOnly
      spellCheck={false}
      value={markdown}
    />
  );
}
