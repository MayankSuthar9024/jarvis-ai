import React, { useState } from 'react';
import { JarvisBlobUI } from './components/JarvisBlobUI';
import './App.css';

export interface JarvisSettings {
  hoverEnabled: boolean;
  equalizerEnabled: boolean;
}

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<JarvisSettings>({
    hoverEnabled: true,
    equalizerEnabled: true,
  });

  const toggleSettings = () => setShowSettings(!showSettings);

  const updateSetting = (key: keyof JarvisSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {/* Settings Button (Top Right of App) */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 100 }}>
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
              minWidth: '200px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
              color: '#fff',
              fontSize: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              backdropFilter: 'blur(10px)',
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
          </div>
        )}
      </div>

      <JarvisBlobUI settings={settings} />
    </div>
  );
}

export default App;
