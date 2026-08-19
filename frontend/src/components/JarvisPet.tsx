import React, { useState, useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import type { AssistantState } from '../utils/JarvisVoiceController';

interface JarvisPetProps {
  state: AssistantState;
  audioLevel: number;
  onMicToggle: () => void;
  companionMode: boolean;
  onToggleCompanionMode: () => void;
}

export const JarvisPet: React.FC<JarvisPetProps> = ({
  state,
  audioLevel,
  onMicToggle,
  companionMode,
  onToggleCompanionMode,
}) => {
  // Dragging state
  const [position, setPosition] = useState({ x: window.innerWidth - 220, y: window.innerHeight - 240 });
  const [isDragging, setIsDragging] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [splineError, setSplineError] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pointerStartRef = useRef({ x: 0, y: 0 });

  // Detect Electron environment
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

  // WebGL detection
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const supported = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setWebglSupported(supported);
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);

  // Update position on window resize to keep inside bounds (only when in web/pointer dragging mode)
  useEffect(() => {
    if (isElectron && companionMode) return;
    
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = window.innerWidth - 180;
        const maxY = window.innerHeight - 180;
        return {
          x: Math.max(10, Math.min(prev.x, maxX)),
          y: Math.max(10, Math.min(prev.y, maxY)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isElectron, companionMode]);

  // Pointer dragging handlers (disabled in Electron companion mode, using native OS drag instead)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isElectron && companionMode) return;
    
    // Only drag with left click / primary touch
    if (e.button !== 0) return;

    setIsDragging(true);
    dragStartRef.current = { ...position };
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;

    const newX = dragStartRef.current.x + deltaX;
    const newY = dragStartRef.current.y + deltaY;

    // Apply viewport bounds (with padding)
    const maxX = window.innerWidth - 180;
    const maxY = window.innerHeight - 180;

    setPosition({
      x: Math.max(10, Math.min(newX, maxX)),
      y: Math.max(10, Math.min(newY, maxY)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }

    // Check if it was a quick click rather than a drag
    const deltaX = Math.abs(e.clientX - pointerStartRef.current.x);
    const deltaY = Math.abs(e.clientY - pointerStartRef.current.y);
    
    if (deltaX < 5 && deltaY < 5) {
      // Toggle microphone on click
      onMicToggle();
    }
  };

  const getAuraColorClass = () => {
    switch (state) {
      case 'LISTENING':
        return 'pet-aura-listening';
      case 'THINKING':
        return 'pet-aura-thinking';
      case 'SPEAKING':
        return 'pet-aura-speaking';
      default:
        return 'pet-aura-idle';
    }
  };

  const isNativeDrag = isElectron && companionMode;

  return (
    <div
      ref={containerRef}
      className={`jarvis-pet-container ${isDragging ? 'dragging' : ''} ${
        isNativeDrag ? 'electron-draggable' : ''
      }`}
      style={{
        transform: isNativeDrag ? 'none' : `translate3d(${position.x}px, ${position.y}px, 0)`,
        position: isNativeDrag ? 'relative' : 'fixed',
        left: 0,
        top: 0,
        zIndex: 9999,
        touchAction: 'none',
        width: isNativeDrag ? '100vw' : '160px',
        height: isNativeDrag ? '100vh' : '160px',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Floating Hover Controls Panel */}
      {companionMode && (
        <div className="pet-hover-controls electron-non-draggable">
          <button
            className="pet-control-btn pet-action-btn"
            onClick={onMicToggle}
            title={state === 'LISTENING' ? 'Stop Listening' : 'Speak to Jarvis'}
          >
            {state === 'LISTENING' ? '🔴' : '🎤'}
          </button>
          <button
            className="pet-control-btn pet-action-btn"
            onClick={onToggleCompanionMode}
            title="Return to Dashboard"
          >
            🖥️
          </button>
        </div>
      )}

      {/* Main Companion Body */}
      <div 
        className={`pet-body-wrapper ${state.toLowerCase()}`} 
        title={isNativeDrag ? "Drag anywhere to move!" : "Click to speak / Drag to move!"}
      >
        {/* State Aura Glow Base */}
        <div 
          className={`pet-aura ${getAuraColorClass()}`}
          style={{ transform: `scale(${1 + audioLevel * 0.3})` }}
        />

        {/* 3D Robot Spline Canvas */}
        {webglSupported && !splineError ? (
          <div className="spline-pet-frame">
            <Spline
              scene="https://prod.spline.design/9zBMf6raVSXKyHOG/scene.splinecode"
              onLoad={() => setSplineLoaded(true)}
              onError={() => {
                setSplineError(true);
                setSplineLoaded(false);
              }}
            />
            {/* Loading Overlay */}
            {!splineLoaded && (
              <div className="pet-loading-spinner">
                <div className="spinner-core" />
              </div>
            )}
          </div>
        ) : (
          /* Animated Futuristic Fallback Robot SVG */
          <div className="fallback-robot-wrapper">
            <svg
              className="fallback-robot-svg"
              viewBox="0 0 100 100"
              width="110"
              height="110"
            >
              <defs>
                <linearGradient id="robotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="neonCyan" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="100%" stopColor="#0080ff" />
                </linearGradient>
                <linearGradient id="neonPurple" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#7700f7" />
                </linearGradient>
                <linearGradient id="neonGold" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffe600" />
                  <stop offset="100%" stopColor="#ff8c00" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Hovering Body Base (Shadow) */}
              <ellipse
                cx="50"
                cy="85"
                rx="20"
                ry="4"
                fill="rgba(0, 0, 0, 0.4)"
                className="shadow-ellipse"
              />

              {/* Main Hovering Robot Group */}
              <g className="robot-floating-group">
                {/* Propulsion glow */}
                <path
                  d="M44,70 L56,70 L50,82 Z"
                  fill={state === 'LISTENING' ? 'url(#neonCyan)' : state === 'THINKING' ? 'url(#neonPurple)' : state === 'SPEAKING' ? 'url(#neonGold)' : 'rgba(255,255,255,0.1)'}
                  opacity="0.8"
                  className="thruster-glow"
                  style={{ transform: `scaleY(${1 + audioLevel * 0.6})`, transformOrigin: '50px 70px' }}
                />

                {/* Body */}
                <rect
                  x="36"
                  y="48"
                  width="28"
                  height="22"
                  rx="8"
                  fill="url(#robotGrad)"
                  stroke={state === 'LISTENING' ? '#00f0ff' : state === 'THINKING' ? '#c084fc' : state === 'SPEAKING' ? '#ffe600' : 'rgba(255,255,255,0.3)'}
                  strokeWidth="2"
                />
                
                {/* Neck */}
                <rect
                  x="47"
                  y="44"
                  width="6"
                  height="5"
                  fill="#475569"
                />

                {/* Head */}
                <rect
                  x="30"
                  y="22"
                  width="40"
                  height="24"
                  rx="10"
                  fill="url(#robotGrad)"
                  stroke={state === 'LISTENING' ? '#00f0ff' : state === 'THINKING' ? '#c084fc' : state === 'SPEAKING' ? '#ffe600' : 'rgba(255,255,255,0.3)'}
                  strokeWidth="2"
                />

                {/* Screen Face */}
                <rect
                  x="35"
                  y="26"
                  width="30"
                  height="16"
                  rx="6"
                  fill="#030712"
                />

                {/* Glowing Eyes */}
                {state === 'THINKING' ? (
                  /* Loading / Thinking Eyes - Spinner-like */
                  <g className="thinking-eyes">
                    <circle cx="43" cy="34" r="3" fill="#c084fc" filter="url(#glow)" />
                    <circle cx="57" cy="34" r="3" fill="#c084fc" filter="url(#glow)" />
                  </g>
                ) : (
                  /* Standard / Breathing Eyes */
                  <g className="standard-eyes">
                    <ellipse
                      cx="44"
                      cy="34"
                      rx="3"
                      ry={state === 'LISTENING' ? '4' : '3'}
                      fill={state === 'LISTENING' ? '#00f0ff' : state === 'SPEAKING' ? '#ffe600' : '#ffffff'}
                      filter="url(#glow)"
                      className="robot-eye-left"
                    />
                    <ellipse
                      cx="56"
                      cy="34"
                      rx="3"
                      ry={state === 'LISTENING' ? '4' : '3'}
                      fill={state === 'LISTENING' ? '#00f0ff' : state === 'SPEAKING' ? '#ffe600' : '#ffffff'}
                      filter="url(#glow)"
                      className="robot-eye-right"
                    />
                  </g>
                )}

                {/* Antennas */}
                <line
                  x1="50"
                  y1="22"
                  x2="50"
                  y2="14"
                  stroke={state === 'LISTENING' ? '#00f0ff' : state === 'THINKING' ? '#c084fc' : state === 'SPEAKING' ? '#ffe600' : 'rgba(255,255,255,0.3)'}
                  strokeWidth="2"
                />
                <circle
                  cx="50"
                  cy="12"
                  r="3.5"
                  fill={state === 'LISTENING' ? '#00f0ff' : state === 'THINKING' ? '#c084fc' : state === 'SPEAKING' ? '#ffe600' : '#64748b'}
                  filter="url(#glow)"
                  className="antenna-tip"
                />
              </g>
            </svg>
          </div>
        )}
        
        {/* Floating Indicator (e.g. mic icon when listening) */}
        {state === 'LISTENING' && !companionMode && (
          <div className="pet-state-badge listening">
            🎤
          </div>
        )}
      </div>
    </div>
  );
};


