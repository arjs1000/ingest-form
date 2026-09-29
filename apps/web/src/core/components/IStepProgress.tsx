export interface IStepProgressProps {
  current: number;
  total: number;
  /** Optional name of the current step, e.g. "Your details". */
  label?: string;
}

/** NHS-style "Step 2 of 4" above the page title. Text only: no bars, no circles. */
export function IStepProgress({ current, total, label }: IStepProgressProps) {
  return (
    <p className="text-text-secondary">
      <span className="font-semibold">
        Step {current} of {total}
      </span>
      {label ? <span>: {label}</span> : null}
    </p>
  );
}
