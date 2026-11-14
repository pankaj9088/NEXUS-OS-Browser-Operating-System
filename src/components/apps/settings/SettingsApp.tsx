import React, { useState, useRef } from 'react';
import { 
  Palette, 
  Volume2, 
  Clock, 
  Info, 
  User, 
  Check, 
  RotateCcw,
  Upload,
  Sun,
  Moon,
  Sliders,
  Bell,
  Sparkles,
  Monitor
} from 'lucide-react';
import { useOSStore, WALLPAPERS } from '../../../store/osStore';
import { AccentColor, ThemeMode } from '../../../types/os';
import { soundFX } from '../../../hooks/useSound';

export const SettingsApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'sound' | 'time' | 'notifications' | 'system'>('appearance');

  const settings = useOSStore((s) => s.settings);
  const updateSettings = useOSStore((s) => s.updateSettings);
  const setWallpaper = useOSStore((s) => s.setWallpaper);
  const uploadCustomWallpaper = useOSStore((s) => s.uploadCustomWallpaper);
  const setThemeMode = useOSStore((s) => s.setThemeMode);
  const setAccentColor = useOSStore((s) => s.setAccentColor);
  const toggleSound = useOSStore((s) => s.toggleSound);
  const addNotification = useOSStore((s) => s.addNotification);

  const [usernameInput, setUsernameInput] = useState(settings.username);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accentOptions: { name: AccentColor; hex: string; label: string }[] = [
    { name: 'cyan', hex: '#06b6d4', label: 'Electric Cyan' },
    { name: 'violet', hex: '#a855f7', label: 'Hyper Violet' },
    { name: 'emerald', hex: '#10b981', label: 'Matrix Emerald' },
    { name: 'amber', hex: '#f59e0b', label: 'Solar Amber' },
    { name: 'rose', hex: '#f43f5e', label: 'Laser Rose' },
  ];

  const handleCustomWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        uploadCustomWallpaper(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      updateSettings({ username: usernameInput.trim() });
      addNotification({
        title: 'Profile Updated',
        message: `Account name set to ${usernameInput.trim()}.`,
        type: 'success',
        app: 'Settings',
      });
    }
  };

  const handleResetWorkspace = () => {
    localStorage.removeItem('nexus_os_settings');
    localStorage.removeItem('nexus_os_fs');
    localStorage.removeItem('nexus_os_calendar');
    localStorage.removeItem('nexus_notes');
    window.location.reload();
  };

  return (
    <div className="flex h-full w-full bg-[#080d19] text-slate-200 select-none">
      {/* Hidden input for wallpaper upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCustomWallpaperUpload}
        className="hidden"
      />

      {/* Navigation Sidebar */}
      <div className="w-52 bg-slate-950/70 border-r border-white/5 p-3 flex flex-col shrink-0">
        <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase px-2 mb-2">
          Preferences
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'appearance'
                ? 'bg-white/10 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Palette className="w-4 h-4 text-cyan-400" />
            <span>Appearance & Theme</span>
          </button>

          <button
            onClick={() => setActiveTab('sound')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'sound'
                ? 'bg-white/10 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Volume2 className="w-4 h-4 text-purple-400" />
            <span>Audio & FX</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'notifications'
                ? 'bg-white/10 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Bell className="w-4 h-4 text-emerald-400" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab('time')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'time'
                ? 'bg-white/10 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Time & Clock</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'system'
                ? 'bg-white/10 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Info className="w-4 h-4 text-rose-400" />
            <span>System & Profile</span>
          </button>
        </div>

        {/* Profile Card Footer */}
        <div className="mt-auto pt-3 border-t border-white/5 flex items-center gap-2 px-1">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs">
            {settings.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="truncate text-xs">
            <div className="font-medium text-slate-200 truncate">{settings.username}</div>
            <div className="text-[10px] text-slate-500">Administrator</div>
          </div>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'appearance' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-white">Appearance & Themes</h2>
              <p className="text-xs text-slate-400">Personalize desktop wallpapers, mode, and accent lighting</p>
            </div>

            {/* Dark / Light Theme Mode */}
            <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl space-y-3">
              <label className="text-xs font-semibold text-slate-200">Theme Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setThemeMode('dark')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    settings.themeMode === 'dark'
                      ? 'border-cyan-400 bg-cyan-500/10 text-white'
                      : 'border-white/5 bg-slate-950/40 text-slate-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-5 h-5 text-cyan-400" />
                  <div className="text-left">
                    <div className="text-xs font-semibold">Dark Space Mode</div>
                    <div className="text-[10px] text-slate-500">Obsidian navy with neon edge lighting</div>
                  </div>
                </button>

                <button
                  onClick={() => setThemeMode('light')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    settings.themeMode === 'light'
                      ? 'border-cyan-400 bg-cyan-500/10 text-white'
                      : 'border-white/5 bg-slate-950/40 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-400" />
                  <div className="text-left">
                    <div className="text-xs font-semibold">High-Luminance Mode</div>
                    <div className="text-[10px] text-slate-500">Enhanced contrast for daylight work</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">Accent Glow Light</label>
              <div className="flex flex-wrap gap-2.5">
                {accentOptions.map((acc) => {
                  const isSelected = settings.accentColor === acc.name;
                  return (
                    <button
                      key={acc.name}
                      onClick={() => setAccentColor(acc.name)}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-white/40 bg-white/10 ring-1 ring-white/20'
                          : 'border-white/5 bg-slate-900/50 hover:bg-slate-900'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full shadow-md"
                        style={{ backgroundColor: acc.hex }}
                      />
                      <span className="text-xs font-medium text-slate-200">{acc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wallpaper Selection + Custom Upload */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Desktop Background</label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-medium transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Custom Wallpaper</span>
                </button>
              </div>

              {/* Gallery */}
              <div className="grid grid-cols-2 gap-3">
                {WALLPAPERS.map((wp) => {
                  const isSelected = settings.wallpaper === wp.url;
                  return (
                    <div
                      key={wp.id}
                      onClick={() => setWallpaper(wp.url)}
                      className={`group relative rounded-xl overflow-hidden cursor-pointer border transition-all ${
                        isSelected
                          ? 'border-cyan-400 ring-2 ring-cyan-400/30 scale-[1.01]'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div
                        className="h-28 w-full bg-cover bg-center"
                        style={{
                          background: wp.url.startsWith('linear') ? wp.url : `url(${wp.url}) center/cover`,
                        }}
                      />
                      <div className="p-2.5 bg-slate-900/90 border-t border-white/5 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-slate-200">{wp.name}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{wp.description}</div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Custom Wallpapers uploaded by user */}
                {settings.customWallpapers?.map((cUrl, idx) => {
                  const isSelected = settings.wallpaper === cUrl;
                  return (
                    <div
                      key={`custom-${idx}`}
                      onClick={() => setWallpaper(cUrl)}
                      className={`group relative rounded-xl overflow-hidden cursor-pointer border transition-all ${
                        isSelected
                          ? 'border-cyan-400 ring-2 ring-cyan-400/30 scale-[1.01]'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div
                        className="h-28 w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${cUrl})` }}
                      />
                      <div className="p-2.5 bg-slate-900/90 border-t border-white/5 flex items-center justify-between">
                        <div className="text-xs font-semibold text-purple-300">Custom Upload #{idx + 1}</div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Window Visual Preferences */}
            <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl space-y-3">
              <label className="text-xs font-semibold text-slate-200">Window Blur & Atmosphere</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => updateSettings({ blurIntensity: lvl })}
                    className={`py-2 rounded-lg text-xs capitalize transition-colors border ${
                      settings.blurIntensity === lvl
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                        : 'bg-slate-950/40 text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {lvl} Blur
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sound' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-base font-bold text-white">Audio & Sound FX</h2>
              <p className="text-xs text-slate-400">Procedural Web Audio synthesizer feedback</p>
            </div>

            <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Window Action Feedback</div>
                <div className="text-[11px] text-slate-400">Play subtle synthesized tones on window open, minimize, and close</div>
              </div>
              <button
                onClick={toggleSound}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.soundEnabled ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">Auditory Previews</div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => soundFX.playClick(true)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs rounded-lg border border-white/5 transition-colors"
                >
                  Click Tone
                </button>
                <button
                  onClick={() => soundFX.playWindowOpen(true)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs rounded-lg border border-white/5 transition-colors"
                >
                  Window Chime
                </button>
                <button
                  onClick={() => soundFX.playNotification(true)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs rounded-lg border border-white/5 transition-colors"
                >
                  Notification Bell
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-base font-bold text-white">Notification Preferences</h2>
              <p className="text-xs text-slate-400">Configure desktop banners and alert center behavior</p>
            </div>

            <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Floating Toast Banners</div>
                  <div className="text-[11px] text-slate-400">Display popup alerts in lower-right corner</div>
                </div>
                <div className="text-xs text-emerald-400 font-mono">Enabled</div>
              </div>
              <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Auto-Dismiss Timer</div>
                  <div className="text-[11px] text-slate-400">Dismiss alerts automatically after 4.5 seconds</div>
                </div>
                <div className="text-xs text-slate-300 font-mono">4.5s</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'time' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-base font-bold text-white">Time & Date</h2>
              <p className="text-xs text-slate-400">Format display preferences for clock and calendar</p>
            </div>

            <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">24-Hour Military Format</div>
                  <div className="text-[11px] text-slate-400">Show 15:30 instead of 3:30 PM</div>
                </div>
                <button
                  onClick={() =>
                    updateSettings({ clockFormat: settings.clockFormat === '24h' ? '12h' : '24h' })
                  }
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.clockFormat === '24h' ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.clockFormat === '24h' ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Live Running Seconds</div>
                  <div className="text-[11px] text-slate-400">Display high-precision seconds in taskbar tray</div>
                </div>
                <button
                  onClick={() => updateSettings({ showSeconds: !settings.showSeconds })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.showSeconds ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.showSeconds ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h2 className="text-base font-bold text-white">System & Profile</h2>
              <p className="text-xs text-slate-400">Manage user credentials and reset workspace state</p>
            </div>

            {/* Profile editor */}
            <form onSubmit={handleSaveUsername} className="p-4 bg-slate-900/60 border border-white/5 rounded-xl space-y-3">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Account Name</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-slate-100 outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            </form>

            <div className="p-4 bg-slate-900/40 border border-white/5 rounded-xl space-y-2.5 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 font-sans">Build</span>
                <span className="text-cyan-300">Nexus OS 4.2.0 (Phase 2 Full Stack)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 font-sans">Storage Engine</span>
                <span className="text-slate-200">Unified Storage Service Abstraction</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 font-sans">AI Kernel</span>
                <span className="text-slate-200">DevLocalAIService (Streaming)</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleResetWorkspace}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Entire Workspace to Factory Defaults</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
