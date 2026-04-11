import type { TFunction } from 'i18next';
import type { RefObject } from 'react';

export type PhotoArticleVariant = 'preview' | 'detail';

export interface PhotoArticleProps {
  id: string;
  caption?: string;
  /** Smaller layout in article editor preview; default is full inline size. */
  variant?: PhotoArticleVariant;
}

export interface PhotoArticleViewProps {
  variant?: PhotoArticleVariant;
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
