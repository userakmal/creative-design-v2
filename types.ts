import type { LucideIcon } from "lucide-react";

// ============================================================================
// SHARED TYPE DEFINITIONS
// ============================================================================

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  delayMs: number;
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
  duration?: string;
  url: string;
  uploadedAt?: string;
  size?: string;
  isUploaded?: boolean;
}

export interface VideoItem {
  id: number;
  title: string;
  image: string;
  videoUrl: string;
  uploadedAt?: string;
  size?: string;
  isUploaded?: boolean;
}
