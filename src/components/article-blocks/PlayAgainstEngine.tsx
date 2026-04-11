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
        className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors w-full max-w-md cursor-pointer hover:opacity-90 border-0"
        style={{
          backgroundColor: `var(--primary)`,
          color: `var(--onPrimary)`,
        }}
      >
        {buttonText}
      </button>
      {isPreview && showPopup && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            aria-hidden
            onClick={() => setShowPopup(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,320px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 p-4 shadow-lg"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surfaceHigh)',
              color: 'var(--text)',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="play-engine-popup-title"
          >
            <p id="play-engine-popup-title" className="text-sm font-medium mb-4">
              {t('playEngine.notAvailableInEditor')}
            </p>
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="rounded-lg px-4 py-2 text-sm font-semibold border-0 cursor-pointer hover:opacity-90"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--onPrimary)',
              }}
            >
              {t('common.ok')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
