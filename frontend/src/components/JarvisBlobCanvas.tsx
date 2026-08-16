import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { AssistantState } from '../utils/JarvisVoiceController';

interface JarvisBlobCanvasProps {
  state: AssistantState;
  audioLevel: number;
}

class Particle {
  x1: number;
  y1: number;
  r1: number;
  x2: number;
  y2: number;
  r2: number;
  colorStop1: string;
  colorStop2: string;

  constructor(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number, colorStop1: string, colorStop2: string) {
    this.x1 = x1;
    this.y1 = y1;
    this.r1 = r1;
    this.x2 = x2;
    this.y2 = y2;
    this.r2 = r2;
    this.colorStop1 = colorStop1;
    this.colorStop2 = colorStop2;
  }
}

const colorArray = [
  "#2D9CDB", "#FFE600", "#2C1363", "#FF1744", "#00D48C",
  "#7CD400", "#FF69C3", "#FAD03E", "#F4C400", "#F93CA2",
  "#7700f7", "#43607B", "#FFD700", "#FF8C00", "#FF3D00",
  "#FFFFFF", "#09a1ed", "#00D0A8", "#00E676", "#2979FF",
  "#9B59B6", "#34495E", "#FFC107", "#FF5722", "#E53935",
  "#33de3c", "#00BFA5", "#00E676", "#FF66CC", "#1E88E5",
  "#BA68C8", "#bb1cc7"
];

export const JarvisBlobCanvas: React.FC<JarvisBlobCanvasProps> = ({ state, audioLevel }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioLevelRef = useRef(audioLevel);
  const stateRef = useRef<AssistantState>(state);

  useEffect(() => { audioLevelRef.current = audioLevel; }, [audioLevel]);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ---- USER'S EXACT BLOB CODE ----
    const twoPi = Math.PI * 2;
    const sizeObj = {
      windowWidth: 800,
      windowHeight: 800,
    };
    const blobSize = 800 * 0.5;
    let dotSize = blobSize * 0.7;
    let minDotSize = dotSize - (dotSize * 0.2);

    canvas.width = sizeObj.windowWidth;
    canvas.height = sizeObj.windowHeight;

    const particleArray: Particle[] = [];
    const tweens: gsap.core.Tween[] = [];

    colorArray.forEach((c) => {
      const x = gsap.utils.random(5, sizeObj.windowWidth);
      const y = gsap.utils.random(0, sizeObj.windowHeight);
      const p = new Particle(x, y, dotSize, x, y, minDotSize, 'rgba(255,255,255,0)', c);

      particleArray.push(p);

      const radius = gsap.utils.random(5, blobSize * 0.2);

      gsap.set(p, {
        r1: minDotSize,
        r2: dotSize
      });

      const t1 = gsap.to(p, {
        duration: 'random(3, 6)',
        x1: "+=" + twoPi,
        x2: "+=" + twoPi,
        repeat: -1,
        modifiers: {
          x1: (x: string) => (sizeObj.windowWidth / 2) + (Math.cos(parseFloat(x)) * radius),
          x2: (x: string) => (sizeObj.windowWidth / 2) + (Math.cos(parseFloat(x)) * radius),
        },
        ease: 'none'
      });

      const t2 = gsap.to(p, {
        duration: 'random(3, 6)',
        y1: "+=" + twoPi,
        y2: "+=" + twoPi,
        repeat: -1,
        modifiers: {
          y1: (y: string) => (sizeObj.windowHeight / 2) + (Math.sin(parseFloat(y)) * radius),
          y2: (y: string) => (sizeObj.windowHeight / 2) + (Math.sin(parseFloat(y)) * radius)
        },
        ease: 'none'
      });

      tweens.push(t1, t2);
    });

    function draw() {
      ctx!.globalCompositeOperation = "source-over";
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Clip to circle (blob-sized circular background)
      const centerX = sizeObj.windowWidth / 2;
      const centerY = sizeObj.windowHeight / 2;
      const currentState = stateRef.current;
      const level = audioLevelRef.current;
      const baseRadius = Math.min(sizeObj.windowWidth, sizeObj.windowHeight) * 0.25;

      const blobRadius = baseRadius;

      ctx!.save();
      ctx!.beginPath();
      ctx!.arc(centerX, centerY, blobRadius, 0, Math.PI * 2);
      ctx!.clip();

      // Dark base inside the clipped circle
      ctx!.fillStyle = '#080613';
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      // Draw particles exactly as the user's code
      particleArray.forEach((particle) => {
        const radGrad = ctx!.createRadialGradient(
          particle.x1, particle.y1, particle.r1,
          particle.x2, particle.y2, particle.r2
        );
        radGrad.addColorStop(0, particle.colorStop1);
        radGrad.addColorStop(1, particle.colorStop2);

        ctx!.fillStyle = radGrad;
        ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
        ctx!.globalCompositeOperation = "lighter";
      });

      ctx!.restore();

      // Outer glow ring around the blob circle
      // ctx!.save();
      // ctx!.beginPath();
      // ctx!.arc(centerX, centerY, blobRadius, 0, Math.PI * 2);
      // 
      // let glowColor = 'rgba(45, 156, 219, 0.1)';
      // if (currentState === 'LISTENING') glowColor = 'rgba(0, 240, 255, 0.3)';
      // else if (currentState === 'SPEAKING') glowColor = 'transparent';
      // else if (currentState === 'THINKING') glowColor = 'rgba(192, 132, 252, 0.3)';
      // 
      // ctx!.strokeStyle = glowColor;
      // ctx!.lineWidth = 1;
      // ctx!.shadowColor = glowColor;
      // ctx!.shadowBlur = 5;
      // ctx!.stroke();
      // ctx!.restore();
    }

    gsap.ticker.add(draw);

    return () => {
      gsap.ticker.remove(draw);
      tweens.forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="jarvis-canvas-wrapper">
      <canvas ref={canvasRef} className={`jarvis-canvas orb-${state.toLowerCase()}`} />
    </div>
  );
};
