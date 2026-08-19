import { useState, useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import { JarvisBlobUI } from './components/JarvisBlobUI';
import { AboutPage } from './components/AboutPage';
import { JarvisPet } from './components/JarvisPet';
import { JarvisVoiceController, type AssistantState } from './utils/JarvisVoiceController';
import './App.css';

export interface JarvisSettings {
  showBlob: boolean;
  hoverEnabled: boolean;
  equalizerEnabled: boolean;
  showPet: boolean;
  companionMode: boolean;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'about'>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<JarvisSettings>({
    showBlob: true,
    hoverEnabled: true,
    equalizerEnabled: true,
    showPet: true,
    companionMode: false,
  });

  // Shared Jarvis Voice Assistant State
  const [assistantState, setAssistantState] = useState<AssistantState>('IDLE');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [response, setResponse] = useState<string>('');

  const controllerRef = useRef<JarvisVoiceController | null>(null);

  useEffect(() => {
    const controller = new JarvisVoiceController({
      onStateChange: (newState) => setAssistantState(newState),
      onTranscript: (text) => setTranscript(text),
      onResponse: (resp) => setResponse(resp),
      onAudioLevel: (lvl) => setAudioLevel(lvl),
    });

    controllerRef.current = controller;

    return () => {
      controller.stopSpeaking();
      controller.stopListening();
    };
  }, []);

  // Notify Electron of companion mode window state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.setCompanionMode(settings.companionMode);
    }
  }, [settings.companionMode]);

  const handleMicToggle = () => {
    if (!controllerRef.current) return;
    if (assistantState === 'LISTENING') {
      controllerRef.current.stopListening();
    } else {
      setTranscript('');
      setResponse('');
      controllerRef.current.startListening();
    }
  };

  const handleTextSubmit = (text: string) => {
    if (!text.trim() || !controllerRef.current) return;
    controllerRef.current.processUserQuery(text);
  };

  const toggleSettings = () => setShowSettings(!showSettings);

  const updateSetting = (key: keyof JarvisSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const electronAPI = typeof window !== 'undefined' ? (window as any).electronAPI : undefined;

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      <div className="spline-background" aria-hidden="true">
        <Spline scene="https://prod.spline.design/c5gTKTrA18MmwCWJ/scene.splinecode" />
      </div>

      {electronAPI && <div className="window-drag-region" aria-hidden="true" />}

      {electronAPI && (
        <div className="window-controls" aria-label="Window controls">
          <button type="button" onClick={electronAPI.minimizeWindow} title="Minimize" aria-label="Minimize">
            −
          </button>
          <button type="button" onClick={electronAPI.toggleMaximizeWindow} title="Maximize" aria-label="Maximize">
            □
          </button>
          <button type="button" className="window-close" onClick={electronAPI.closeWindow} title="Close" aria-label="Close">
            ×
          </button>
        </div>
      )}

      {currentPage === 'about' ? (
        <AboutPage onBack={() => setCurrentPage('home')} />
      ) : (
        <>
          {/* Top Left Header */}
          {!settings.companionMode && (
            <div
              className="jarvis-header-glass"
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage('about');
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -12;
                const rotateY = ((x - centerX) / centerX) * 12;
                e.currentTarget.style.transform = `perspective(550px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.07)`;
                const shinePos = (x / rect.width) * 300 - 150;
                e.currentTarget.style.setProperty('--shine-pos', `${shinePos}%`);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'perspective(500px) rotateX(0deg) rotateY(0deg) scale(1)';
              }}
              title="About JARVIS"
            >
              <h1 style={{ margin: 0, color: '#fff', fontSize: '24px', letterSpacing: '2px', fontWeight: 'bold', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>JARVIS</h1>
            </div>
          )}

          {/* Settings Button (Top Right of App) */}
          <div className="settings-wrapper">
            <button
              onClick={toggleSettings}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              title="Settings"
            >
              ⚙️
            </button>
            {showSettings && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '40px',
                  right: '0',
                  background: 'rgba(41, 41, 41, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  minWidth: '220px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
                  color: '#fff',
                  fontSize: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  backdropFilter: 'blur(10px)',
                  zIndex: 1000,
                }}
              >
                {/* Section: Animations */}
                <div>
                  <div style={{ fontWeight: 'bold', color: '#ffffffff', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', letterSpacing: '0.5px' }}>ANIMATIONS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.hoverEnabled}
                        onChange={(e) => updateSetting('hoverEnabled', e.target.checked)}
                      />
                      Hover Zoom
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.equalizerEnabled}
                        onChange={(e) => updateSetting('equalizerEnabled', e.target.checked)}
                      />
                      Equalizer Spectrum
                    </label>
                  </div>
                </div>

                {/* Section: Companion Robot */}
                <div>
                  <div style={{ fontWeight: 'bold', color: '#ffffffff', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', letterSpacing: '0.5px', marginTop: '10px' }}>COMPANION</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.showPet}
                        onChange={(e) => updateSetting('showPet', e.target.checked)}
                      />
                      Show 3D Robot Pet
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.companionMode}
                        onChange={(e) => updateSetting('companionMode', e.target.checked)}
                      />
                      Companion Only Mode
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!settings.companionMode && (
            <JarvisBlobUI
              settings={settings}
              state={assistantState}
              audioLevel={audioLevel}
              transcript={transcript}
              response={response}
              onMicToggle={handleMicToggle}
              onSubmitQuery={handleTextSubmit}
            />
          )}

          {settings.showPet && (
            <JarvisPet
              state={assistantState}
              audioLevel={audioLevel}
              onMicToggle={handleMicToggle}
              companionMode={settings.companionMode}
              onToggleCompanionMode={() => updateSetting('companionMode', !settings.companionMode)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
