import { Mapping, ButtonMapping, FaderMapping, KeypadMapping, MidiType, GeneratorConfig } from '../types';

export const generateVdjXml = (
  irMappings: Mapping[], 
  buttons: ButtonMapping[], 
  faders: FaderMapping[], 
  keypads: KeypadMapping[],
  config: GeneratorConfig
): string => {
  
  const toHex = (num: number) => num.toString(16).toUpperCase().padStart(2, '0');

  const getStatusByte = (type: MidiType, channel: number): string => {
    // Channel is 1-16, MIDI status expects 0-15
    const ch = channel - 1;
    let base = 0x90; // Default Note On

    switch (type) {
      case MidiType.NOTE_ON: base = 0x90; break;
      case MidiType.NOTE_OFF: base = 0x80; break;
      case MidiType.CC: base = 0xB0; break;
      case MidiType.PROGRAM_CHANGE: base = 0xC0; break;
    }
    
    return toHex(base + ch);
  };

  const generateLine = (name: string, type: MidiType, channel: number, data1: number, action?: string) => {
    const status = getStatusByte(type, channel);
    const data = toHex(data1);
    const midiKey = `${status} ${data}`;
    const script = action && action.trim() !== '' ? action : `/* ${name} */`;
    
    return `    <map value="${midiKey}" action="${script}" />`;
  };

  let xmlLines: string[] = [];

  // IR Mappings
  if (irMappings.length > 0) {
    xmlLines.push(`    <!-- IR Remote Mappings -->`);
    irMappings.forEach(m => {
      xmlLines.push(generateLine(`IR ${m.irCode}`, m.midiType, m.channel, m.data1, m.vdjAction));
    });
  }

  // Buttons
  if (buttons.length > 0) {
    xmlLines.push(`    <!-- Hardware Buttons -->`);
    buttons.forEach(b => {
      xmlLines.push(generateLine(b.name, b.midiType, b.channel, b.data1, b.vdjAction));
    });
  }

  // Faders
  if (faders.length > 0) {
    xmlLines.push(`    <!-- Hardware Faders -->`);
    faders.forEach(f => {
      xmlLines.push(generateLine(f.name, MidiType.CC, f.channel, f.ccNumber, f.vdjAction));
    });
  }

  // Keypads
  if (keypads.length > 0) {
    keypads.forEach(k => {
      xmlLines.push(`    <!-- Keypad: ${k.name} -->`);
      k.values.forEach((row, rIdx) => {
        row.forEach((val, cIdx) => {
          xmlLines.push(generateLine(`${k.name} (${rIdx+1},${cIdx+1})`, k.mode, k.channel, val, ''));
        });
      });
    });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<mapper device="${config.controllerName}" author="GeneratedByTool" version="1.0">
  <info>
    <name>${config.controllerName}</name>
    <description>Custom Mapping for RP2040 Controller</description>
  </info>
  
${xmlLines.join('\n')}

</mapper>`;
};