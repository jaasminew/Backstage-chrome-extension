import { useEffect } from 'react';
import { ChevronDown, User, Mic, Users } from 'lucide-react';
import type { Persona } from '../store/useVideoStore';

interface PersonaSelectorProps {
  personas: Persona[];
  selected: Persona | null;
  onChange: (persona: Persona) => void;
  disabled?: boolean;
}

const roleIcons = {
  host: Mic,
  guest: User,
  speaker: Users,
};

const roleLabels = {
  host: 'Host',
  guest: 'Guest',
  speaker: 'Speaker',
};

export function PersonaSelector({
  personas,
  selected,
  onChange,
  disabled = false,
}: PersonaSelectorProps) {
  // Auto-select if only one persona
  useEffect(() => {
    if (personas.length === 1 && !selected) {
      onChange(personas[0]);
    }
  }, [personas, selected, onChange]);

  // Don't render dropdown if only one speaker
  if (personas.length === 1) {
    const persona = personas[0];
    const Icon = roleIcons[persona.role];
    
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{persona.name}</span>
        <span className="text-xs text-gray-400">({roleLabels[persona.role]})</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1">
        Chat with:
      </label>
      <div className="relative">
        <select
          value={selected?.name || ''}
          onChange={(e) => {
            const persona = personas.find((p) => p.name === e.target.value);
            if (persona) onChange(persona);
          }}
          disabled={disabled}
          className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-2 pl-3 pr-10 text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="" disabled>
            Select a speaker...
          </option>
          {personas.map((persona) => (
            <option key={persona.name} value={persona.name}>
              {persona.name} ({roleLabels[persona.role]})
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}
