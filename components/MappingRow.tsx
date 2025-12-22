import React from 'react';
import { Mapping, MidiType, IrProtocol } from '../types';
import { Trash2, Radio } from 'lucide-react';
import VdjActionInput from './VdjActionInput';

interface Props {
  mapping: Mapping;
  isLearning: boolean;
  onLearn: (id: string) => void;
  onChange: (id: string, field: keyof Mapping, value: any) => void;
  onDelete: (id: string) => void;
}

const MappingRow: React.FC<Props> = ({ mapping, isLearning, onLearn, onChange, onDelete }) => {
  return (
    <div className={`grid grid-cols-12 gap-2 items-center bg-gray-800 p-3 rounded-md border transition-colors mb-2 ${isLearning ? 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'border-gray-700 hover:border-blue-500/50'}`}>
      
      {/* IR Code Input with Learn Button */}
      <div className="col-span-3 flex gap-1">
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">IR Command & Protocol</label>
          <div className="flex gap-1">
            <select
              value={mapping.irProtocol}
              onChange={(e) => onChange(mapping.id, 'irProtocol', e.target.value as IrProtocol)}
              className="bg-gray-900 border border-gray-600 rounded px-1 py-1 text-[10px] text-orange-400 focus:outline-none focus:border-blue-500"
            >
              {Object.values(IrProtocol).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              type="text"
              value={mapping.irCode}
              onChange={(e) => {
                const raw = e.target.value;
                const withoutPrefix = raw.replace(/^0x/i, '');
                const hexOnly = withoutPrefix.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
                if (hexOnly.length > 0) {
                  onChange(mapping.id, 'irCode', '0x' + hexOnly);
                } else {
                  onChange(mapping.id, 'irCode', '');
                }
              }}
              placeholder="0x45"
              className={`flex-1 bg-gray-900 border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-blue-500 ${isLearning ? 'border-orange-500 text-orange-400' : 'border-gray-600 text-green-400'}`}
            />
          </div>
        </div>
        <div className="flex items-end pb-[1px]">
          <button
            onClick={() => onLearn(mapping.id)}
            className={`p-1.5 rounded border transition-all ${
              isLearning 
                ? 'bg-orange-500/20 border-orange-500 text-orange-400 animate-pulse' 
                : 'bg-gray-800 border-gray-600 text-gray-400 hover:text-white hover:border-gray-400'
            }`}
            title="IR Code lernen"
          >
            <Radio size={16} />
          </button>
        </div>
      </div>

      {/* MIDI Type */}
      <div className="col-span-2">
        <label className="text-xs text-gray-400 block mb-1">Typ</label>
        <select
          value={mapping.midiType}
          onChange={(e) => onChange(mapping.id, 'midiType', e.target.value as MidiType)}
          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
        >
          {Object.values(MidiType).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
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
          {mapping.midiType === MidiType.CC ? 'CC' : mapping.midiType === MidiType.PROGRAM_CHANGE ? 'Prg' : 'Note'}
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

      {/* Data 2 (Velocity/Value) */}
      <div className="col-span-1">
        <label className="text-xs text-gray-400 block mb-1">
          {mapping.midiType === MidiType.CC ? 'Val' : 'Vel'}
        </label>
        <input
          type="number"
          min="0"
          max="127"
          disabled={mapping.midiType === MidiType.PROGRAM_CHANGE}
          value={mapping.data2}
          onChange={(e) => onChange(mapping.id, 'data2', parseInt(e.target.value))}
          className={`w-full bg-gray-900 border border-gray-600 rounded px-1 py-1 text-sm text-center focus:outline-none focus:border-blue-500 ${mapping.midiType === MidiType.PROGRAM_CHANGE ? 'opacity-30 cursor-not-allowed' : ''}`}
        />
      </div>

      {/* VDJ Action */}
      <div className="col-span-3">
        <label className="text-xs text-gray-400 block mb-1">VirtualDJ Action</label>
        <VdjActionInput
          value={mapping.vdjAction || ''}
          onChange={(val) => onChange(mapping.id, 'vdjAction', val)}
          placeholder="z.B. play_pause"
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

export default MappingRow;