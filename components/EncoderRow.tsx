import React from 'react';
import { EncoderMapping, MidiType } from '../types';
import { Trash2, RotateCw, CircleDot } from 'lucide-react';
import VdjActionInput from './VdjActionInput';

interface Props {
  mapping: EncoderMapping;
  onChange: (id: string, field: keyof EncoderMapping, value: any) => void;
  onDelete: (id: string) => void;
}

const EncoderRow: React.FC<Props> = ({ mapping, onChange, onDelete }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-md border border-gray-700 hover:border-blue-500/50 mb-4 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <RotateCw className="text-blue-400" size={18} />
        <input 
          type="text" 
          value={mapping.name} 
          onChange={e => onChange(mapping.id, 'name', e.target.value)}
          className="bg-transparent border-b border-gray-600 focus:border-blue-500 outline-none text-sm font-bold flex-1"
        />
        <button onClick={() => onDelete(mapping.id)} className="text-gray-500 hover:text-red-500"><Trash2 size={16}/></button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div>
          <label className="text-[10px] text-gray-500 uppercase font-bold">Pin A (Rotate)</label>
          <input type="number" value={mapping.pinA} onChange={e => onChange(mapping.id, 'pinA', parseInt(e.target.value))} className="w-full bg-gray-900 border border-gray-700 p-1.5 rounded text-sm focus:border-blue-500 outline-none"/>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 uppercase font-bold">Pin B (Rotate)</label>
          <input type="number" value={mapping.pinB} onChange={e => onChange(mapping.id, 'pinB', parseInt(e.target.value))} className="w-full bg-gray-900 border border-gray-700 p-1.5 rounded text-sm focus:border-blue-500 outline-none"/>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 uppercase font-bold">CC # (Rotate)</label>
          <input type="number" value={mapping.ccNumber} onChange={e => onChange(mapping.id, 'ccNumber', parseInt(e.target.value))} className="w-full bg-gray-900 border border-gray-700 p-1.5 rounded text-sm focus:border-blue-500 outline-none"/>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 uppercase font-bold">Multiplier</label>
          <input type="number" step="0.1" value={mapping.multiplier} onChange={e => onChange(mapping.id, 'multiplier', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 p-1.5 rounded text-sm focus:border-blue-500 outline-none"/>
        </div>
      </div>

      <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 mb-6">
        <div className="flex items-center gap-2 mb-3 text-gray-400">
          <CircleDot size={14} className="text-green-500" />
          <span className="text-xs font-bold uppercase tracking-wider">Encoder Button (Optional)</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] text-gray-500 uppercase">Button Pin</label>
            <input 
              type="number" 
              value={mapping.pinButton === undefined ? '' : mapping.pinButton} 
              onChange={e => onChange(mapping.id, 'pinButton', e.target.value === '' ? undefined : parseInt(e.target.value))} 
              className="w-full bg-gray-900 border border-gray-700 p-1.5 rounded text-sm focus:border-green-500 outline-none"
              placeholder="z.B. 12"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase">Btn Midi Typ</label>
            <select 
              value={mapping.buttonMidiType || MidiType.NOTE_ON} 
              onChange={e => onChange(mapping.id, 'buttonMidiType', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 p-1.5 rounded text-sm focus:border-green-500 outline-none text-white"
            >
              <option value={MidiType.NOTE_ON}>Note</option>
              <option value={MidiType.CC}>CC</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase">Btn Note/CC #</label>
            <input 
              type="number" 
              value={mapping.buttonData1 || ''} 
              onChange={e => onChange(mapping.id, 'buttonData1', parseInt(e.target.value))} 
              className="w-full bg-gray-900 border border-gray-700 p-1.5 rounded text-sm focus:border-green-500 outline-none"
              placeholder="60"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] text-gray-500 uppercase">VDJ Rotation Action</label>
          <VdjActionInput value={mapping.vdjActionRotate || ''} onChange={val => onChange(mapping.id, 'vdjActionRotate', val)} placeholder="browser_scroll" className="w-full bg-gray-900 border border-gray-700 p-1.5 rounded text-xs text-blue-300 outline-none focus:border-blue-500"/>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 uppercase">VDJ Click Action</label>
          <VdjActionInput value={mapping.vdjActionClick || ''} onChange={val => onChange(mapping.id, 'vdjActionClick', val)} placeholder="browser_enter" className="w-full bg-gray-900 border border-gray-700 p-1.5 rounded text-xs text-green-300 outline-none focus:border-green-500"/>
        </div>
      </div>
    </div>
  );
};
export default EncoderRow;