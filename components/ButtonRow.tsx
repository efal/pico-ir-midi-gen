import React from 'react';
import { ButtonMapping, MidiType } from '../types';
import { Trash2 } from 'lucide-react';
import VdjActionInput from './VdjActionInput';

interface Props {
  mapping: ButtonMapping;
  onChange: (id: string, field: keyof ButtonMapping, value: any) => void;
  onDelete: (id: string) => void;
}

const ButtonRow: React.FC<Props> = ({ mapping, onChange, onDelete }) => {
  return (
    <div className="grid grid-cols-12 gap-2 items-center bg-gray-800 p-3 rounded-md border border-gray-700 hover:border-blue-500/50 transition-colors mb-2">
      
      {/* Name */}
      <div className="col-span-2">
        <label className="text-xs text-gray-400 block mb-1">Name</label>
        <input
          type="text"
          value={mapping.name}
          onChange={(e) => onChange(mapping.id, 'name', e.target.value)}
          placeholder="z.B. Play"
          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Pin */}
      <div className="col-span-2">
        <label className="text-xs text-gray-400 block mb-1">GPIO</label>
        <input
          type="number"
          value={mapping.pin}
          onChange={(e) => onChange(mapping.id, 'pin', parseInt(e.target.value))}
          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* MIDI Type */}
      <div className="col-span-2">
        <label className="text-xs text-gray-400 block mb-1">Typ</label>
        <select
          value={mapping.midiType}
          onChange={(e) => onChange(mapping.id, 'midiType', e.target.value as any)}
          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value={MidiType.NOTE_ON}>Note</option>
          <option value={MidiType.CC}>CC</option>
        </select>
      </div>

      {/* Channel */}
      <div className="col-span-1">
        <label className="text-xs text-gray-400 block mb-1">Ch</label>
        <input
          type="number"
          min="1"
          max="16"
          value={mapping.channel}
          onChange={(e) => onChange(mapping.id, 'channel', parseInt(e.target.value))}
          className="w-full bg-gray-900 border border-gray-600 rounded px-1 py-1 text-sm text-center focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Data 1 (Note/CC) */}
      <div className="col-span-1">
        <label className="text-xs text-gray-400 block mb-1">
          {mapping.midiType === MidiType.CC ? 'CC' : 'Note'}
        </label>
        <input
          type="number"
          min="0"
          max="127"
          value={mapping.data1}
          onChange={(e) => onChange(mapping.id, 'data1', parseInt(e.target.value))}
          className="w-full bg-gray-900 border border-gray-600 rounded px-1 py-1 text-sm text-center focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* VDJ Action */}
      <div className="col-span-3">
        <label className="text-xs text-gray-400 block mb-1">VDJ Script</label>
        <VdjActionInput
          value={mapping.vdjAction || ''}
          onChange={(val) => onChange(mapping.id, 'vdjAction', val)}
          placeholder="hotcue 1"
          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-blue-200 focus:outline-none focus:border-blue-500 placeholder-gray-700"
        />
      </div>

      {/* Delete Button */}
      <div className="col-span-1 flex justify-end items-end h-full pb-1">
         <button
          onClick={() => onDelete(mapping.id)}
          className="text-gray-500 hover:text-red-500 transition-colors p-1"
          title="Entfernen"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default ButtonRow;