import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, Volume2, Settings, Smartphone, Terminal, Globe } from 'lucide-react';

interface SettingsViewProps {
  voiceName: string;
  setVoiceName: (val: string) => void;
  speechSpeed: number;
  setSpeechSpeed: (val: number) => void;
  voiceTone: string;
  setVoiceTone: (val: string) => void;
  voiceAccent: string;
  setVoiceAccent: (val: string) => void;
  micSensitivity: number;
  setMicSensitivity: (val: number) => void;
  isWakeWordEnabled: boolean;
  setIsWakeWordEnabled: (val: boolean) => void;
  ttsEngine: 'gemini' | 'web_speech';
  setTtsEngine: (val: 'gemini' | 'web_speech') => void;
  voicePitch: number;
  setVoicePitch: (val: number) => void;
  isTermuxEnabled: boolean;
  setIsTermuxEnabled: (val: boolean) => void;
  termuxUrl: string;
  setTermuxUrl: (val: string) => void;
}

export default function SettingsView({
  voiceName,
  setVoiceName,
  speechSpeed,
  setSpeechSpeed,
  voiceTone,
  setVoiceTone,
  voiceAccent,
  setVoiceAccent,
  micSensitivity,
  setMicSensitivity,
  isWakeWordEnabled,
  setIsWakeWordEnabled,
  ttsEngine,
  setTtsEngine,
  voicePitch,
  setVoicePitch,
  isTermuxEnabled,
  setIsTermuxEnabled,
  termuxUrl,
  setTermuxUrl
}: SettingsViewProps) {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (ttsEngine === 'web_speech' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Filter to only show English voices to avoid clutter
        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        setAvailableVoices(englishVoices.length > 0 ? englishVoices : voices);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [ttsEngine]);

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 p-8 overflow-y-auto scrollbar-hide">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Settings className="w-6 h-6 text-[#ff4e00]" />
          </div>
          <div>
            <h2 className="text-2xl font-light serif">Aura Settings</h2>
            <p className="text-white/40 text-sm">Configure your experience and preferences.</p>
          </div>
        </div>

        <div className="space-y-6 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <Volume2 className="w-5 h-5 text-[#ff4e00]" />
            <h3 className="text-lg font-medium">Voice Preferences</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-xs text-white/60 uppercase tracking-wider">TTS Engine</label>
              <select 
                value={ttsEngine} 
                onChange={(e) => setTtsEngine(e.target.value as 'gemini' | 'web_speech')}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#ff4e00] outline-none transition-all"
              >
                <option value="gemini">Google Gemini (High Quality, Cloud)</option>
                <option value="web_speech">Local Browser / Open Source (Fast, Offline)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/60 uppercase tracking-wider">Preferred Voice</label>
              <select 
                value={voiceName} 
                onChange={(e) => setVoiceName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#ff4e00] outline-none transition-all"
              >
                {ttsEngine === 'gemini' ? (
                  <>
                    <option value="Aoede">Aoede (Warm)</option>
                    <option value="Kore">Kore (Mysterious)</option>
                    <option value="Zephyr">Zephyr (Calm)</option>
                    <option value="Fenrir">Fenrir (Deep)</option>
                    <option value="Puck">Puck (Playful)</option>
                    <option value="Charon">Charon (Serious)</option>
                  </>
                ) : (
                  availableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.name}>{v.name} ({v.lang})</option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/60 uppercase tracking-wider">Tone (Custom Vibe)</label>
              <input 
                type="text"
                value={voiceTone} 
                onChange={(e) => setVoiceTone(e.target.value)}
                placeholder="e.g., girly but laid back, sarcastic, sexy"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#ff4e00] outline-none transition-all"
                disabled={ttsEngine === 'web_speech'}
                style={{ opacity: ttsEngine === 'web_speech' ? 0.5 : 1 }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/60 uppercase tracking-wider">Accent</label>
              <select 
                value={voiceAccent} 
                onChange={(e) => setVoiceAccent(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#ff4e00] outline-none transition-all"
                disabled={ttsEngine === 'web_speech'}
                style={{ opacity: ttsEngine === 'web_speech' ? 0.5 : 1 }}
              >
                <option value="American">American</option>
                <option value="British">British</option>
                <option value="Australian">Australian</option>
                <option value="Southern US">Southern US</option>
                <option value="New York">New York</option>
                <option value="Irish">Irish</option>
                <option value="Scottish">Scottish</option>
                <option value="French">French</option>
                <option value="Spanish">Spanish</option>
                <option value="Italian">Italian</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs text-white/60 uppercase tracking-wider">Speech Speed</label>
                <span className="text-xs font-mono text-[#ff4e00]">{speechSpeed}x</span>
              </div>
              <div className="pt-2">
                <input 
                  type="range" min="0.5" max="2.0" step="0.05" 
                  value={speechSpeed} 
                  onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                  className="w-full accent-[#ff4e00] h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs text-white/60 uppercase tracking-wider">Voice Pitch</label>
                <span className="text-xs font-mono text-[#ff4e00]">{voicePitch}x</span>
              </div>
              <div className="pt-2">
                <input 
                  type="range" min="0.0" max="2.0" step="0.1" 
                  value={voicePitch} 
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  className="w-full accent-[#ff4e00] h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                  disabled={ttsEngine === 'gemini'}
                  style={{ opacity: ttsEngine === 'gemini' ? 0.5 : 1 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <Mic className="w-5 h-5 text-[#ff4e00]" />
            <h3 className="text-lg font-medium">Wake Word & Audio</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-xl">
              <div>
                <label className="text-sm font-medium text-white">Enable Wake Word ("Hey Aura")</label>
                <p className="text-xs text-white/40 mt-1">Allow Aura to listen for her name in the background.</p>
              </div>
              <button
                onClick={() => setIsWakeWordEnabled(!isWakeWordEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isWakeWordEnabled ? 'bg-[#ff4e00]' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isWakeWordEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {isWakeWordEnabled && (
              <div className="space-y-2 pt-4 border-t border-white/10">
                <div className="flex justify-between">
                  <label className="text-xs text-white/60 uppercase tracking-wider">Wake Word Sensitivity</label>
                  <span className="text-xs font-mono text-[#ff4e00]">{Math.round(micSensitivity * 100)}%</span>
                </div>
                <p className="text-[10px] text-white/40 mb-2">Adjust how easily Aura responds to her name. Higher sensitivity means she might trigger more often.</p>
                <div className="pt-2">
                  <input 
                    type="range" min="0.1" max="3.0" step="0.1" 
                    value={micSensitivity} 
                    onChange={(e) => setMicSensitivity(parseFloat(e.target.value))}
                    className="w-full accent-[#ff4e00] h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="w-5 h-5 text-[#ff4e00]" />
            <h3 className="text-lg font-medium">Termux Bridge (EchoCore Link)</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-xl">
              <div>
                <label className="text-sm font-medium text-white">Enable Termux Bridge</label>
                <p className="text-xs text-white/40 mt-1">Allow Aura to control your Android device via Termux:API.</p>
              </div>
              <button
                onClick={() => setIsTermuxEnabled(!isTermuxEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isTermuxEnabled ? 'bg-[#ff4e00]' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isTermuxEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {isTermuxEnabled && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-4 border-t border-white/10"
              >
                <div className="space-y-2">
                  <label className="text-xs text-white/60 uppercase tracking-wider">Bridge URL</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="text"
                      value={termuxUrl} 
                      onChange={(e) => setTermuxUrl(e.target.value)}
                      placeholder="http://127.0.0.1:8080"
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-[#ff4e00] outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-white/40">Ensure you are running the EchoCore Bridge script in Termux on this device.</p>
                </div>
                <button
                  onClick={() => {
                    const scriptContent = `const http = require('http');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'POST' && req.url === '/execute') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      const { command, args } = JSON.parse(body);
      exec(\`\${command} \${args.join(' ')}\`, (error, stdout, stderr) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ output: stdout || stderr, error: error?.message }));
      });
    });
  }
});

server.listen(8080, '0.0.0.0', () => console.log('EchoCore Bridge Active on 8080'));`;
                    const blob = new Blob([scriptContent], { type: 'text/javascript' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'bridge.js';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Terminal className="w-4 h-4" />
                  Download bridge.js Script
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
