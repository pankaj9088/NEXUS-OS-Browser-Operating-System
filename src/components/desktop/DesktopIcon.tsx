import React from 'react';
import { AppIcon } from '../common/AppIcon';
import { useOSStore } from '../../store/osStore';
import { soundFX } from '../../hooks/useSound';

interface DesktopIconProps {
  id: string;
  title: string;
  icon: string;
  isSelected?: boolean;
  onSelect?: () => void;
  onOpen?: () => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  id,
  title,
  icon,
  isSelected = false,
  onSelect,
  onOpen,
}) => {
  const soundEnabled = useOSStore((s) => s.settings.soundEnabled);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playClick(soundEnabled);
    onSelect?.();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpen?.();
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`group flex flex-col items-center justify-center p-2 rounded-xl w-24 h-24 select-none cursor-pointer transition-all ${
        isSelected
          ? 'bg-cyan-500/20 border border-cyan-400/40 shadow-lg shadow-cyan-500/10'
          : 'hover:bg-white/10 hover:border-white/10 border border-transparent'
      }`}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-100 group-hover:scale-110 transition-transform drop-shadow-md">
        <AppIcon name={icon} className="w-8 h-8 text-cyan-300 group-hover:text-cyan-200" />
      </div>
      <span className="text-[11px] font-medium text-slate-200 text-center line-clamp-2 px-1 drop-shadow-md leading-tight mt-1 group-hover:text-white">
        {title}
      </span>
    </div>
  );
};
