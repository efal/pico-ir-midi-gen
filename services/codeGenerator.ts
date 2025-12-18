import { Mapping, ButtonMapping, FaderMapping, KeypadMapping, MidiType, GeneratorConfig } from '../types';

export const generateArduinoCode = (
  irMappings: Mapping[], 
  buttons: ButtonMapping[], 
  faders: FaderMapping[], 
  keypads: KeypadMapping[],
  config: GeneratorConfig
): string => {
  const timestamp = new Date().toLocaleString('de-DE');

  // --- IR Logic ---
  const cleanHex = (hex: string) => {
    hex = hex.trim();
    if (!hex.startsWith('0x') && !hex.startsWith('0X')) {
      return `0x${hex}`;
    }
    return hex;
  };

  const irCases = irMappings.map(m => {
    const code = cleanHex(m.irCode);
    let action = '';

    switch (m.midiType) {
      case MidiType.NOTE_ON:
        action = `midi.sendNoteOn({${m.data1}, Channel_${m.channel}}, ${m.data2});`;
        break;
      case MidiType.NOTE_OFF:
        action = `midi.sendNoteOff({${m.data1}, Channel_${m.channel}}, ${m.data2});`;
        break;
      case MidiType.CC:
        action = `midi.sendControlChange({${m.data1}, Channel_${m.channel}}, ${m.data2});`;
        break;
      case MidiType.PROGRAM_CHANGE:
        action = `midi.sendProgramChange({Channel_${m.channel}}, ${m.data1});`;
        break;
    }

    return `
      case ${code}:
        // ${m.description || m.midiType}
        ${action}
        break;`;
  }).join('\n');

  // --- Button Logic ---
  const buttonDefinitions = buttons.map(b => {
    const safeName = b.name.replace(/\s+/g, '_') || `btn_${b.id}`;
    if (b.midiType === MidiType.CC) {
      return `CCButton ${safeName} {${b.pin}, {${b.data1}, Channel_${b.channel}}};`;
    } else {
      // Default to NoteButton
      return `NoteButton ${safeName} {${b.pin}, {${b.data1}, Channel_${b.channel}}};`;
    }
  }).join('\n');

  // --- Fader Logic ---
  const faderDefinitions = faders.map(f => {
    const safeName = f.name.replace(/\s+/g, '_') || `pot_${f.id}`;
    return `CCPotentiometer ${safeName} {${f.pin}, {${f.ccNumber}, Channel_${f.channel}}};`;
  }).join('\n');

  // --- Keypad Logic ---
  const keypadDefinitions = keypads.map(k => {
    const safeName = k.name.replace(/\s+/g, '_') || `keypad_${k.id}`;
    const rowPinsStr = k.rowPins.join(', ');
    const colPinsStr = k.colPins.join(', ');
    
    // Format 4x4 matrix values
    const addressMatrixStr = k.values.map(row => 
      `    { ${row.join(', ')} }`
    ).join(',\n');

    const className = k.mode === MidiType.CC ? 'CCButtonMatrix' : 'NoteButtonMatrix';

    return `
// Keypad: ${k.name}
const PinList<4> ${safeName}_rowPins = { ${rowPinsStr} };
const PinList<4> ${safeName}_colPins = { ${colPinsStr} };
const AddressMatrix<4, 4> ${safeName}_addresses = {{
${addressMatrixStr}
}};
${className}<4, 4> ${safeName} = {
  ${safeName}_rowPins,
  ${safeName}_colPins,
  ${safeName}_addresses,
  Channel_${k.channel}
};
`;
  }).join('\n');

  return `/*
 * Project: ${config.controllerName}
 * Generated on: ${timestamp}
 * Platform: RP2040 (Raspberry Pi Pico, etc.)
 * 
 * --- SETUP ANLEITUNG ---
 * 
 * 1. Board Core: Nutze "Raspberry Pi Pico/RP2040" von Earle F. Philhower.
 * 2. USB Stack: Gehe zu "Werkzeuge" > "USB Stack" und wähle "Adafruit TinyUSB".
 *    (Dies ist zwingend erforderlich, damit MIDI über USB funktioniert!)
 * 
 * --- HINWEISE ZU WARNUNGEN ---
 * 
 * - Warnung "Bibliothek Control Surface ... inkompatibel mit ... rp2040":
 *   Dies ist normal und kann ignoriert werden. Die Bibliothek funktioniert trotzdem.
 * 
 * - Warnung "INFO: For ESP32, RP2040 ... SEND_PWM_BY_TIMER":
 *   Dies ist eine Information der IRremote Library und kein Fehler.
 */

#include <Arduino.h>

// 1. Configure IR Remote
#define DECODE_NEC // Standard NEC Protocol
// IRremote must be included BEFORE Control Surface to avoid potential conflicts
#include <IRremote.hpp>

// 2. Clean up potential macro conflicts before including Control Surface
#ifdef STR
#undef STR
#endif

// 3. Include Control Surface
#include <Control_Surface.h>

// --- Configuration ---
const int IR_RECEIVE_PIN = ${config.irPin};

// Instantiate a MIDI over USB interface
USBMIDI_Interface midi;

// --- Hardware Controls ---
// Control Surface handles these automatically in the loop

// --- Buttons ---
${buttonDefinitions}

// --- Faders ---
${faderDefinitions}

// --- Keypads ---
${keypadDefinitions}

void setup() {
  // Initialize Serial for debugging (optional)
  Serial.begin(115200);
  
  // Initialize Control Surface
  midi.begin();

  // Initialize IR Receiver
  // Note: On RP2040, use the pin number directly (e.g., 15)
  IrReceiver.begin(IR_RECEIVE_PIN, ${config.useLedFeedback ? 'ENABLE_LED_FEEDBACK' : 'DISABLE_LED_FEEDBACK'});

  Serial.println(F("Ready to receive IR signals and handle Controls"));
}

void loop() {
  // Update Control Surface (handle incoming MIDI from Buttons/Pots/Keypads)
  midi.update();

  // Check for incoming IR data
  if (IrReceiver.decode()) {
    
    // Check if it is a repeat code (button held down)
    if (IrReceiver.decodedIRData.flags & IRDATA_FLAGS_IS_REPEAT) {
       IrReceiver.resume();
       return;
    }

    // Print received code to Serial Monitor (helpful for finding your codes)
    Serial.print("IR Code: 0x");
    Serial.println(IrReceiver.decodedIRData.command, HEX);

    // Map IR commands to MIDI
    switch (IrReceiver.decodedIRData.command) {
      ${irCases}
      
      default:
        // Unmapped code received
        // Serial.println(F("Unmapped code"));
        break;
    }

    // Prepare for next value
    IrReceiver.resume();
  }
}
`;
};