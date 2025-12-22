import React from 'react';
import { DisplaySettings } from '../types';
import { Monitor, CheckCircle2, Circle, Layout } from 'lucide-react';

interface Props {
  config: DisplaySettings;
  onChange: (field: keyof DisplaySettings, value: any) => void;
}

const DisplayView: React.FC<Props> = ({ config, onChange }) => {
  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Monitor className="text-blue-400" size={24} />
            <div>
              <h3 className="font-bold text-lg">SH1106 OLED Display</h3>
              <p className="text-xs text-gray-400">Feedback für IR & MIDI Status</p>
            </div>
          </div>
          <button 
            onClick={() => onChange('enabled', !config.enabled)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${config.enabled ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
          >
            {config.enabled ? 'Aktiviert' : 'Deaktiviert'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
               <label className="text-xs text-gray-500 block mb-2 uppercase tracking-widest text-[10px]">I2C Adresse</label>
               <select 
                value={config.i2cAddress} 
                onChange={e => onChange('i2cAddress', e.target.value)}
                className="w-full bg-transparent outline-none font-mono text-sm"
               >
                 <option value="0x3C">0x3C (Standard)</option>
                 <option value="0x3D">0x3D</option>
               </select>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
               <span className="text-xs text-gray-500 uppercase tracking-widest text-[10px]">Invertieren</span>
               <input type="checkbox" checked={config.inverted} onChange={e => onChange('inverted', e.target.checked)} className="w-5 h-5 rounded bg-gray-800 border-gray-700"/>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Layout & Modus</h4>
            <div className="space-y-2">
              <button 
                onClick={() => onChange('deckMode', !config.deckMode)} 
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${config.deckMode ? 'bg-blue-600/20 border-blue-500 text-blue-100' : 'bg-gray-900 border-gray-700 text-gray-400'}`}
              >
                <div className="flex items-center gap-2">
                  <Layout size={16} />
                  <div className="text-left">
                    <div className="text-sm font-bold">DJ Deck Split-Modus</div>
                    <div className="text-[10px] opacity-70">Teilt Display in Deck 1 (Links) & Deck 2 (Rechts)</div>
                  </div>
                </div>
                {config.deckMode ? <CheckCircle2 className="text-blue-400" size={18}/> : <Circle className="text-gray-700" size={18}/>}
              </button>

              <button onClick={() => onChange('showIrLog', !config.showIrLog)} className="w-full flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">
                <span className="text-sm">IR Protokoll & Codes im Log</span>
                {config.showIrLog ? <CheckCircle2 className="text-green-500" size={18}/> : <Circle className="text-gray-700" size={18}/>}
              </button>
              
              <button onClick={() => onChange('showMidiLog', !config.showMidiLog)} className="w-full flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">
                <span className="text-sm">MIDI Aktivität im Log</span>
                {config.showMidiLog ? <CheckCircle2 className="text-green-500" size={18}/> : <Circle className="text-gray-700" size={18}/>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-orange-900/10 border border-orange-900/30 rounded-lg">
        <h5 className="text-orange-400 font-bold text-xs mb-2 uppercase flex items-center gap-2">
          <Monitor size={14} /> Hardware Hinweis
        </h5>
        <p className="text-[11px] text-orange-200/70 leading-relaxed">
          Verwende für den RP2040 vorzugsweise die Hardware-I2C Pins. 
          Standardmäßig sind dies meist <strong>GPIO 4 (SDA)</strong> und <strong>GPIO 5 (SCL)</strong>. 
          Das SH1106 Display reagiert sehr flüssig auf Zustandsänderungen im Split-Modus.
        </p>
      </div>
    </div>
  );
};
export default DisplayView;