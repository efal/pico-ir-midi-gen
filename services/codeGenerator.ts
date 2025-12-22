import { Mapping, ButtonMapping, FaderMapping, KeypadMapping, EncoderMapping, MidiType, IrProtocol, GeneratorConfig } from '../types';

export const generateArduinoCode = (
  irMappings: Mapping[], 
  buttons: ButtonMapping[], 
  faders: FaderMapping[], 
  keypads: KeypadMapping[],
  config: GeneratorConfig,
  encoders: EncoderMapping[] = []
): string => {
  const timestamp = new Date().toLocaleString('de-DE');

  // Utility to ensure hex format
  const formatHex = (hex: string) => {
    const clean = hex.trim();
    if (!clean) return null;
    return clean.startsWith('0x') || clean.startsWith('0X') ? clean : `0x${clean}`;
  };

  // --- Header Documentation Generation ---
  let headerDoc = `/*\n * ==========================================================================\n`;
  headerDoc += ` * PROJECT: ${config.controllerName}\n`;
  headerDoc += ` * GENERATED: ${timestamp}\n`;
  headerDoc += ` * PLATFORM: Raspberry Pi Pico (RP2040)\n`;
  headerDoc += ` * ==========================================================================\n *\n`;
  
  headerDoc += ` * REQUIRED LIBRARIES:\n`;
  headerDoc += ` * - Control Surface (https://github.com/tttapa/Control-Surface)\n`;
  headerDoc += ` * - IRremote (https://github.com/Arduino-IRremote/Arduino-IRremote)\n`;
  if (config.display.enabled) {
    headerDoc += ` * - U8g2 (https://github.com/olikraus/u8g2)\n`;
  }
  headerDoc += ` *\n * --------------------------------------------------------------------------\n`;
  headerDoc += ` * HARDWARE SETUP & WIRING:\n * --------------------------------------------------------------------------\n`;
  headerDoc += ` * [IR RECEIVER]\n`;
  headerDoc += ` * - DATA PIN: GPIO ${config.irPin}\n`;
  headerDoc += ` * - FEEDBACK LED: ${config.useLedFeedback ? 'Enabled (Built-in LED)' : 'Disabled'}\n\n`;

  if (config.display.enabled) {
    headerDoc += ` * [OLED DISPLAY (SH1106)]\n`;
    headerDoc += ` * - I2C SDA: GPIO ${config.display.sdaPin}\n`;
    headerDoc += ` * - I2C SCL: GPIO ${config.display.sclPin}\n`;
    headerDoc += ` * - ADDRESS: ${config.display.i2cAddress}\n`;
    headerDoc += ` * - MODE: ${config.display.deckMode ? 'Split Deck Mode (D1/D2)' : 'Standard Status Mode'}\n\n`;
  }

  if (buttons.length > 0) {
    headerDoc += ` * [BUTTONS]\n`;
    buttons.forEach(b => {
      headerDoc += ` * - ${b.name}: GPIO ${b.pin} -> MIDI ${b.midiType} ${b.data1} (Ch ${b.channel})\n`;
    });
    headerDoc += `\n`;
  }

  if (encoders.length > 0) {
    headerDoc += ` * [ROTARY ENCODERS]\n`;
    encoders.forEach(e => {
      headerDoc += ` * - ${e.name}: Pins ${e.pinA}/${e.pinB} -> CC ${e.ccNumber} (Ch ${e.channel})\n`;
      if (e.pinButton !== undefined) {
        headerDoc += ` *   - Switch: GPIO ${e.pinButton} -> MIDI ${e.buttonMidiType || 'Note'} ${e.buttonData1 || 60}\n`;
      }
    });
    headerDoc += `\n`;
  }

  if (faders.length > 0) {
    headerDoc += ` * [ANALOG FADERS / POTS]\n`;
    faders.forEach(f => {
      headerDoc += ` * - ${f.name}: ADC GPIO ${f.pin} -> CC ${f.ccNumber} (Ch ${f.channel})\n`;
    });
    headerDoc += `\n`;
  }

  if (keypads.length > 0) {
    headerDoc += ` * [KEYPAD MATRICES]\n`;
    keypads.forEach(k => {
      headerDoc += ` * - ${k.name}: Rows [${k.rowPins.join(',')}] Cols [${k.colPins.join(',')}]\n`;
    });
    headerDoc += `\n`;
  }

  headerDoc += ` * ==========================================================================\n */`;

  // --- Encoder Definitions ---
  const encoderDefinitions = encoders.map(e => {
    const safeName = e.name.replace(/\s+/g, '_') || `encoder_${e.id}`;
    let def = `CCRotaryEncoder ${safeName} { {${e.pinA}, ${e.pinB}}, {${e.ccNumber}, Channel_${e.channel}}, ${Math.round(e.multiplier * 4)} };`;
    
    if (e.pinButton !== undefined && e.pinButton !== null) {
      const btnName = `${safeName}_btn`;
      const btnMidiType = e.buttonMidiType || MidiType.NOTE_ON;
      const btnData = e.buttonData1 ?? 60;
      if (btnMidiType === MidiType.CC) {
        def += `\nCCButton ${btnName} {${e.pinButton}, {${btnData}, Channel_${e.channel}}};`;
      } else {
        def += `\nNoteButton ${btnName} {${e.pinButton}, {${btnData}, Channel_${e.channel}}};`;
      }
    }
    return def;
  }).join('\n');

  // --- Button Definitions ---
  const buttonDefinitions = buttons.map(b => {
    const safeName = b.name.replace(/\s+/g, '_') || `btn_${b.id}`;
    if (b.midiType === MidiType.CC) {
      return `CCButton ${safeName} {${b.pin}, {${b.data1}, Channel_${b.channel}}};`;
    } else {
      return `NoteButton ${safeName} {${b.pin}, {${b.data1}, Channel_${b.channel}}};`;
    }
  }).join('\n');

  // --- Fader Definitions ---
  const faderDefinitions = faders.map(f => {
    const safeName = f.name.replace(/\s+/g, '_') || `pot_${f.id}`;
    return `CCPotentiometer ${safeName} {${f.pin}, {${f.ccNumber}, Channel_${f.channel}}};`;
  }).join('\n');

  // --- Keypad Definitions ---
  const keypadDefinitions = keypads.map(k => {
    const safeName = k.name.replace(/\s+/g, '_') || `keypad_${k.id}`;
    const rowPinsStr = k.rowPins.join(', ');
    const colPinsStr = k.colPins.join(', ');
    const addressMatrixStr = k.values.map(row => `    { ${row.join(', ')} }`).join(',\n');
    const className = k.mode === MidiType.CC ? 'CCButtonMatrix' : 'NoteButtonMatrix';
    return `
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

  // --- IR Logic ---
  const irLogic = irMappings
    .filter(m => formatHex(m.irCode) !== null)
    .map(m => {
      const hexCode = formatHex(m.irCode);
      let action = '';
      const vdjDesc = m.vdjAction ? m.vdjAction : (m.midiType === MidiType.CC ? `CC ${m.data1}` : `Note ${m.data1}`);
      
      switch (m.midiType) {
        case MidiType.NOTE_ON: 
          action = `midi.sendNoteOn({${m.data1}, Channel_${m.channel}}, ${m.data2}); updateDisplay(${m.channel}, "${vdjDesc}");`; 
          break;
        case MidiType.CC: 
          action = `midi.sendControlChange({${m.data1}, Channel_${m.channel}}, ${m.data2}); updateDisplay(${m.channel}, "${vdjDesc}");`; 
          break;
        case MidiType.PROGRAM_CHANGE:
          action = `midi.sendProgramChange({Channel_${m.channel}}, ${m.data1}); updateDisplay(${m.channel}, "PC ${m.data1}");`;
          break;
      }
      return `    if (IrReceiver.decodedIRData.protocol == decode_type_t::${m.irProtocol} && IrReceiver.decodedIRData.command == ${hexCode}) {
        ${action}
        return;
    }`;
    }).join('\n');

  const displaySetup = config.display.enabled ? `
#include <U8g2lib.h>
#include <Wire.h>
U8G2_SH1106_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, /* reset=*/ U8X8_PIN_NONE, /* clock=*/ ${config.display.sclPin}, /* data=*/ ${config.display.sdaPin});

char deck1Msg[20] = "---";
char deck2Msg[20] = "---";

void updateDisplay(int channel, const char* msg) {
  if (${config.display.deckMode}) {
    if (channel == 1) strncpy(deck1Msg, msg, 19);
    else if (channel == 2) strncpy(deck2Msg, msg, 19);
    
    u8g2.clearBuffer();
    // Layout Deck 1
    u8g2.setFont(u8g2_font_ncenB08_tr);
    u8g2.drawStr(0, 10, "DECK 1");
    u8g2.setFont(u8g2_font_6x10_tf);
    u8g2.drawStr(0, 24, deck1Msg);
    
    // Divider
    u8g2.drawHLine(0, 31, 128);
    
    // Layout Deck 2
    u8g2.setFont(u8g2_font_ncenB08_tr);
    u8g2.drawStr(0, 45, "DECK 2");
    u8g2.setFont(u8g2_font_6x10_tf);
    u8g2.drawStr(0, 59, deck2Msg);
    
    u8g2.sendBuffer();
  } else {
    u8g2.clearBuffer();
    u8g2.setFont(u8g2_font_ncenB08_tr);
    u8g2.drawStr(0, 10, "MIDI STATUS");
    u8g2.drawHLine(0, 12, 128);
    u8g2.setFont(u8g2_font_6x10_tf);
    u8g2.drawStr(0, 30, msg);
    char chBuf[16];
    sprintf(chBuf, "Channel: %d", channel);
    u8g2.drawStr(0, 45, chBuf);
    u8g2.sendBuffer();
  }
}
` : 'void updateDisplay(int ch, const char* m) {}';

  return `${headerDoc}

#include <Arduino.h>

// 1. Configure IR Protocols
#define DECODE_NEC
#define DECODE_SONY
#define DECODE_RC5
#define DECODE_RC6
#define DECODE_SAMSUNG
#include <IRremote.hpp>

// 2. Control Surface Setup
#include <Control_Surface.h>

${displaySetup}

USBMIDI_Interface midi;

// --- Encoders ---
${encoderDefinitions}

// --- Buttons ---
${buttonDefinitions}

// --- Faders ---
${faderDefinitions}

// --- Keypads ---
${keypadDefinitions}

void setup() {
  Serial.begin(115200);
  
  // Initialize I2C for Display
  Wire.setSDA(${config.display.sdaPin});
  Wire.setSCL(${config.display.sclPin});
  Wire.begin();
  
  if (${config.display.enabled}) {
    u8g2.begin();
    if (${config.display.inverted}) u8g2.setContrast(0);
    updateDisplay(1, "Ready");
    updateDisplay(2, "Ready");
  }

  Control_Surface.begin();
  IrReceiver.begin(${config.irPin}, ${config.useLedFeedback ? 'ENABLE_LED_FEEDBACK' : 'DISABLE_LED_FEEDBACK'});
  
  Serial.println(F("MIDI Controller Ready"));
}

void loop() {
  Control_Surface.loop();

  if (IrReceiver.decode()) {
    if (!(IrReceiver.decodedIRData.flags & IRDATA_FLAGS_IS_REPEAT)) {
      // Print to Serial for web-learning
      Serial.print("Protocol: ");
      Serial.print(getProtocolString(IrReceiver.decodedIRData.protocol));
      Serial.print(" Code: 0x");
      Serial.println(IrReceiver.decodedIRData.command, HEX);
      
      ${irLogic}
    }
    IrReceiver.resume();
  }
}
`;
};