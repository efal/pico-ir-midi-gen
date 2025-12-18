import React, { useState, useEffect, useRef } from 'react';
import { Mapping, ButtonMapping, FaderMapping, KeypadMapping, MidiType, GeneratorConfig } from './types';
import { generateArduinoCode } from './services/codeGenerator';
import { generateVdjXml } from './services/vdjGenerator';
import MappingRow from './components/MappingRow';
import ButtonRow from './components/ButtonRow';
import FaderRow from './components/FaderRow';
import KeypadRow from './components/KeypadRow';
import Assistant from './components/Assistant';
import { Plus, Download, Copy, Code2, Cpu, Settings, Bot, AlertTriangle, Plug, Unplug, Radio, CircleDot, Sliders, Grid3X3, FileCode, Info } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [config, setConfig] = useState<GeneratorConfig>({
    irPin: 15,
    useLedFeedback: true,
    controllerName: 'MyRP2040Controller'
  });

  // Data Models
  const [mappings, setMappings] = useState<Mapping[]>([
    { id: '1', irCode: '0x45', midiType: MidiType.NOTE_ON, channel: 1, data1: 60, data2: 127, vdjAction: 'play_pause' },
  ]);

  const [buttons, setButtons] = useState<ButtonMapping[]>([]);
  const [faders, setFaders] = useState<FaderMapping[]>([]);
  const [keypads, setKeypads] = useState<KeypadMapping[]>([]);

  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedXml, setGeneratedXml] = useState('');
  
  // UI State
  const [activeRightTab, setActiveRightTab] = useState<'code' | 'xml' | 'assistant'>('code');
  const [activeView, setActiveView] = useState<'ir' | 'buttons' | 'faders' | 'keypad'>('ir');

  // Serial & Learning State
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [learningId, setLearningId] = useState<string | null>(null);
  
  // Refs for Serial API management
  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const readableStreamClosedRef = useRef<Promise<void> | null>(null);
  const keepReadingRef = useRef(false);

  // Refs for accessing latest state inside async loops
  const mappingsRef = useRef(mappings);
  const learningIdRef = useRef(learningId);

  // Sync refs with state
  useEffect(() => {
    mappingsRef.current = mappings;
  }, [mappings]);

  useEffect(() => {
    learningIdRef.current = learningId;
  }, [learningId]);

  // Effect to update code
  useEffect(() => {
    const code = generateArduinoCode(mappings, buttons, faders, keypads, config);
    const xml = generateVdjXml(mappings, buttons, faders, keypads, config);
    setGeneratedCode(code);
    setGeneratedXml(xml);
  }, [mappings, buttons, faders, keypads, config]);

  // Serial Connection Logic
  const connectSerial = async () => {
    if (!('serial' in navigator)) {
      alert('Dein Browser unterstützt keine Web Serial API. Bitte nutze Chrome oder Edge.');
      return;
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      setIsSerialConnected(true);
      
      // Start reading loop
      readSerialLoop(port);
    } catch (err) {
      console.error('Serial Connection Failed:', err);
      alert('Verbindungsfehler: ' + (err as Error).message + '\n\nStelle sicher, dass du die Berechtigung erteilst und der Controller angeschlossen ist.');
    }
  };

  const disconnectSerial = async () => {
    keepReadingRef.current = false;
    
    // 1. Cancel the reader to break the loop
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (e) {
        console.warn("Reader cancel warning:", e);
      }
      readerRef.current = null;
    }

    // 2. Wait for the stream pipe to close
    if (readableStreamClosedRef.current) {
      try {
        await readableStreamClosedRef.current;
      } catch (e) {
        // Ignore errors from stream cancellation
      }
      readableStreamClosedRef.current = null;
    }

    // 3. Close the port
    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (e) {
        console.error("Port close error:", e);
      }
      portRef.current = null;
    }

    setIsSerialConnected(false);
    setLearningId(null);
  };

  const readSerialLoop = async (port: any) => {
    const textDecoder = new TextDecoderStream();
    // Store the closed promise to await it during disconnect
    readableStreamClosedRef.current = port.readable.pipeTo(textDecoder.writable);
    
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader;
    keepReadingRef.current = true;

    let buffer = '';

    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) {
          break; // Stream closed
        }
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            processSerialLine(line.trim());
          }
        }
      }
    } catch (error) {
      console.error('Read Loop Error', error);
    } finally {
      // Release lock so pipeTo can resolve/reject
      try {
        reader.releaseLock();
      } catch (e) {
        // Ignore if already released
      }
    }
  };

  // Process line using Refs to get fresh state
  const processSerialLine = (line: string) => {
    const match = line.match(/IR Code:\s*(0x[0-9A-Fa-f]+)/);
    
    if (match && match[1]) {
      const detectedCode = match[1];
      const currentLearningId = learningIdRef.current;

      if (currentLearningId && activeView === 'ir') {
        const currentMappings = mappingsRef.current;
        const currentIndex = currentMappings.findIndex(m => m.id === currentLearningId);

        if (currentIndex !== -1) {
          // Update the found mapping
          const updatedMappings = [...currentMappings];
          updatedMappings[currentIndex] = {
            ...updatedMappings[currentIndex],
            irCode: detectedCode
          };
          
          setMappings(updatedMappings);

          // Advance to next mapping if available
          const nextIndex = currentIndex + 1;
          if (nextIndex < currentMappings.length) {
            setLearningId(currentMappings[nextIndex].id);
          } else {
            // End of list
            setLearningId(null);
          }
        }
      }
    }
  };

  // --- Handlers ---
  const addMapping = () => {
    const newMapping: Mapping = {
      id: Date.now().toString(),
      irCode: '',
      midiType: MidiType.NOTE_ON,
      channel: 1,
      data1: 60,
      data2: 127
    };
    setMappings([...mappings, newMapping]);
  };

  const updateMapping = (id: string, field: keyof Mapping, value: any) => {
    setMappings(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const deleteMapping = (id: string) => {
    setMappings(mappings.filter(m => m.id !== id));
  };

  const toggleLearning = (id: string) => {
    if (!isSerialConnected) {
      alert("Bitte verbinde zuerst den Controller über USB (Klicke oben auf 'Verbinden').");
      connectSerial();
      return;
    }
    if (learningId === id) {
      setLearningId(null); 
    } else {
      setLearningId(id);
    }
  };

  const addButton = () => {
    const newBtn: ButtonMapping = {
      id: Date.now().toString(),
      name: `Button ${buttons.length + 1}`,
      pin: 0,
      midiType: MidiType.NOTE_ON,
      channel: 1,
      data1: 60
    };
    setButtons([...buttons, newBtn]);
  };

  const updateButton = (id: string, field: keyof ButtonMapping, value: any) => {
    setButtons(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const deleteButton = (id: string) => {
    setButtons(buttons.filter(b => b.id !== id));
  };

  const addFader = () => {
    const newFader: FaderMapping = {
      id: Date.now().toString(),
      name: `Fader ${faders.length + 1}`,
      pin: 26, 
      channel: 1,
      ccNumber: 1
    };
    setFaders([...faders, newFader]);
  };

  const updateFader = (id: string, field: keyof FaderMapping, value: any) => {
    setFaders(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const deleteFader = (id: string) => {
    setFaders(faders.filter(f => f.id !== id));
  };

  const addKeypad = () => {
    const newKeypad: KeypadMapping = {
      id: Date.now().toString(),
      name: `Keypad ${keypads.length + 1}`,
      mode: MidiType.NOTE_ON,
      channel: 1,
      rowPins: [2, 3, 4, 5],
      colPins: [6, 7, 8, 9],
      values: [
        [36, 37, 38, 39],
        [40, 41, 42, 43],
        [44, 45, 46, 47],
        [48, 49, 50, 51]
      ]
    };
    setKeypads([...keypads, newKeypad]);
  };

  const updateKeypad = (id: string, field: keyof KeypadMapping, value: any) => {
    setKeypads(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
  };

  const deleteKeypad = (id: string) => {
    setKeypads(keypads.filter(k => k.id !== id));
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
      
      {/* Sidebar */}
      <aside className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold flex items-center gap-2 text-blue-400">
            <Cpu /> RP2040 Controller
          </h1>
          <p className="text-xs text-gray-500 mt-1">MIDI Generator Tool</p>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <h2 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-3 flex items-center gap-2">
              <Settings size={14} /> Global Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-gray-300">Projekt Name</label>
                <input 
                  type="text" 
                  value={config.controllerName}
                  onChange={(e) => setConfig({...config, controllerName: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-300">IR Empfänger Pin (GPIO)</label>
                <input 
                  type="number" 
                  value={config.irPin}
                  onChange={(e) => setConfig({...config, irPin: parseInt(e.target.value)})}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="led"
                  checked={config.useLedFeedback}
                  onChange={(e) => setConfig({...config, useLedFeedback: e.target.checked})}
                  className="rounded bg-gray-800 border-gray-700 text-blue-500"
                />
                <label htmlFor="led" className="text-sm text-gray-300 cursor-pointer">Onboard LED Feedback</label>
              </div>
            </div>
          </div>

          <div className="p-4 bg-orange-900/20 border border-orange-900/50 rounded text-xs text-orange-200">
            <div className="flex items-center gap-2 mb-2 font-bold text-orange-400">
               <AlertTriangle size={14} /> Setup-Infos
            </div>
            <ul className="list-disc pl-4 space-y-1 text-orange-100/90">
              <li>Core: <strong>"Earle F. Philhower"</strong>.</li>
              <li>USB Stack: <strong>"Adafruit TinyUSB"</strong>.</li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-sm">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button onClick={() => setActiveView('ir')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeView === 'ir' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>
              <Radio size={16} /> IR
            </button>
            <button onClick={() => setActiveView('buttons')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeView === 'buttons' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>
              <CircleDot size={16} /> Buttons
            </button>
            <button onClick={() => setActiveView('faders')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeView === 'faders' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>
              <Sliders size={16} /> Fader
            </button>
            <button onClick={() => setActiveView('keypad')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeView === 'keypad' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>
              <Grid3X3 size={16} /> Keypad
            </button>
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
                if (activeView === 'ir') addMapping();
                if (activeView === 'buttons') addButton();
                if (activeView === 'faders') addFader();
                if (activeView === 'keypad') addKeypad();
              }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium">
              <Plus size={18} /> Hinzufügen
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {activeView === 'ir' && mappings.map(m => (
              <MappingRow key={m.id} mapping={m} isLearning={learningId === m.id} onLearn={toggleLearning} onChange={updateMapping} onDelete={deleteMapping} />
            ))}
            {activeView === 'buttons' && buttons.map(b => (
              <ButtonRow key={b.id} mapping={b} onChange={updateButton} onDelete={deleteButton} />
            ))}
            {activeView === 'faders' && faders.map(f => (
              <FaderRow key={f.id} mapping={f} onChange={updateFader} onDelete={deleteFader} />
            ))}
            {activeView === 'keypad' && keypads.map(k => (
              <KeypadRow key={k.id} mapping={k} onChange={updateKeypad} onDelete={deleteKeypad} />
            ))}
          </div>

          {/* Right Panel */}
          <div className="w-[500px] border-l border-gray-800 bg-gray-900 flex flex-col">
            <div className="flex border-b border-gray-800">
              <button onClick={() => setActiveRightTab('code')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeRightTab === 'code' ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50' : 'text-gray-500 hover:text-gray-300'}`}>
                <Code2 size={16} /> Arduino
              </button>
              <button onClick={() => setActiveRightTab('xml')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeRightTab === 'xml' ? 'text-orange-400 border-b-2 border-orange-400 bg-gray-800/50' : 'text-gray-500 hover:text-gray-300'}`}>
                <FileCode size={16} /> VirtualDJ
              </button>
              <button onClick={() => setActiveRightTab('assistant')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeRightTab === 'assistant' ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-800/50' : 'text-gray-500 hover:text-gray-300'}`}>
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
                   {/* Instruction Box for VirtualDJ */}
                   {activeRightTab === 'xml' && (
                     <div className="m-4 p-3 bg-blue-900/20 border border-blue-800 rounded text-[11px] text-blue-200 space-y-2">
                       <div className="flex items-center gap-2 font-bold text-blue-400">
                         <Info size={14} /> VDJ Installation Guide
                       </div>
                       <p>Kopiere die heruntergeladene XML-Datei in diesen Ordner:</p>
                       <div className="font-mono bg-black/40 p-2 rounded select-all break-all">
                         Windows: Documents\VirtualDJ\Mappers<br/>
                         macOS: Documents/VirtualDJ/Mappers
                       </div>
                       <p>Wähle danach den Controller in den VirtualDJ-Einstellungen aus.</p>
                     </div>
                   )}

                   <div className="flex-1 overflow-auto p-4 bg-[#1e1e1e] scrollbar-thin">
                    <pre className="text-xs font-mono text-gray-300 leading-relaxed whitespace-pre font-ligatures">
                      {activeRightTab === 'xml' ? generatedXml : generatedCode}
                    </pre>
                   </div>
                   <div className="p-4 border-t border-gray-800 bg-gray-900 flex gap-2">
                     <button onClick={copyToClipboard} className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white py-2 rounded text-sm transition-colors">
                       <Copy size={16} /> Kopieren
                     </button>
                     <button onClick={downloadFile} className={`flex-1 flex items-center justify-center gap-2 text-white py-2 rounded text-sm transition-colors ${activeRightTab === 'xml' ? 'bg-orange-700 hover:bg-orange-600' : 'bg-green-700 hover:bg-green-600'}`}>
                       <Download size={16} /> {activeRightTab === 'xml' ? '.xml Download' : '.ino Download'}
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