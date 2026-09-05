import { RESULT_VIEW_OPTIONS, type ResultView } from "../result-views";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "./SegmentedControl";

export type ViewSwitcherProps = {
  view: ResultView;
  onSelect: (view: ResultView) => void;
};

const VIEW_OPTIONS = RESULT_VIEW_OPTIONS.map(
  ({ view, label, description }) => ({
    value: view,
    label,
    description,
  }),
) satisfies readonly SegmentedControlOption<ResultView>[];

export function ViewSwitcher({ view, onSelect }: ViewSwitcherProps) {
  return (
    <SegmentedControl
      ariaLabel="Result view"
      options={VIEW_OPTIONS}
      value={view}
      onSelect={onSelect}
    />
  );
}
