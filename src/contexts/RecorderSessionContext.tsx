import { createContext, useContext, useMemo, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { DEFAULT_FEN } from '../types/articleEditor';
import type { PgnViewerSelection } from '../components/PgnViewer';

interface RecorderSessionContextValue {
  pgn: string;
  setPgn: Dispatch<SetStateAction<string>>;
  fen: string;
  setFen: Dispatch<SetStateAction<string>>;
  highlights: string;
  setHighlights: Dispatch<SetStateAction<string>>;
  lookingOnWhite: boolean;
  setLookingOnWhite: Dispatch<SetStateAction<boolean>>;
  pgnSelection: PgnViewerSelection | null;
  setPgnSelection: Dispatch<SetStateAction<PgnViewerSelection | null>>;
}

const RecorderSessionContext = createContext<RecorderSessionContextValue | null>(null);

export function RecorderSessionProvider({ children }: { children: ReactNode }) {
  const [pgn, setPgn] = useState<string>('');
  const [fen, setFen] = useState<string>(DEFAULT_FEN);
  const [highlights, setHighlights] = useState<string>('');
  const [lookingOnWhite, setLookingOnWhite] = useState<boolean>(true);
  const [pgnSelection, setPgnSelection] = useState<PgnViewerSelection | null>(null);

  const value = useMemo(
    () => ({ pgn, setPgn, fen, setFen, highlights, setHighlights, lookingOnWhite, setLookingOnWhite, pgnSelection, setPgnSelection }),
    [pgn, fen, highlights, lookingOnWhite, pgnSelection]
  );

  return <RecorderSessionContext.Provider value={value}>{children}</RecorderSessionContext.Provider>;
}

export function useRecorderSession() {
  const ctx = useContext(RecorderSessionContext);
  if (!ctx) {
    throw new Error('useRecorderSession must be used within RecorderSessionProvider');
  }
  return ctx;
}
