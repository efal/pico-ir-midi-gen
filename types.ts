export enum MidiType {
  NOTE_ON = 'Note On',
  NOTE_OFF = 'Note Off',
  CC = 'Control Change',
  PROGRAM_CHANGE = 'Program Change'
}

export interface Mapping {
  id: string;
  irCode: string; // Hex code, e.g., 0xFFA25D
  midiType: MidiType;
  channel: number; // 1-16
  data1: number; // Note Number or CC Number
  data2: number; // Velocity or CC Value (ignored for PC)
  description?: string;
  vdjAction?: string; // VirtualDJ Script Action
}

export interface ButtonMapping {
  id: string;
  name: string;
  pin: number;
  midiType: MidiType.NOTE_ON | MidiType.CC; // Only Note or CC for buttons usually
  channel: number;
  data1: number; // Note Number or CC Number
  vdjAction?: string;
}

export interface FaderMapping {
  id: string;
  name: string;
  pin: number; // Analog pin (GPIO number on RP2040)
  channel: number;
  ccNumber: number;
  vdjAction?: string;
}

export interface KeypadMapping {
  id: string;
  name: string;
  mode: MidiType.NOTE_ON | MidiType.CC; // Whole matrix uses one mode
  channel: number;
  rowPins: [number, number, number, number];
  colPins: [number, number, number, number];
  values: number[][]; // 4x4 matrix of Note numbers or CC numbers
}

export interface GeneratorConfig {
  irPin: number;
  useLedFeedback: boolean;
  controllerName: string;
}