import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldShellProps {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

function FieldShell({ label, hint, error, children }: FieldShellProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children(id, describedBy)}
      {error ? (
        <p className="field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p className="field__hint" id={`${id}-hint`}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

type Base = { label: string; hint?: ReactNode; error?: string | null };

/** Champ texte façon Win98 (creusé). */
export function TextField({ label, hint, error, ...input }: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <input id={id} className="input98" aria-invalid={!!error} aria-describedby={describedBy} {...input} />
      )}
    </FieldShell>
  );
}

export function TextArea({ label, hint, error, ...input }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <textarea id={id} className="input98" aria-invalid={!!error} aria-describedby={describedBy} {...input} />
      )}
    </FieldShell>
  );
}

export function SelectField({ label, hint, error, children, ...input }: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <select id={id} className="input98" aria-describedby={describedBy} {...input}>
          {children}
        </select>
      )}
    </FieldShell>
  );
}

export function Checkbox({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="checkbox98">
      <input type="checkbox" {...input} />
      <span className="checkbox98__box" aria-hidden />
      {label}
    </label>
  );
}
