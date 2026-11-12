import type { ReactNode } from 'react';

interface Tabs98Props<T extends string> {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  children: ReactNode;
  label: string;
}

/** Onglets façon boîte de dialogue Win98. */
export function Tabs98<T extends string>({ tabs, active, onChange, children, label }: Tabs98Props<T>) {
  return (
    <div className="tabs98">
      <div className="tabs98__list" role="tablist" aria-label={label}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={t.id === active}
            aria-controls={`panel-${t.id}`}
            className="tabs98__tab"
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="tabs98__panel" role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`}>
        {children}
      </div>
    </div>
  );
}
