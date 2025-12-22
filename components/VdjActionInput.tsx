import React from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const VDJ_COMMANDS = [
  // --- Transport & Deck Controls ---
  'play_pause', 'stop', 'cue_stop', 'sync', 'loop', 'reloop', 'loop_halve', 'loop_double',
  'pitch_reset', 'pitch_bend +1%', 'pitch_bend -1%', 'vinyl_mode',
  
  // --- Mixer & EQ (Analog/Faders) ---
  'volume', 'volume_deck 1', 'volume_deck 2', 'crossfader', 
  'eq_low', 'eq_mid', 'eq_high', 'filter', 'gain', 'pitch',
  'eq_low_deck 1', 'eq_mid_deck 1', 'eq_high_deck 1',
  'eq_low_deck 2', 'eq_mid_deck 2', 'eq_high_deck 2',
  'master_volume', 'headphones_volume', 'headphones_mix',
  'cue_monitor_deck 1', 'cue_monitor_deck 2',
  
  // --- Jog Wheel & Scratching ---
  'jog_wheel', 'scratch', 'touch_wheel', 'search', 'jog_wheel_touch',
  
  // --- Navigation & Browser ---
  'browser_scroll', 'browser_enter', 'browser_back', 'load',
  'sideview_scroll', 'sideview_enter', 'playlist_add',
  
  // --- Performance & Hotcues ---
  'hotcue 1', 'hotcue 2', 'hotcue 3', 'hotcue 4', 'hotcue 5', 'hotcue 6', 'hotcue 7', 'hotcue 8',
  'delete_hotcue 1', 'goto_hotcue 1',
  
  // --- Sampler ---
  'sampler_play 1', 'sampler_play 2', 'sampler_play 3', 'sampler_play 4',
  'sampler_stop 1', 'sampler_volume', 'sampler_bank next', 'sampler_bank prev',
  'sampler_pad 1', 'sampler_pad 2', 'sampler_pad 3', 'sampler_pad 4',
  
  // --- Effects ---
  'effect active', 'effect select +1', 'effect select -1',
  'effect slider 1', 'effect slider 2', 'effect slider 3',
  'effect_button 1', 'effect_button 2', 'effect_knob 1', 'effect_knob 2',
  
  // --- Miscellaneous ---
  'mic_active', 'talkover', 'record', 'automix'
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