import type { LucideIcon } from "lucide-react";

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  delayMs: number; // Changed to number for precise inline style control
}

export interface ButtonProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  delayMs?: number;
}

export interface MusicItem {
  id: number;
  title: string;
  author: string;
  duration?: string; // Optional, calculated automatically
  url: string; // MP3 file link
}

export interface VideoItem {
  id: number;
  title: string;
  image: string;
  videoUrl: string;
}
