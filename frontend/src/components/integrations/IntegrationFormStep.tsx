import { ReactNode } from "react";

interface Props {
  step: number;
  title: string;
  hint?: string;
  children: ReactNode;
}

export function IntegrationFormStep({ step, title, hint, children }: Props) {
  return (
    <fieldset className="int-step">
      <legend className="int-step-legend">
        <span className="int-step-num">{step}</span>
        <span className="int-step-title">{title}</span>
      </legend>
      {hint && <p className="int-step-hint">{hint}</p>}
      <div className="int-step-body">{children}</div>
    </fieldset>
  );
}
