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
                ? 'bg-zaatar text-cream border-zaatar'
                : 'bg-cream text-eggplant border-eggplant/40 hover:border-eggplant'
            }`}
          >
            {labels[opt]}
          </button>
        );
      })}
    </div>
  );
}
