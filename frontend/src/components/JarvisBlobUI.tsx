import React, { useState, useEffect, useRef } from 'react';
import { JarvisBlobCanvas } from './JarvisBlobCanvas';
import { JarvisVoiceController, type AssistantState } from '../utils/JarvisVoiceController';
export interface JarvisBlobUIProps {
  settings?: {
    showBlob: boolean;
    hoverEnabled: boolean;
    equalizerEnabled: boolean;
  };
}

export const JarvisBlobUI: React.FC<JarvisBlobUIProps> = ({ settings }) => {
  const [state, setState] = useState<AssistantState>('IDLE');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<string>(
    'Hello, sir. I am JARVIS. Click the microphone or select a prompt below to interact.'
  );
  const [inputText, setInputText] = useState<string>('');

  const controllerRef = useRef<JarvisVoiceController | null>(null);

  useEffect(() => {
    const controller = new JarvisVoiceController({
      onStateChange: (newState) => setState(newState),
      onTranscript: (text) => setTranscript(text),
      onResponse: (resp) => setLastResponse(resp),
      onAudioLevel: (lvl) => setAudioLevel(lvl),
    });

    controllerRef.current = controller;

    return () => {
      controller.stopSpeaking();
      controller.stopListening();
    };
  }, []);

  const handleMicToggle = () => {
    if (!controllerRef.current) return;
    if (state === 'LISTENING') {
      controllerRef.current.stopListening();
    } else {
      controllerRef.current.startListening();
    }
  };

  const handlePresetQuery = (query: string) => {
    if (!controllerRef.current) return;
    setTranscript(query);
    controllerRef.current.processUserQuery(query);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !controllerRef.current) return;
    const text = inputText.trim();
    setInputText('');
    setTranscript(text);
    controllerRef.current.processUserQuery(text);
  };

  const getStateBadgeClass = () => {
    switch (state) {
      case 'LISTENING':
        return 'badge-listening';
      case 'SPEAKING':
        return 'badge-speaking';
      case 'THINKING':
        return 'badge-thinking';
      default:
        return 'badge-idle';
    }
  };

  return (
    <div
      className={`jarvis-container ${settings?.hoverEnabled !== false ? '' : 'disable-hover'}`}
      style={{ cursor: 'pointer' }}
      onClick={handleMicToggle}
      title={state === 'LISTENING' ? 'Stop Listening' : 'Click to Speak'}
    >
      {/* Center Blob Container with Circular Background Sampling */}
      <main className="jarvis-blob-wrapper" style={{ height: '100%', position: 'relative' }}>
        {/* State Badge Overlay */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 20 }} onClick={(e) => e.stopPropagation()}>
          <div className={`status-badge ${getStateBadgeClass()}`}>
            <span className="pulse-indicator" />
            {state}
          </div>
        </div>

        {settings?.showBlob !== false && (
          <JarvisBlobCanvas state={state} audioLevel={audioLevel} />
        )}
        {/* Dynamic Spectrum Wave Equalizer overlay */}
        {settings?.equalizerEnabled !== false && (
          <div className="spectrum-bar-container">
            {[0.4, 0.7, 1.0, 0.6, 0.8, 0.5, 0.9, 0.7, 0.4].map((multiplier, idx) => {
              const isVoiceActive = state === 'LISTENING' || state === 'SPEAKING';
              const effectiveLevel = isVoiceActive ? Math.max(audioLevel, 0.1) : audioLevel;
              const wave = Math.sin(idx * 0.8 + Date.now() * 0.008) * (isVoiceActive ? 4 : 1);
              const barHeight = Math.max(4, effectiveLevel * 10 * multiplier + 4 + wave);
              return (
                <div
                  key={idx}
                  className="spectrum-bar"
                  style={{
                    height: `${barHeight}px`,
                    opacity: state === 'IDLE' ? 0.35 : 0.95,
                  }}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Interactive Controls (Mic Button, Text Input, Dialogue Display) */}
      <section className="jarvis-controls-section" onClick={(e) => e.stopPropagation()}>
        <div className="controls-bar">
          <button
            className={`mic-button ${state === 'LISTENING' ? 'active' : ''}`}
            onClick={handleMicToggle}
            title={state === 'LISTENING' ? 'Stop Listening' : 'Start Listening'}
          >
            🎤
          </button>

          <form className="input-form" onSubmit={handleTextSubmit}>
            <input
              type="text"
              className="text-input"
              placeholder="Ask Jarvis anything..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="send-button">Send</button>
          </form>
        </div>
      </section>

    </div>
  );
};
