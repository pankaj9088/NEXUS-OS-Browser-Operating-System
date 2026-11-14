import React, { useRef, useEffect, useState } from 'react';
import { Play, RotateCcw, Trophy, Heart } from 'lucide-react';
import { soundFX } from '../../../hooks/useSound';
import { useOSStore } from '../../../store/osStore';

export const ArcadeApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('nexus_breakout_hi')) || 0;
    } catch {
      return 0;
    }
  });
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'won'>('idle');

  const soundEnabled = useOSStore((s) => s.settings.soundEnabled);

  // Game internal refs for 60fps loop
  const paddleRef = useRef({ x: 260, width: 90, height: 10, speed: 8 });
  const ballRef = useRef({ x: 300, y: 350, dx: 3.5, dy: -3.5, radius: 6 });
  const bricksRef = useRef<{ x: number; y: number; w: number; h: number; color: string; alive: boolean }[]>([]);
  const particlesRef = useRef<{ x: number; y: number; dx: number; dy: number; color: string; alpha: number }[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Initialize Bricks
  const initBricks = () => {
    const rows = 4;
    const cols = 7;
    const brickW = 68;
    const brickH = 16;
    const padding = 10;
    const offsetX = 35;
    const offsetY = 50;
    const colors = ['#06b6d4', '#a855f7', '#ec4899', '#3b82f6'];

    const newBricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        newBricks.push({
          x: offsetX + c * (brickW + padding),
          y: offsetY + r * (brickH + padding),
          w: brickW,
          h: brickH,
          color: colors[r % colors.length],
          alive: true,
        });
      }
    }
    bricksRef.current = newBricks;
  };

  const startGame = () => {
    initBricks();
    paddleRef.current.x = 250;
    ballRef.current = { x: 300, y: 340, dx: 3.5, dy: -3.5, radius: 6 };
    particlesRef.current = [];
    setScore(0);
    setLives(3);
    setGameState('playing');
  };

  const resetGame = () => {
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    startGame();
  };

  useEffect(() => {
    initBricks();
  }, []);

  // Main game animation loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localScore = score;
    let localLives = lives;

    const render = () => {
      // Clear with dark trail
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Update & Draw Particles
      particlesRef.current.forEach((p, idx) => {
        p.x += p.dx;
        p.y += p.dy;
        p.alpha -= 0.03;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);

      // Draw Bricks
      let remainingBricks = 0;
      bricksRef.current.forEach((brick) => {
        if (!brick.alive) return;
        remainingBricks++;
        ctx.fillStyle = brick.color;
        ctx.shadowColor = brick.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
        ctx.shadowBlur = 0;
      });

      if (remainingBricks === 0) {
        setGameState('won');
        soundFX.playWindowOpen(soundEnabled);
        return;
      }

      // Draw Paddle
      const paddle = paddleRef.current;
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(paddle.x, canvas.height - 24, paddle.width, paddle.height, 5);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Update Ball
      const ball = ballRef.current;
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Wall bounce
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.dx = -ball.dx;
        soundFX.playClick(soundEnabled);
      } else if (ball.x + ball.radius >= canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.dx = -ball.dx;
        soundFX.playClick(soundEnabled);
      }
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.dy = -ball.dy;
        soundFX.playClick(soundEnabled);
      }

      // Bottom death
      if (ball.y + ball.radius >= canvas.height) {
        localLives -= 1;
        setLives(localLives);
        if (localLives <= 0) {
          setGameState('gameover');
          soundFX.playWindowClose(soundEnabled);
          return;
        } else {
          // Reset ball to paddle
          ball.x = paddle.x + paddle.width / 2;
          ball.y = canvas.height - 40;
          ball.dx = 3.5 * (Math.random() > 0.5 ? 1 : -1);
          ball.dy = -3.5;
        }
      }

      // Paddle collision
      if (
        ball.y + ball.radius >= canvas.height - 24 &&
        ball.y - ball.radius <= canvas.height - 14 &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width
      ) {
        ball.dy = -Math.abs(ball.dy);
        // Angle deflection based on hit location
        const hitOffset = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        ball.dx = hitOffset * 5.0;
        soundFX.playClick(soundEnabled);
      }

      // Brick collision
      bricksRef.current.forEach((brick) => {
        if (!brick.alive) return;
        if (
          ball.x + ball.radius >= brick.x &&
          ball.x - ball.radius <= brick.x + brick.w &&
          ball.y + ball.radius >= brick.y &&
          ball.y - ball.radius <= brick.y + brick.h
        ) {
          brick.alive = false;
          ball.dy = -ball.dy;
          localScore += 100;
          setScore(localScore);

          if (localScore > highScore) {
            setHighScore(localScore);
            try {
              localStorage.setItem('nexus_breakout_hi', String(localScore));
            } catch {}
          }

          soundFX.playClick(soundEnabled);

          // Spawn burst particles
          for (let p = 0; p < 8; p++) {
            particlesRef.current.push({
              x: brick.x + brick.w / 2,
              y: brick.y + brick.h / 2,
              dx: (Math.random() - 0.5) * 6,
              dy: (Math.random() - 0.5) * 6,
              color: brick.color,
              alpha: 1.0,
            });
          }
        }
      });

      // Draw Ball
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [gameState, soundEnabled, highScore]);

  // Pointer move control for paddle
  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scale = canvas.width / rect.width;
    const paddle = paddleRef.current;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, mouseX * scale - paddle.width / 2));
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#050811] text-slate-200 select-none items-center justify-between p-3">
      {/* Top Game Bar */}
      <div className="w-full max-w-[600px] flex items-center justify-between px-2 py-1 bg-slate-950/60 border border-white/5 rounded-lg text-xs font-mono">
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
          <span>SCORE:</span>
          <span>{score}</span>
        </div>

        <div className="flex items-center gap-1 text-rose-400">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-3.5 h-3.5 ${i < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-700'}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 text-amber-400">
          <Trophy className="w-3.5 h-3.5" />
          <span>HI: {highScore}</span>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative my-2 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onPointerMove={handleCanvasPointerMove}
          className="bg-[#060a14] block cursor-none"
        />

        {/* Overlay states */}
        {gameState !== 'playing' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
            <h2 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              {gameState === 'idle' && 'NEON BREAKOUT'}
              {gameState === 'gameover' && 'SYSTEM COMPROMISED'}
              {gameState === 'won' && 'VICTORY SECURED'}
            </h2>

            <p className="text-xs text-slate-400 text-center max-w-xs">
              {gameState === 'idle' && 'Move paddle to bounce the neon pulse and clear the defense matrix.'}
              {gameState === 'gameover' && `Final Score: ${score}. Try again to beat high score!`}
              {gameState === 'won' && `Phenomenal reflex! Score: ${score}.`}
            </p>

            <button
              onClick={startGame}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/30 transition-transform active:scale-95"
            >
              {gameState === 'idle' ? <Play className="w-4 h-4 fill-slate-950" /> : <RotateCcw className="w-4 h-4" />}
              <span>{gameState === 'idle' ? 'START MISSION' : 'RETRY'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer controls hint */}
      <div className="text-[11px] text-slate-500 font-sans">
        Move pointer or finger across screen to slide paddle
      </div>
    </div>
  );
};
