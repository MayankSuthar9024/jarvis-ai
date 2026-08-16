import React from 'react';

export const AboutPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      color: '#fff',
      padding: '2rem',
      background: 'linear-gradient(135deg, rgba(20,20,30,0.4), rgba(10,10,15,0.7))',
      backdropFilter: 'blur(5px)',
      textAlign: 'center',
      animation: 'fadeIn 0.5s ease-out',
      width: '100%'
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', letterSpacing: '8px', textShadow: '0 4px 30px rgba(255,255,255,0.4)', fontWeight: 'bold' }}>ABOUT JARVIS</h1>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '3rem',
        maxWidth: '700px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      }}>
        <p style={{ fontSize: '1.3rem', lineHeight: '1.8', color: 'rgba(255,255,255,0.9)', marginBottom: '2rem' }}>
          JARVIS is an advanced artificial intelligence assistant designed for an unparalleled user experience.
          Built with cutting-edge web technologies, it features dynamic visualizations and voice interaction capabilities to seamlessly assist you.
        </p>
        
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.6)' }}>
          System Version: 2.4.1 <br/>
          Core Modules: Active <br/>
          Neural Net: Synchronized
        </p>
      </div>

      <button 
        onClick={onBack}
        style={{
          marginTop: '3rem',
          padding: '14px 32px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '40px',
          color: '#fff',
          fontSize: '1.1rem',
          letterSpacing: '1px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(255,255,255,0.2)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        }}
      >
        Return to Dashboard
      </button>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};
