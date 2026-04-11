import { useEffect, useState } from 'react';

const POPUP_WIDTH = 120;
const POPUP_HEIGHT = 80;
const GAP_ABOVE_CURSOR = 12;

interface ImagePreviewRowProps {
  label: string;
  blob: Blob;
  onRemove?: () => void;
  removeLabel?: string;
}

export function ImagePreviewRow({ label, blob, onRemove, removeLabel }: ImagePreviewRowProps) {
  const [hover, setHover] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return (
    <li
      className="relative flex items-center justify-between"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseMove={(event) => setMouse({ x: event.clientX, y: event.clientY })}
    >
      <span className="cursor-default">{label}</span>
      {hover && objectUrl && (
        <div
          className="pointer-events-none fixed z-[100] rounded border border-[var(--border)] bg-[var(--surface)] p-0.5 shadow-lg"
          style={{
            width: POPUP_WIDTH,
            height: POPUP_HEIGHT,
            left: mouse.x - POPUP_WIDTH / 2,
            top: mouse.y - POPUP_HEIGHT - GAP_ABOVE_CURSOR,
          }}
        >
          <img
            src={objectUrl}
            alt=""
            className="h-full w-full object-contain"
            style={{ maxWidth: POPUP_WIDTH - 4, maxHeight: POPUP_HEIGHT - 4 }}
          />
        </div>
      )}
      {onRemove && removeLabel && (
        <button
          type="button"
          onClick={onRemove}
          className="text-[var(--error)] hover:underline"
        >
          {removeLabel}
        </button>
      )}
    </li>
  );
}
