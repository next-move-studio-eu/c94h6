import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface PlayAgainstEngineProps {
  fen?: string;
  playWithWhite?: boolean;
  onNavigate?: (fen: string, playWithWhite: boolean) => void;
  /** When 'preview' (article editor preview), button shows popup instead of navigating. */
  variant?: 'preview' | 'detail';
}

export default function PlayAgainstEngine({
  fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  playWithWhite = true,
  onNavigate,
  variant = 'detail',
}: PlayAgainstEngineProps) {
  const { t, i18n } = useTranslation('articleBlocks');
  const navigate = useNavigate();
  const params = useParams<{ lang?: string }>();
  const lang = params.lang || i18n.language;
  const isPreview = variant === 'preview';
  const [showPopup, setShowPopup] = useState(false);

  const handleClick = () => {
    if (isPreview) {
      setShowPopup(true);
      return;
    }
    if (onNavigate) {
      onNavigate(fen, playWithWhite);
    } else {
      const encodedFen = encodeURIComponent(fen);
      const playWithWhiteParam = playWithWhite ? 'true' : 'false';
      navigate(`/${lang}/chess/play-engine?fen=${encodedFen}&playWithWhite=${playWithWhiteParam}`);
    }
  };

  const buttonText = playWithWhite
    ? t('playEngine.playAsWhite')
    : t('playEngine.playAsBlack');

  return (
    <div className="flex justify-center my-8 relative">
      <button
        type="button"
        onClick={handleClick}
        className="btn-filled w-full max-w-md"
      >
        {buttonText}
      </button>
      {isPreview && showPopup && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'var(--modalOverlay)' }}
            aria-hidden
            onClick={() => setShowPopup(false)}
          />
          <div
            className="surface-container-high fixed left-1/2 top-1/2 z-50 w-[min(90vw,320px)] -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="play-engine-popup-title"
          >
            <p id="play-engine-popup-title" className="mb-4 text-sm font-medium">
              {t('playEngine.notAvailableInEditor')}
            </p>
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="btn-text"
            >
              {t('common.ok')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
