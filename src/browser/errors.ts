export class UnsupportedPageError extends Error {
  override readonly name = "UnsupportedPageError";
}

export class ExtractionExecutionError extends Error {
  override readonly name = "ExtractionExecutionError";
}
