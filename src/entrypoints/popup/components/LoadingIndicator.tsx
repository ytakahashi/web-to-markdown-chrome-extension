export function LoadingIndicator() {
  return (
    <div className="loading-indicator">
      <span aria-hidden="true" className="spinner" />
      <span>Converting current page…</span>
    </div>
  );
}
