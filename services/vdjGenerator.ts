import { Mapping, ButtonMapping, FaderMapping, KeypadMapping, EncoderMapping, MidiType, GeneratorConfig } from '../types';

export const generateVdjXml = (
  irMappings: Mapping[], 
  buttons: ButtonMapping[], 
  faders: FaderMapping[], 
  keypads: KeypadMapping[],
  config: GeneratorConfig,
  encoders: EncoderMapping[] = []
): string => {
  const toHex = (num: number) => num.toString(16).toUpperCase().padStart(2, '0');
  const getStatusByte = (type: MidiType, channel: number): string => {
    const ch = channel - 1;
    let base = 0x90; 
    if (type === MidiType.CC) base = 0xB0;
    return toHex(base + ch);
  };

  let xmlLines: string[] = [];

  // Encoders
  if (encoders.length > 0) {
    xmlLines.push(`    <!-- Rotary Encoders -->`);
    encoders.forEach(e => {
      // Rotation mapping
      const rotStatus = getStatusByte(MidiType.CC, e.channel);
      const rotData = toHex(e.ccNumber);
      xmlLines.push(`    <map value="${rotStatus} ${rotData}" action="${e.vdjActionRotate || 'browser_scroll'}" />`);
      
      // Button mapping if pin is configured
      if (e.pinButton !== undefined && e.pinButton !== null) {
        const btnMidiType = e.buttonMidiType || MidiType.NOTE_ON;
        const btnData = e.buttonData1 ?? 60;
        const btnStatus = getStatusByte(btnMidiType, e.channel);
        xmlLines.push(`    <map value="${btnStatus} ${toHex(btnData)}" action="${e.vdjActionClick || 'browser_enter'}" />`);
      }
    });
  }

  // IR Mappings
  if (irMappings.length > 0) {
    xmlLines.push(`    <!-- IR Remote Mappings -->`);
    irMappings.forEach(m => {
      const status = getStatusByte(m.midiType, m.channel);
      xmlLines.push(`    <map value="${status} ${toHex(m.data1)}" action="${m.vdjAction || ''}" />`);
    });
  }

  // Buttons
  if (buttons.length > 0) {
    xmlLines.push(`    <!-- Physical Buttons -->`);
    buttons.forEach(b => {
      const status = getStatusByte(b.midiType, b.channel);
      xmlLines.push(`    <map value="${status} ${toHex(b.data1)}" action="${b.vdjAction || ''}" />`);
    });
  }

  // Faders
  if (faders.length > 0) {
    xmlLines.push(`    <!-- Faders & Pots -->`);
    faders.forEach(f => {
      const status = getStatusByte(MidiType.CC, f.channel);
      xmlLines.push(`    <map value="${status} ${toHex(f.ccNumber)}" action="${f.vdjAction || ''}" />`);
    });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<mapper device="${config.controllerName}" author="GeneratedByTool" version="1.0">
  <info><name>${config.controllerName}</name></info>
  <mapping>
${xmlLines.join('\n')}
  </mapping>
</mapper>`;
};