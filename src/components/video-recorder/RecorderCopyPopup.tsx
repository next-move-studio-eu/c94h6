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
        className="w-full max-w-md rounded-[1.75rem] p-6 space-y-2 surface-container-high"
        onClick={(event) => event.stopPropagation()}
      >
        <PopupButton label={diagramJsonLabel} onClick={onCopyDiagramJson} />
        <PopupButton label={playAsWhiteLabel} onClick={() => onCopyPlayEngineJson(true)} />
        <PopupButton label={playAsBlackLabel} onClick={() => onCopyPlayEngineJson(false)} />
        <PopupButton label={fenOnlyLabel} onClick={onCopyFenOnly} />

        <motion.button
          onClick={onClose}
          className="btn-text w-full"
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
      className="btn-tonal w-full justify-start"
      whileTap={{ scale: 0.99 }}
    >
      {label}
    </motion.button>
  );
}
