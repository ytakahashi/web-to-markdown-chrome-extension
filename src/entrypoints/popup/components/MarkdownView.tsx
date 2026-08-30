export type MarkdownViewProps = {
  markdown: string;
};

export function MarkdownView({ markdown }: MarkdownViewProps) {
  return (
    <textarea
      aria-label="Markdown output"
      autoFocus
      className="markdown-view"
      readOnly
      spellCheck={false}
      value={markdown}
    />
  );
}
