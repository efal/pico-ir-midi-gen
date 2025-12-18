import React from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const VDJ_COMMANDS = [
  // Transport
  'play_pause', 'stop', 'cue_stop', 'sync',
  // Mixer
  'volume', 'crossfader', 'eq_high', 'eq_mid', 'eq_low', 'filter', 'gain', 'pitch',
  // Performance
  'hotcue 1', 'hotcue 2', 'hotcue 3', 'hotcue 4', 'loop', 'loop_half', 'loop_double', 'reloop',
  // Navigation
  'browser_scroll', 'browser_enter', 'browser_back', 'load',
  // Deck Specific (Prefixes)
  'deck 1 play_pause', 'deck 2 play_pause', 'deck 1 volume', 'deck 2 volume'
];

const VdjActionInput: React.FC<Props> = ({ value, onChange, placeholder, className }) => {
  const listId = `vdj-commands-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative w-full">
      <input
        list={listId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      <datalist id={listId}>
        {VDJ_COMMANDS.map((cmd) => (
          <option key={cmd} value={cmd} />
        ))}
      </datalist>
    </div>
  );
};

export default VdjActionInput;