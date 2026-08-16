import React, { useState } from 'react';
import { JarvisBlobUI } from './components/JarvisBlobUI';
import { AboutPage } from './components/AboutPage';
import './App.css';

export interface JarvisSettings {
  hoverEnabled: boolean;
  equalizerEnabled: boolean;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'about'>('home');
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
      {currentPage === 'about' ? (
        <AboutPage onBack={() => setCurrentPage('home')} />
      ) : (
        <>
          {/* Top Left Header */}
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
          // Slightly reduced sensitivity
          const rotateX = ((y - centerY) / centerY) * -12;
          const rotateY = ((x - centerX) / centerX) * 12;
          e.currentTarget.style.transform = `perspective(550px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.07)`;
          // Update shine position variable based on cursor X
          const shinePos = (x / rect.width) * 300 - 150; // maps 0% to -150% and 100% to 150%
          e.currentTarget.style.setProperty('--shine-pos', `${shinePos}%`);
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'perspective(500px) rotateX(0deg) rotateY(0deg) scale(1)';
        }}
        title="About JARVIS"
      >
        <h1 style={{ margin: 0, color: '#fff', fontSize: '24px', letterSpacing: '2px', fontWeight: 'bold', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>JARVIS</h1>
      </div>

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
        </>
      )}
    </div>
  );
}

export default App;
