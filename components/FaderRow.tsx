import React from 'react';
import { FaderMapping } from '../types';
import { Trash2 } from 'lucide-react';
import VdjActionInput from './VdjActionInput';

interface Props {
  mapping: FaderMapping;
  onChange: (id: string, field: keyof FaderMapping, value: any) => void;
  onDelete: (id: string) => void;
}

const FaderRow: React.FC<Props> = ({ mapping, onChange, onDelete }) => {
  return (
    <div className="grid grid-cols-12 gap-2 items-center bg-gray-800 p-3 rounded-md border border-gray-700 hover:border-purple-500/50 transition-colors mb-2">
      
      {/* Name */}
      <div className="col-span-2">
        <label className="text-xs text-gray-400 block mb-1">Name</label>
        <input
          type="text"
          value={mapping.name}
          onChange={(e) => onChange(mapping.id, 'name', e.target.value)}
          placeholder="z.B. Volume"
          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Pin */}
      <div className="col-span-2">
        <label className="text-xs text-gray-400 block mb-1">GPIO (A)</label>
        <input
          type="number"
          value={mapping.pin}
          onChange={(e) => onChange(mapping.id, 'pin', parseInt(e.target.value))}
          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-purple-500"
          placeholder="26"
        />
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
          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Data 1 (CC Number) */}
      <div className="col-span-2">
        <label className="text-xs text-gray-400 block mb-1">CC #</label>
        <input
          type="number"
          min="0"
          max="127"
          value={mapping.ccNumber}
          onChange={(e) => onChange(mapping.id, 'ccNumber', parseInt(e.target.value))}
          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* VDJ Action */}
      <div className="col-span-4">
        <label className="text-xs text-gray-400 block mb-1">VDJ Script</label>
        <VdjActionInput
          value={mapping.vdjAction || ''}
          onChange={(val) => onChange(mapping.id, 'vdjAction', val)}
          placeholder="volume_deck 1"
          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-purple-200 focus:outline-none focus:border-purple-500 placeholder-gray-700"
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

export default FaderRow;