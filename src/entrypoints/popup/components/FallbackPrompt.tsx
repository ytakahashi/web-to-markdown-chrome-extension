import { Notice } from "./Notice";

export type FallbackPromptProps = {
  autoFocus?: boolean;
  message: string;
  onSelectFullPage: () => void;
  title: string;
};

export function FallbackPrompt({
  autoFocus = false,
  message,
  onSelectFullPage,
  title,
}: FallbackPromptProps) {
  return (
    <Notice message={message} title={title}>
      <button
        autoFocus={autoFocus}
        className="button button--primary"
        onClick={onSelectFullPage}
        type="button"
      >
        Convert entire page
      </button>
    </Notice>
  );
}
