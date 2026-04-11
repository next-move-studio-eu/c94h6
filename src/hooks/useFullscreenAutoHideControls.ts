import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

interface UseFullscreenAutoHideControlsOptions {
  enabled: boolean;
  containerRef: RefObject<HTMLElement | null>;
  pauseRef?: RefObject<HTMLElement | null>;
  hideDelayMs?: number;
}

export function useFullscreenAutoHideControls({
  enabled,
  containerRef,
  pauseRef,
  hideDelayMs = 2500,
}: UseFullscreenAutoHideControlsOptions) {
  const [showControls, setShowControls] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) {
      setShowControls(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const resetTimeout = () => {
      setShowControls(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setShowControls(false);
        timeoutRef.current = null;
      }, hideDelayMs);
    };

    const pauseAutoHide = () => {
      setShowControls(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const container = containerRef.current;
    const pauseElement = pauseRef?.current ?? null;

    container.addEventListener('mousemove', resetTimeout);
    container.addEventListener('mousedown', resetTimeout);
    container.addEventListener('keydown', resetTimeout);
    container.addEventListener('touchstart', resetTimeout);

    if (pauseElement) {
      pauseElement.addEventListener('mouseenter', pauseAutoHide);
      pauseElement.addEventListener('mouseleave', resetTimeout);
    }

    resetTimeout();

    return () => {
      container.removeEventListener('mousemove', resetTimeout);
      container.removeEventListener('mousedown', resetTimeout);
      container.removeEventListener('keydown', resetTimeout);
      container.removeEventListener('touchstart', resetTimeout);

      if (pauseElement) {
        pauseElement.removeEventListener('mouseenter', pauseAutoHide);
        pauseElement.removeEventListener('mouseleave', resetTimeout);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, containerRef, pauseRef, hideDelayMs]);

  return { showControls, setShowControls };
}
