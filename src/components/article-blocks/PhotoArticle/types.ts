import type { TFunction } from 'i18next';
import type { RefObject } from 'react';

export interface PhotoArticleProps {
  id: string;
  caption?: string;
}

export interface PhotoArticleViewProps {
  caption?: string;
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
  imageLoaded: boolean;
  showFullscreenIcon: boolean;
  imageContainerRef: RefObject<HTMLDivElement>;
  fullscreenRef: RefObject<HTMLDivElement>;
  onInlineMouseEnter: () => void;
  onInlineMouseLeave: () => void;
  onFullscreenToggle: () => void;
  onImageLoad: () => void;
  onImageError: () => void;
  t: TFunction<'articleBlocks', undefined>;
}
