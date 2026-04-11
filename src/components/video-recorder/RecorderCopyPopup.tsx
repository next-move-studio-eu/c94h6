import { motion } from 'framer-motion';
import type { RecorderCopyPopupActions } from './types';

interface RecorderCopyPopupProps extends RecorderCopyPopupActions {
  diagramJsonLabel: string;
  playAsWhiteLabel: string;
  playAsBlackLabel: string;
  fenOnlyLabel: string;
  closeLabel: string;
}

export default function RecorderCopyPopup({
  isCopyPopupOpen,
  onClose,
  onCopyDiagramJson,
  onCopyPlayEngineJson,
  onCopyFenOnly,
  diagramJsonLabel,
  playAsWhiteLabel,
  playAsBlackLabel,
  fenOnlyLabel,
  closeLabel,
}: RecorderCopyPopupProps) {
  if (!isCopyPopupOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--overlay)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl p-4 space-y-2"
        style={{ backgroundColor: 'var(--surface)', boxShadow: 'var(--shadowSm)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <PopupButton label={diagramJsonLabel} onClick={onCopyDiagramJson} />
        <PopupButton label={playAsWhiteLabel} onClick={() => onCopyPlayEngineJson(true)} />
        <PopupButton label={playAsBlackLabel} onClick={() => onCopyPlayEngineJson(false)} />
        <PopupButton label={fenOnlyLabel} onClick={onCopyFenOnly} />

        <motion.button
          onClick={onClose}
          className="w-full px-3 py-2 text-sm rounded hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--border)', color: 'var(--text)' }}
          whileTap={{ scale: 0.99 }}
        >
          {closeLabel}
        </motion.button>
      </div>
    </div>
  );
}

function PopupButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void | Promise<void>;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full px-3 py-2 text-left text-sm rounded hover:opacity-90 transition-opacity"
      style={{ backgroundColor: 'var(--surfaceHigh)', color: 'var(--text)' }}
      whileTap={{ scale: 0.99 }}
    >
      {label}
    </motion.button>
  );
}
