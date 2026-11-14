import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Shield, 
  XCircle, 
  Monitor, 
  Wifi, 
  Layers, 
  Info,
  Zap,
  Globe
} from 'lucide-react';
import { useOSStore, APP_REGISTRY } from '../../../store/osStore';

interface ProcessItem {
  id: string;
  name: string;
  pid: number;
  cpu: number;
  mem: number;
  type: 'app' | 'system';
  windowId?: string;
}

export const SysMonApp: React.FC = () => {
  const windows = useOSStore((s) => s.windows);
  const closeWindow = useOSStore((s) => s.closeWindow);
  const fileSystem = useOSStore((s) => s.fileSystem);

  const [cpuHistory, setCpuHistory] = useState<number[]>([18, 22, 25, 20, 24, 32, 28, 26, 30, 22]);
  const [memHistory, setMemHistory] = useState<number[]>([42, 43, 42, 44, 45, 45, 46, 45, 46, 47]);
  const [currentCpu, setCurrentCpu] = useState(24);
  const [currentMem, setCurrentMem] = useState(46);

  // Real browser telemetry information
  const [browserInfo, setBrowserInfo] = useState({
    cores: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4,
    deviceMemory: typeof navigator !== 'undefined' ? (navigator as any).deviceMemory || '4+ GB' : '4+ GB',
    language: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Nexus Browser Engine',
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    resolution: typeof window !== 'undefined' ? `${window.innerWidth} x ${window.innerHeight}` : '1440 x 900',
    pixelRatio: typeof window !== 'undefined' ? `${window.devicePixelRatio}x` : '1x',
  });

  // Background system daemons
  const systemProcesses: ProcessItem[] = [
    { id: 'p-kernel', name: 'nexus-kernel.wasm (Hypervisor)', pid: 1, cpu: 1.2, mem: 128, type: 'system' },
    { id: 'p-comp', name: 'compositor-glass-gpu', pid: 142, cpu: 3.4, mem: 210, type: 'system' },
    { id: 'p-ai', name: 'gemini-copilot-daemon', pid: 219, cpu: 2.1, mem: 340, type: 'system' },
    { id: 'p-sound', name: 'webaudio-synthesizer', pid: 388, cpu: 0.6, mem: 64, type: 'system' },
    { id: 'p-net', name: 'nexus-networking-bus', pid: 402, cpu: 0.4, mem: 52, type: 'system' },
  ];

  // Dynamic processes derived from open windows
  const appProcesses: ProcessItem[] = windows.map((w, index) => {
    const appDef = APP_REGISTRY[w.appId];
    return {
      id: w.id,
      name: `${appDef?.title || w.title} (Active GUI Window)`,
      pid: 1000 + index * 14 + 7,
      cpu: Number((Math.random() * 3 + 1.2).toFixed(1)),
      mem: 140 + (index * 35) % 180,
      type: 'app',
      windowId: w.id,
    };
  });

  const allProcesses = [...systemProcesses, ...appProcesses];

  useEffect(() => {
    const interval = setInterval(() => {
      const baseCpu = 16 + windows.length * 3.5;
      const jitter = (Math.random() * 8) - 4;
      const nextCpu = Math.max(8, Math.min(94, Math.round(baseCpu + jitter)));

      const baseMem = 40 + windows.length * 2.8;
      const nextMem = Math.max(30, Math.min(88, Math.round(baseMem + (Math.random() * 2 - 1))));

      setCurrentCpu(nextCpu);
      setCurrentMem(nextMem);

      setCpuHistory((prev) => [...prev.slice(1), nextCpu]);
      setMemHistory((prev) => [...prev.slice(1), nextMem]);
    }, 1200);

    return () => clearInterval(interval);
  }, [windows.length]);

  const handleEndTask = (proc: ProcessItem) => {
    if (proc.windowId) {
      closeWindow(proc.windowId);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#070c18] text-slate-200 select-none overflow-y-auto">
      {/* Real Browser Telemetry vs Simulated Banner */}
      <div className="px-4 py-2 bg-slate-950/80 border-b border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>Browser Hardware Telemetry Active</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400/90 text-[10px]">
          <Info className="w-3 h-3" />
          <span>Simulated CPU/RAM loads marked alongside real hardware cores</span>
        </div>
      </div>

      {/* Top Hardware Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-white/5 bg-slate-950/40">
        {/* CPU */}
        <div className="p-3 bg-slate-900/60 border border-white/5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>CPU Load [Simulated]</span>
            </span>
            <span className="font-mono text-cyan-300 font-semibold">{currentCpu}%</span>
          </div>
          <div className="h-8 flex items-end gap-1 pt-1">
            {cpuHistory.map((val, idx) => (
              <div
                key={idx}
                className="flex-1 bg-cyan-500/70 rounded-t transition-all duration-300"
                style={{ height: `${val}%` }}
              />
            ))}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2">
            Real Hardware Cores: {browserInfo.cores}
          </div>
        </div>

        {/* Memory */}
        <div className="p-3 bg-slate-900/60 border border-white/5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>Memory [Simulated]</span>
            </span>
            <span className="font-mono text-purple-300 font-semibold">{currentMem}%</span>
          </div>
          <div className="h-8 flex items-end gap-1 pt-1">
            {memHistory.map((val, idx) => (
              <div
                key={idx}
                className="flex-1 bg-purple-500/70 rounded-t transition-all duration-300"
                style={{ height: `${val}%` }}
              />
            ))}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2">
            RAM Limit: {browserInfo.deviceMemory}
          </div>
        </div>

        {/* Real Window Activity */}
        <div className="p-3 bg-slate-900/60 border border-white/5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Windows</span>
            </span>
            <span className="font-mono text-emerald-300 font-semibold">{windows.length}</span>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {windows.length} GUI Process{windows.length === 1 ? '' : 'es'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2">
            Viewport: {browserInfo.resolution} ({browserInfo.pixelRatio})
          </div>
        </div>

        {/* Virtual Storage Activity */}
        <div className="p-3 bg-slate-900/60 border border-white/5 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Virtual Storage</span>
            </span>
            <span className="font-mono text-cyan-300 font-semibold">{fileSystem.length} items</span>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            Healthy Enclave
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2">
            Storage Engine: Persistent
          </div>
        </div>
      </div>

      {/* Genuine Browser Specs Strip */}
      <div className="p-4 bg-slate-950/40 border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-slate-500 block text-[10px] font-mono">CPU CORES</span>
          <span className="font-semibold text-white font-mono">{browserInfo.cores} Cores</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] font-mono">SYSTEM LOCALE</span>
          <span className="font-semibold text-white font-mono">{browserInfo.language}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] font-mono">NETWORK STATE</span>
          <span className="font-semibold text-emerald-400 font-mono">
            {browserInfo.online ? 'Online (Connected)' : 'Offline'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] font-mono">SCREEN RESOLUTION</span>
          <span className="font-semibold text-white font-mono">{browserInfo.resolution}</span>
        </div>
      </div>

      {/* Process Table Header & List */}
      <div className="flex-1 flex flex-col min-h-[240px]">
        <div className="px-4 py-2 bg-slate-950/60 border-b border-white/5 flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Active Processes ({allProcesses.length})</span>
          <span className="text-[11px] font-normal text-slate-500 font-mono">Real-time Scheduler</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 bg-slate-950/30 font-mono text-[11px]">
                <th className="py-2 px-4 font-medium">Process Name</th>
                <th className="py-2 px-3 font-medium">PID</th>
                <th className="py-2 px-3 font-medium">Type</th>
                <th className="py-2 px-3 font-medium">CPU % (Sim)</th>
                <th className="py-2 px-3 font-medium">Memory (Sim)</th>
                <th className="py-2 px-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {allProcesses.map((proc) => (
                <tr key={proc.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-slate-200 font-medium">
                    {proc.name}
                  </td>
                  <td className="py-2 px-3 text-slate-400">{proc.pid}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-sans font-semibold ${
                        proc.type === 'app'
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {proc.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-cyan-300">{proc.cpu}%</td>
                  <td className="py-2 px-3 text-purple-300">{proc.mem} MB</td>
                  <td className="py-2 px-4 text-right">
                    {proc.type === 'app' ? (
                      <button
                        onClick={() => handleEndTask(proc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-sans font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>End Task</span>
                      </button>
                    ) : (
                      <span className="text-slate-600 font-sans text-[10px]">Protected Daemon</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
