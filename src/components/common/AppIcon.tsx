import React from 'react';
import {
  Terminal,
  Folder,
  Code2,
  Globe,
  Activity,
  Music,
  StickyNote,
  Calculator,
  Gamepad2,
  Settings,
  Bot,
  FileText,
  FileCode,
  FileJson,
  Image as ImageIcon,
  FolderOpen,
  Sparkles,
  Calendar,
  LucideIcon
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Terminal,
  Folder,
  FolderOpen,
  Calendar,
  Code2,
  Globe,
  Activity,
  Music,
  StickyNote,
  Calculator,
  Gamepad2,
  Settings,
  Bot,
  FileText,
  FileCode,
  FileJson,
  Image: ImageIcon,
  Sparkles,
};

interface AppIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, className = 'w-6 h-6', size }) => {
  const IconComponent = ICON_MAP[name] || FileText;
  return <IconComponent className={className} size={size} />;
};
