export function CheckboxGroup({ options, labels, values, onChange, name }) {
  function toggle(opt) {
    if (values.includes(opt)) onChange(values.filter((v) => v !== opt));
    else onChange([...values, opt]);
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={name}>
      {options.map((opt) => {
        const active = values.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            aria-pressed={active}
            className={`px-3 py-1.5 rounded-full text-sm font-body border-2 focus-ring transition-colors ${
              active
                ? 'bg-tealGreen text-cream border-tealGreen'
                : 'bg-cream text-teal border-teal/40 hover:border-teal'
            }`}
          >
            {labels[opt]}
          </button>
        );
      })}
    </div>
  );
}
