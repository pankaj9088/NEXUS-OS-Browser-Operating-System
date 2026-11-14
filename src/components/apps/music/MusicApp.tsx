import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, Disc } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  tempo: number;
  scale: number[]; // Frequencies for chord arpeggios
}

const PLAYLIST: Track[] = [
  {
    id: 't-1',
    title: 'Midnight Orbit',
    artist: 'Nexus Sound Architecture',
    duration: '3:45',
    tempo: 75,
    scale: [220, 277.18, 329.63, 440, 554.37, 659.25], // A major / C#m ambient
  },
  {
    id: 't-2',
    title: 'Cyberpulse Highway',
    artist: 'Vector 9',
    duration: '4:12',
    tempo: 110,
    scale: [174.61, 220, 261.63, 349.23, 440, 523.25], // F major / Dm
  },
  {
    id: 't-3',
    title: 'Obsidian Monolith',
    artist: 'Sub-Zero Collective',
    duration: '5:20',
    tempo: 60,
    scale: [130.81, 196.0, 261.63, 392.0, 523.25], // Deep C ambient
  },
];

export const MusicApp: React.FC = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(25);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stepRef = useRef(0);

  const currentTrack = PLAYLIST[currentTrackIndex];

  // Synthesize ambient notes
  const playSynthNote = (freq: number) => {
    if (!audioCtxRef.current || isMuted || volume === 0) return;
    try {
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Lowpass filter for dreamy warm synth tone
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.3);
      filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 1.2);

      const targetGain = (volume / 100) * 0.08;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.8);
    } catch {}
  };

  const togglePlay = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }

    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const intervalMs = (60 / currentTrack.tempo) * 1000 * 0.5;
      timerRef.current = setInterval(() => {
        const note = currentTrack.scale[stepRef.current % currentTrack.scale.length];
        playSynthNote(note);
        stepRef.current += 1;
        setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
      }, intervalMs);
    }
  };

  const handleNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const nextIdx = (currentTrackIndex + 1) % PLAYLIST.length;
    setCurrentTrackIndex(nextIdx);
    setProgress(0);
    stepRef.current = 0;
    if (isPlaying) {
      setIsPlaying(false);
      setTimeout(() => togglePlay(), 100);
    }
  };

  const handlePrev = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const prevIdx = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    setCurrentTrackIndex(prevIdx);
    setProgress(0);
    stepRef.current = 0;
    if (isPlaying) {
      setIsPlaying(false);
      setTimeout(() => togglePlay(), 100);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-[#070b14] text-slate-200 select-none">
      {/* Vinyl / Cover Art Area with Frequency Visualizer */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-slate-900/60 to-transparent">
        {/* Ambient Ring Glow */}
        <div className={`w-36 h-36 rounded-full border-2 border-cyan-500/30 flex items-center justify-center relative shadow-2xl transition-all duration-700 ${
          isPlaying ? 'shadow-cyan-500/20 rotate-180 animate-spin-slow' : ''
        }`}>
          <div className="w-28 h-28 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
            <Disc className={`w-14 h-14 ${isPlaying ? 'text-cyan-400' : 'text-slate-600'}`} />
          </div>
        </div>

        {/* Track details */}
        <div className="text-center mt-5 space-y-1">
          <h2 className="text-base font-bold text-white tracking-wide">{currentTrack.title}</h2>
          <p className="text-xs text-cyan-400 font-medium">{currentTrack.artist}</p>
        </div>

        {/* Live Visualizer Frequency Bars */}
        <div className="flex items-end gap-1.5 h-10 mt-6">
          {[40, 75, 30, 90, 60, 45, 80, 50, 95, 35, 70, 65, 85, 30].map((h, i) => {
            const height = isPlaying ? Math.sin(Date.now() / 200 + i) * 30 + 50 : 15;
            return (
              <div
                key={i}
                className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-purple-500 transition-all duration-150"
                style={{ height: `${Math.max(10, height)}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Playback Controls & Progress Bar */}
      <div className="p-4 bg-slate-950/80 border-t border-white/5 space-y-3">
        {/* Progress scrub */}
        <div className="space-y-1">
          <div className="w-full bg-slate-800 rounded-full h-1.5 cursor-pointer overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>01:14</span>
            <span>{currentTrack.duration}</span>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                setIsMuted(false);
              }}
              className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Center Playback Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrev}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/30 transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
            </button>

            <button
              onClick={handleNext}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Track counter */}
          <div className="text-[11px] font-mono text-slate-500">
            {currentTrackIndex + 1} / {PLAYLIST.length}
          </div>
        </div>
      </div>
    </div>
  );
};
