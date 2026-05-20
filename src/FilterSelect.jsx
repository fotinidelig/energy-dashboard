export const FilterSelect = ({ label, value, onChange, options }) => (
  <label className="filter-select">
    <span className="filter-select__label">{label}</span>
    <select
      className="filter-select__control"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map(({ value: optValue, label: optLabel }) => (
        <option key={optValue} value={optValue}>
          {optLabel}
        </option>
      ))}
    </select>
  </label>
)
