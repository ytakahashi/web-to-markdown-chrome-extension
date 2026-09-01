import { Notice } from "./Notice";

export type FallbackPromptProps = {
  message: string;
  onSelectFullPage: () => void;
  title: string;
};

export function FallbackPrompt({
  message,
  onSelectFullPage,
  title,
}: FallbackPromptProps) {
  return (
    <Notice message={message} title={title}>
      <button
        autoFocus
        className="button button--primary"
        onClick={onSelectFullPage}
        type="button"
      >
        Convert entire page
      </button>
    </Notice>
  );
}
