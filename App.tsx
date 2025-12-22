import React, { useState, useEffect, useRef } from 'react';
import { Mapping, ButtonMapping, FaderMapping, KeypadMapping, EncoderMapping, MidiType, IrProtocol, GeneratorConfig } from './types';
import { generateArduinoCode } from './services/codeGenerator';
import { generateVdjXml } from './services/vdjGenerator';
import MappingRow from './components/MappingRow';
import ButtonRow from './components/ButtonRow';
import FaderRow from './components/FaderRow';
import KeypadRow from './components/KeypadRow';
import EncoderRow from './components/EncoderRow';
import DisplayView from './components/DisplayView';
import Assistant from './components/Assistant';
import { Plus, Download, Copy, Code2, Cpu, Settings, Bot, AlertTriangle, Plug, Unplug, Radio, CircleDot, Sliders, Grid3X3, FileCode, Info, RotateCw, Monitor } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [config, setConfig] = useState<GeneratorConfig>({
    irPin: 15,
    useLedFeedback: true,
    controllerName: 'MyRP2040Controller',
    display: {
      enabled: false,
      sdaPin: 4,
      sclPin: 5,
      i2cAddress: '0x3C',
      showIrLog: true,
      showMidiLog: true,
      inverted: false,
      deckMode: true
    }
  });

  // Data Models
  const [mappings, setMappings] = useState<Mapping[]>([
    { id: '1', irCode: '0x45', irProtocol: IrProtocol.NEC, midiType: MidiType.NOTE_ON, channel: 1, data1: 60, data2: 127, vdjAction: 'play_pause' },
  ]);

  const [buttons, setButtons] = useState<ButtonMapping[]>([]);
  const [faders, setFaders] = useState<FaderMapping[]>([]);
  const [encoders, setEncoders] = useState<EncoderMapping[]>([]);
  const [keypads, setKeypads] = useState<KeypadMapping[]>([]);

  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedXml, setGeneratedXml] = useState('');
  
  // UI State
  const [activeRightTab, setActiveRightTab] = useState<'code' | 'xml' | 'assistant'>('code');
  const [activeView, setActiveView] = useState<'ir' | 'buttons' | 'faders' | 'encoders' | 'keypad' | 'display'>('ir');

  // Serial & Learning State
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [learningId, setLearningId] = useState<string | null>(null);
  
  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const readableStreamClosedRef = useRef<Promise<void> | null>(null);
  const keepReadingRef = useRef(false);
  const mappingsRef = useRef(mappings);
  const learningIdRef = useRef(learningId);

  useEffect(() => { mappingsRef.current = mappings; }, [mappings]);
  useEffect(() => { learningIdRef.current = learningId; }, [learningId]);

  useEffect(() => {
    const code = generateArduinoCode(mappings, buttons, faders, keypads, config, encoders);
    const xml = generateVdjXml(mappings, buttons, faders, keypads, config, encoders);
    setGeneratedCode(code);
    setGeneratedXml(xml);
  }, [mappings, buttons, faders, keypads, encoders, config]);

  const connectSerial = async () => {
    if (!('serial' in navigator)) return;
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      setIsSerialConnected(true);
      readSerialLoop(port);
    } catch (err) { console.error(err); }
  };

  const disconnectSerial = async () => {
    keepReadingRef.current = false;
    if (readerRef.current) await readerRef.current.cancel();
    if (portRef.current) await portRef.current.close();
    setIsSerialConnected(false);
    setLearningId(null);
  };

  const readSerialLoop = async (port: any) => {
    const textDecoder = new TextDecoderStream();
    readableStreamClosedRef.current = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader;
    keepReadingRef.current = true;
    let buffer = '';
    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) processSerialLine(line.trim());
        }
      }
    } catch (e) {} finally { reader.releaseLock(); }
  };

  const processSerialLine = (line: string) => {
    const match = line.match(/Protocol:\s*(\w+)\s*Code:\s*(0x[0-9A-Fa-f]+)/);
    if (match && learningIdRef.current && activeView === 'ir') {
      const detectedProtocol = match[1].toUpperCase();
      const detectedCode = match[2];
      const currentMappings = mappingsRef.current;
      const currentIndex = currentMappings.findIndex(m => m.id === learningIdRef.current);
      if (currentIndex !== -1) {
        let p = IrProtocol.NEC;
        if (detectedProtocol.includes('SONY')) p = IrProtocol.SONY;
        else if (detectedProtocol.includes('RC5')) p = IrProtocol.RC5;
        const updated = [...currentMappings];
        updated[currentIndex] = { ...updated[currentIndex], irCode: detectedCode, irProtocol: p };
        setMappings(updated);
        const next = currentIndex + 1;
        setLearningId(next < currentMappings.length ? currentMappings[next].id : null);
      }
    }
  };

  const updateConfig = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateDisplayConfig = (field: keyof GeneratorConfig['display'], value: any) => {
    setConfig(prev => ({ ...prev, display: { ...prev.display, [field]: value } }));
  };

  const copyToClipboard = () => {
    const content = activeRightTab === 'xml' ? generatedXml : generatedCode;
    navigator.clipboard.writeText(content);
    alert(`${activeRightTab === 'xml' ? 'XML' : 'Code'} in die Zwischenablage kopiert!`);
  };

  const downloadFile = () => {
    const isXml = activeRightTab === 'xml';
    const content = isXml ? generatedXml : generatedCode;
    const ext = isXml ? 'xml' : 'ino';
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.controllerName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 font-sans overflow-hidden">
      <aside className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold flex items-center gap-2 text-blue-400"><Cpu /> RP2040 Controller</h1>
          <p className="text-xs text-gray-500 mt-1">MIDI Generator Tool</p>
        </div>
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <h2 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-3 flex items-center gap-2"><Settings size={14} /> Global Settings</h2>
            <div className="space-y-4">
              <input type="text" value={config.controllerName} onChange={(e) => updateConfig('controllerName', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" placeholder="Controller Name"/>
              <div>
                <label className="block text-xs text-gray-400 mb-1">IR Receiver Pin</label>
                <input type="number" value={config.irPin} onChange={(e) => updateConfig('irPin', parseInt(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"/>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="led" checked={config.useLedFeedback} onChange={(e) => updateConfig('useLedFeedback', e.target.checked)}/>
                <label htmlFor="led" className="text-sm text-gray-300">LED Feedback</label>
              </div>
            </div>
          </div>
          <div className="p-4 bg-blue-900/20 border border-blue-900/50 rounded text-xs">
            <div className="font-bold text-blue-400 flex items-center gap-2 mb-2"><Monitor size={14}/> I2C (OLED) Pins</div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-gray-500 block text-[10px] uppercase">SDA</label><input type="number" value={config.display.sdaPin} onChange={e => updateDisplayConfig('sdaPin', parseInt(e.target.value))} className="w-full bg-black/30 p-1 rounded text-center"/></div>
              <div><label className="text-gray-500 block text-[10px] uppercase">SCL</label><input type="number" value={config.display.sclPin} onChange={e => updateDisplayConfig('sclPin', parseInt(e.target.value))} className="w-full bg-black/30 p-1 rounded text-center"/></div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-sm">
          <div className="flex bg-gray-800 rounded-lg p-1 overflow-x-auto">
            <button onClick={() => setActiveView('ir')} className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-2 transition-all ${activeView === 'ir' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}><Radio size={14}/>IR</button>
            <button onClick={() => setActiveView('buttons')} className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-2 transition-all ${activeView === 'buttons' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}><CircleDot size={14}/>Buttons</button>
            <button onClick={() => setActiveView('faders')} className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-2 transition-all ${activeView === 'faders' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}><Sliders size={14}/>Fader</button>
            <button onClick={() => setActiveView('encoders')} className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-2 transition-all ${activeView === 'encoders' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}><RotateCw size={14}/>Encoder</button>
            <button onClick={() => setActiveView('keypad')} className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-2 transition-all ${activeView === 'keypad' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}><Grid3X3 size={14}/>Keypad</button>
            <button onClick={() => setActiveView('display')} className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-2 transition-all ${activeView === 'display' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}><Monitor size={14}/>Display</button>
          </div>
          <div className="flex items-center gap-4">
             {activeView === 'ir' && (
                !isSerialConnected ? (
                   <button onClick={connectSerial} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-full text-xs font-medium">
                     <Unplug size={14} /> Verbinden
                   </button>
                ) : (
                   <button onClick={disconnectSerial} className="flex items-center gap-2 bg-green-900/30 border border-green-800 text-green-400 px-3 py-1.5 rounded-full text-xs font-medium">
                     <Plug size={14} /> Verbunden
                   </button>
                )
             )}

            <button onClick={() => {
              if(activeView==='ir') setMappings([...mappings, {id:Date.now().toString(), irCode:'', irProtocol:IrProtocol.NEC, midiType:MidiType.NOTE_ON, channel:1, data1:60, data2:127}]);
              if(activeView==='buttons') setButtons([...buttons, {id:Date.now().toString(), name: `Button ${buttons.length + 1}`, pin: 0, midiType: MidiType.NOTE_ON, channel: 1, data1: 60}]);
              if(activeView==='faders') setFaders([...faders, {id:Date.now().toString(), name: `Fader ${faders.length + 1}`, pin: 26, channel: 1, ccNumber: 1}]);
              if(activeView==='encoders') setEncoders([...encoders, {id:Date.now().toString(), name:'New Encoder', pinA:10, pinB:11, channel:1, ccNumber:20, multiplier:1}]);
              if(activeView==='keypad') setKeypads([...keypads, {id:Date.now().toString(), name: `Keypad ${keypads.length + 1}`, mode: MidiType.NOTE_ON, channel: 1, rowPins: [2, 3, 4, 5], colPins: [6, 7, 8, 9], values: [[36, 37, 38, 39],[40, 41, 42, 43],[44, 45, 46, 47],[48, 49, 50, 51]], vdjActions: Array(4).fill(0).map(() => Array(4).fill(''))}]);
            }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm transition-colors shadow-lg flex items-center gap-2">
              <Plus size={16}/> Hinzufügen
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {activeView === 'ir' && mappings.map(m => <MappingRow key={m.id} mapping={m} isLearning={learningId===m.id} onLearn={id => setLearningId(id)} onChange={(id,f,v)=>setMappings(mappings.map(x=>x.id===id?{...x,[f]:v}:x))} onDelete={id=>setMappings(mappings.filter(x=>x.id!==id))}/>)}
            {activeView === 'buttons' && buttons.map(b => <ButtonRow key={b.id} mapping={b} onChange={(id,f,v)=>setButtons(buttons.map(x=>x.id===id?{...x,[f]:v}:x))} onDelete={id=>setButtons(buttons.filter(x=>x.id!==id))}/>)}
            {activeView === 'faders' && faders.map(f => <FaderRow key={f.id} mapping={f} onChange={(id,f,v)=>setFaders(faders.map(x=>x.id===id?{...x,[f]:v}:x))} onDelete={id=>setFaders(faders.filter(x=>x.id!==id))}/>)}
            {activeView === 'encoders' && encoders.map(e => <EncoderRow key={e.id} mapping={e} onChange={(id,f,v)=>setEncoders(encoders.map(x=>x.id===id?{...x,[f]:v}:x))} onDelete={id=>setEncoders(encoders.filter(x=>x.id!==id))}/>)}
            {activeView === 'keypad' && keypads.map(k => <KeypadRow key={k.id} mapping={k} onChange={(id,f,v)=>setKeypads(keypads.map(x=>x.id===id?{...x,[f]:v}:x))} onDelete={id=>setKeypads(keypads.filter(x=>x.id!==id))}/>)}
            {activeView === 'display' && <DisplayView config={config.display} onChange={updateDisplayConfig} />}
          </div>

          {/* Right Panel */}
          <div className="w-[500px] border-l border-gray-800 bg-gray-900 flex flex-col shadow-2xl">
            <div className="flex border-b border-gray-800">
              <button onClick={() => setActiveRightTab('code')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeRightTab === 'code' ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50' : 'text-gray-500 hover:text-gray-300'}`}>
                <Code2 size={16} /> Arduino
              </button>
              <button onClick={() => setActiveRightTab('xml')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeRightTab === 'xml' ? 'text-orange-400 border-b-2 border-orange-400 bg-gray-800/50' : 'text-gray-500 hover:text-gray-300'}`}>
                <FileCode size={16} /> VirtualDJ
              </button>
              <button onClick={() => setActiveRightTab('assistant')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeRightTab === 'assistant' ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-800/50' : 'text-gray-500 hover:text-gray-300'}`}>
                <Bot size={16} /> AI Hilfe
              </button>
            </div>

            <div className="flex-1 overflow-hidden p-0 relative">
              {activeRightTab === 'assistant' ? (
                 <div className="h-full p-4">
                  <Assistant currentCode={generatedCode} />
                </div>
              ) : (
                <div className="h-full flex flex-col">
                   <div className="flex-1 overflow-auto p-4 bg-[#1e1e1e] scrollbar-thin">
                    <pre className="text-[10px] font-mono text-gray-400 leading-relaxed whitespace-pre font-ligatures">
                      {activeRightTab === 'xml' ? generatedXml : generatedCode}
                    </pre>
                   </div>
                   <div className="p-4 border-t border-gray-800 bg-gray-900 flex gap-2">
                     <button onClick={copyToClipboard} className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white py-2 rounded text-sm transition-colors">
                       <Copy size={16} /> Kopieren
                     </button>
                     <button onClick={downloadFile} className={`flex-1 flex items-center justify-center gap-2 text-white py-2 rounded text-sm transition-colors ${activeRightTab === 'xml' ? 'bg-orange-700 hover:bg-orange-600' : 'bg-green-700 hover:bg-green-600'}`}>
                       <Download size={16} /> Herunterladen
                     </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;