import React, { useState, useRef, useEffect } from 'react';
import { City } from 'country-state-city';

export interface CityLocationAutocompleteProps {
  locations: string[];
  error: string;
  onAdd: (city: string) => void;
  onRemove: (idx: number) => void;
  /** Field label (e.g. "Location" or "Locations *") */
  label?: string;
}

/**
 * City search + "+ Add" + chip list — same pattern as Add Client step 2.
 */
const CityLocationAutocomplete: React.FC<CityLocationAutocompleteProps> = ({
  locations,
  error,
  onAdd,
  onRemove,
  label = 'Location',
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);

    if (val.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const allCities = City.getAllCities();
    const lower = val.toLowerCase();

    const matched = allCities
      .filter((c) => c.name.toLowerCase().startsWith(lower))
      .map((c) => c.name);

    const unique = [...new Set(matched)].slice(0, 8);

    setSuggestions(unique);
    setOpen(unique.length > 0);
  };

  const handleSelect = (city: string) => {
    if (!locations.includes(city)) {
      onAdd(city);
    }
    setQuery('');
    setSuggestions([]);
    setOpen(false);
  };

  const labelClass = 'text-[11px] font-semibold text-gray-500 uppercase tracking-wider required';

  return (
    <div className="flex w-full flex-col gap-1">
      <label className={labelClass}>{label}</label>

      <div ref={wrapperRef} className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Type a city name…"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20
              bg-white placeholder:text-gray-400"
          />

          <button
            type="button"
            onClick={() => {
              if (query.trim()) handleSelect(query.trim());
            }}
            disabled={!query.trim()}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex-shrink-0
              ${
                query.trim()
                  ? 'bg-[var(--brand)] hover:bg-[#1a4a7a] text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            + Add
          </button>
        </div>

        {open && (
          <ul
            className="absolute z-50 mt-1 w-full bg-white border border-gray-200
            rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {suggestions.map((city) => (
              <li
                key={city}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(city)}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors
                  ${
                    locations.includes(city)
                      ? 'text-gray-300 cursor-default'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-[var(--brand)]'
                  }`}
              >
                {city}
                {locations.includes(city) && (
                  <span className="ml-2 text-[11px] text-gray-400">already added</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className={`min-h-[52px] bg-gray-50 border rounded-lg p-2.5
        flex flex-wrap gap-1.5 mt-1
        ${error ? 'border-red-400' : 'border-gray-200'}`}
      >
        {locations.length === 0 ? (
          <span className="text-xs text-gray-400">Search and add cities…</span>
        ) : (
          locations.map((loc, i) => (
            <button
              key={`${loc}-${i}`}
              type="button"
              onClick={() => onRemove(i)}
              className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-50
                border border-blue-200 text-blue-700 text-xs rounded-full
                hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
            >
              {loc}
              <span className="ml-0.5 opacity-60">×</span>
            </button>
          ))
        )}
      </div>

      {error ? <span className="text-[11px] text-red-500 mt-0.5">{error}</span> : null}
    </div>
  );
};

export default CityLocationAutocomplete;
