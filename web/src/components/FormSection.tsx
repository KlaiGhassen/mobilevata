import { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  step?: number;
  children: ReactNode;
  className?: string;
};

export function FormSection({
  title,
  description,
  step,
  children,
  className = '',
}: Props) {
  return (
    <section className={`form-section surface ${className}`.trim()}>
      <header className="form-section__header">
        <div className="form-section__heading">
          {typeof step === 'number' ? (
            <span className="form-section__step" aria-hidden="true">
              {step}
            </span>
          ) : null}
          <div>
            <h2 className="form-section__title">{title}</h2>
            {description ? <p className="form-section__desc">{description}</p> : null}
          </div>
        </div>
      </header>
      <div className="form-section__body">{children}</div>
    </section>
  );
}
