import React, { useState } from 'react';
import { KeypadMapping, MidiType } from '../types';
import { Trash2, Grid3X3, Music, FileCode } from 'lucide-react';
import VdjActionInput from './VdjActionInput';

interface Props {
  mapping: KeypadMapping;
  onChange: (id: string, field: keyof KeypadMapping, value: any) => void;
  onDelete: (id: string) => void;
}

const KeypadRow: React.FC<Props> = ({ mapping, onChange, onDelete }) => {
  const [viewMode, setViewMode] = useState<'midi' | 'vdj'>('midi');

  const updateMatrixValue = (rowIdx: number, colIdx: number, value: number) => {
    const newValues = mapping.values.map(row => [...row]);
    newValues[rowIdx][colIdx] = value;
    onChange(mapping.id, 'values', newValues);
  };

  const updateVdjAction = (rowIdx: number, colIdx: number, value: string) => {
    const newActions = (mapping.vdjActions || Array(4).fill(0).map(() => Array(4).fill(''))).map(row => [...row]);
    newActions[rowIdx][colIdx] = value;
    onChange(mapping.id, 'vdjActions', newActions);
  };

  const updatePin = (type: 'rowPins' | 'colPins', index: number, value: number) => {
    const newPins = [...mapping[type]];
    newPins[index] = value;
    onChange(mapping.id, type, newPins);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-md border border-gray-700 hover:border-green-500/50 transition-colors mb-4">
      
      {/* Header */}
      <div className="flex gap-4 items-end mb-4 border-b border-gray-700 pb-3">
        <div className="flex items-center gap-2 text-green-400 font-medium">
            <Grid3X3 size={18} />
        </div>
        
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Name</label>
          <input
            type="text"
            value={mapping.name}
            onChange={(e) => onChange(mapping.id, 'name', e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-green-500"
          />
        </div>

        <div className="w-32">
          <label className="text-xs text-gray-400 block mb-1">MIDI Mode</label>
          <select
            value={mapping.mode}
            onChange={(e) => onChange(mapping.id, 'mode', e.target.value as MidiType)}
            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-green-500"
          >
            <option value={MidiType.NOTE_ON}>Notes</option>
            <option value={MidiType.CC}>CC</option>
          </select>
        </div>

        <div className="w-24">
          <label className="text-xs font-bold text-blue-400 block mb-1 uppercase tracking-tighter">MIDI Channel</label>
          <input
            type="number"
            min="1"
            max="16"
            value={mapping.channel}
            onChange={(e) => onChange(mapping.id, 'channel', parseInt(e.target.value))}
            className="w-full bg-gray-900 border border-blue-900/50 rounded px-2 py-1 text-sm font-bold text-center text-blue-300 focus:outline-none focus:border-blue-500"
            title="Eigenständiger MIDI-Kanal für dieses Keypad"
          />
        </div>

        <button
          onClick={() => onDelete(mapping.id)}
          className="text-gray-500 hover:text-red-500 transition-colors p-1.5 hover:bg-red-500/10 rounded"
          title="Entfernen"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Pins Config */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
           <label className="text-xs text-gray-400 block mb-2 font-mono uppercase">Row Pins (Outputs)</label>
           <div className="flex gap-2">
             {mapping.rowPins.map((pin, idx) => (
                <div key={`r-${idx}`} className="flex-1">
                   <input
                    type="number"
                    value={pin}
                    onChange={(e) => updatePin('rowPins', idx, parseInt(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-1 py-1 text-sm text-center focus:outline-none focus:border-green-500"
                    placeholder={`R${idx+1}`}
                   />
                </div>
             ))}
           </div>
        </div>
        <div>
           <label className="text-xs text-gray-400 block mb-2 font-mono uppercase">Col Pins (Inputs)</label>
           <div className="flex gap-2">
             {mapping.colPins.map((pin, idx) => (
                <div key={`c-${idx}`} className="flex-1">
                   <input
                    type="number"
                    value={pin}
                    onChange={(e) => updatePin('colPins', idx, parseInt(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-1 py-1 text-sm text-center focus:outline-none focus:border-green-500"
                    placeholder={`C${idx+1}`}
                   />
                </div>
             ))}
           </div>
        </div>
      </div>

      {/* Grid Matrix Toggle */}
      <div className="flex justify-center mb-3">
        <div className="bg-gray-900 rounded-lg p-1 flex">
          <button 
            onClick={() => setViewMode('midi')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'midi' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Music size={14} /> MIDI Setup
          </button>
          <button 
            onClick={() => setViewMode('vdj')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'vdj' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <FileCode size={14} /> VDJ Actions
          </button>
        </div>
      </div>

      {/* Grid Matrix View */}
      <div>
        <div className="grid grid-rows-4 gap-2">
          {mapping.values.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-4 gap-2">
              {row.map((val, cIdx) => (
                viewMode === 'midi' ? (
                  <div key={`${rIdx}-${cIdx}`} className="relative group">
                    <input
                      type="number"
                      min="0"
                      max="127"
                      value={val}
                      onChange={(e) => updateMatrixValue(rIdx, cIdx, parseInt(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-600 rounded py-2 text-center text-sm focus:outline-none focus:border-green-500 hover:bg-gray-800 transition-colors"
                    />
                    <div className="absolute top-0 right-1 text-[8px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {rIdx+1},{cIdx+1}
                    </div>
                  </div>
                ) : (
                  <VdjActionInput
                    key={`vdj-${rIdx}-${cIdx}`}
                    value={(mapping.vdjActions && mapping.vdjActions[rIdx] && mapping.vdjActions[rIdx][cIdx]) || ''}
                    onChange={(val) => updateVdjAction(rIdx, cIdx, val)}
                    placeholder="..."
                    className="w-full bg-gray-900 border border-gray-600 rounded py-2 text-center text-[10px] text-blue-200 focus:outline-none focus:border-blue-500 placeholder-gray-800 hover:bg-gray-800 transition-colors"
                  />
                )
              ))}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default KeypadRow;