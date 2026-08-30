import { Notice } from "./Notice";

export type FallbackPromptProps = {
  message: string;
  onConvert: () => Promise<void>;
  title: string;
};

export function FallbackPrompt({
  message,
  onConvert,
  title,
}: FallbackPromptProps) {
  return (
    <Notice message={message} title={title}>
      <button
        autoFocus
        className="button button--primary"
        onClick={() => void onConvert()}
        type="button"
      >
        Convert entire page
      </button>
    </Notice>
  );
}
