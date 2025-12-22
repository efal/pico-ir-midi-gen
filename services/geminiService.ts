import { GoogleGenAI } from "@google/genai";

const getGenAI = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("Failed to initialize GoogleGenAI", e);
    return null;
  }
};

export const askGemini = async (prompt: string, contextCode: string): Promise<string> => {
  const genAI = getGenAI();
  if (!genAI) {
    return "AI Assistent ist nicht konfiguriert (API Key fehlt).";
  }
  try {
    const fullPrompt = `
      Du bist ein Experte für Arduino, C++ und MIDI.
      
      Der Benutzer arbeitet an einem Projekt für einen RP2040 (Raspberry Pi Pico) MIDI-Controller, 
      der Infrarot-Signale (IR) in USB-MIDI-Befehle umwandelt.
      Er nutzt die Bibliotheken "Control Surface" und "IRremote".

      Hier ist der aktuell generierte Code Kontext:
      \`\`\`cpp
      ${contextCode}
      \`\`\`

      Frage des Benutzers: "${prompt}"

      Bitte antworte kurz, präzise und hilfreich auf Deutsch. Wenn Code-Änderungen nötig sind, erkläre sie.
    `;

    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    });

    return response.text || "Entschuldigung, ich konnte keine Antwort generieren.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Fehler bei der Kommunikation mit der AI. Bitte überprüfe deinen API Key.";
  }
};