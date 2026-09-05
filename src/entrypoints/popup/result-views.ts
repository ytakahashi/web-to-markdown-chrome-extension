export type ResultView = "markdown" | "preview";

export type ResultViewOption = {
  view: ResultView;
  label: string;
  /** Additional context included in the accessible name after the visual label. */
  description: string;
};

// Array order is also the visual and arrow-key navigation order.
export const RESULT_VIEW_OPTIONS = [
  {
    view: "markdown",
    label: "Markdown",
    description: "Show the Markdown source",
  },
  {
    view: "preview",
    label: "Preview",
    description: "Show the rendered Markdown",
  },
] as const satisfies readonly ResultViewOption[];

type AssertAllViewsListed<T extends never> = T;

// Adding a ResultView without a switcher option becomes a type error here.
export type ViewsCoveredByOptions = AssertAllViewsListed<
  Exclude<ResultView, (typeof RESULT_VIEW_OPTIONS)[number]["view"]>
>;

export const DEFAULT_RESULT_VIEW: ResultView = "markdown";
