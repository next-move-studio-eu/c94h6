import { useState, useEffect, useLayoutEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { Chess } from '@jackstenglein/chess';

export interface PositionChangeEvent {
  fen: string;
  moveNumber: number;
  moveIndex: number; // Index in the move list (0 = initial position)
  isInitialPosition: boolean;
  gameIndex: number;
}

export type PositionChangeListener = (event: PositionChangeEvent) => void;

export type ReplayMovesAction = 'back' | 'forward-main' | 'forward-select';

export interface PgnViewerRef {
  handleBack: () => void;
  handleForwardMain: () => void;
  handleForwardSelect: () => void;
}

export interface PgnViewerTexts {
  vs?: string; // " vs " separator between players
  study?: string; // "Study: " prefix
  fenPosition?: string; // "FEN Position"
  game?: string; // "Game" fallback
  selectMove?: string; // "Select move:" in variation popover
  main?: string; // "(main)" label for main line
  comment?: string; // "Comment" aria-label
  previousGame?: string; // "Previous game" aria-label
  nextGame?: string; // "Next game" aria-label
  loadPgn?: string; // "Load PGN" button text
  loadPgnError?: string; // Shown when PGN parse fails
  loadPgnNoGames?: string; // Shown when no games found in file
}

export interface PgnViewerProps {
  pgn?: string;
  showLoadButton?: boolean;
  onPositionChange?: PositionChangeListener;
  onPgnLoad?: (pgn: string) => void; // Callback when user loads PGN file
  initialSelection?: PgnViewerSelection | null;
  onSelectionChange?: (selection: PgnViewerSelection | null) => void;
  forwardSelectButtonRef?: React.RefObject<HTMLButtonElement> | null; // Ref to the forward-select button for popover positioning
  texts?: PgnViewerTexts;
  translateMove?: (san: string) => string; // Function to translate move notation (e.g., Q -> D for Czech)
}

export interface PgnViewerSelection {
  gameIndex: number;
  moveIndex: number;
  fen: string;
  isInitialPosition: boolean;
}

interface GameTree {
  chess: Chess;
  headers: Record<string, string>;
  initialFen: string;
}

// Move data structure for the move list
export interface Move {
  san: string;
  number: number;
  fen: string;
  comment?: string;
  variations: Move[][]; // Array of variation arrays
  moveNode: any; // Reference to the chess library move node
}

const INITIAL_POSITION_MARKER = '---';

const findMoveNodeByFen = (moves: Move[], targetFen: string): any | null => {
  for (const move of moves) {
    if (move.fen === targetFen) return move.moveNode;
    for (const variation of move.variations) {
      const foundInVariation = findMoveNodeByFen(variation, targetFen);
      if (foundInVariation) return foundInVariation;
    }
  }
  return null;
};

const getMoveNodeByIndex = (moves: Move[], targetIndex: number): any | null => {
  if (targetIndex <= 0) return null;
  let currentIndex = 0;

  const walk = (branch: Move[]): any | null => {
    for (const move of branch) {
      currentIndex += 1;
      if (currentIndex === targetIndex) return move.moveNode;
      for (const variation of move.variations) {
        const found = walk(variation);
        if (found) return found;
      }
    }
    return null;
  };

  return walk(moves);
};

const getMoveIndexByNode = (moves: Move[], targetNode: any): number => {
  if (!targetNode) return 0;
  let currentIndex = 0;
  let foundIndex = 0;

  const walk = (branch: Move[]) => {
    for (const move of branch) {
      currentIndex += 1;
      if (move.moveNode === targetNode) {
        foundIndex = currentIndex;
        return true;
      }
      for (const variation of move.variations) {
        if (walk(variation)) return true;
      }
    }
    return false;
  };

  walk(moves);
  return foundIndex;
};

/**
 * Oddělí partie podle výsledku a začátku dalšího bloku tagů.
 * Prázdný řádek mezi hlavičkou a tahovnicí není hranice partie (na rozdíl od split na \\n\\n).
 */
const splitPgnIntoRawGames = (pgnText: string): string[] => {
  const text = pgnText.trim();
  if (!text) return [];
  const gameBoundaryPattern = /(1-0|0-1|1\/2-1\/2|\*)\s*\n\s*(?=\[)/g;
  const boundaries: number[] = [0];
  let match: RegExpExecArray | null;
  while ((match = gameBoundaryPattern.exec(text)) !== null) {
    const afterResult = match.index + match[0].length;
    const headerStart = text.indexOf('[', afterResult);
    if (headerStart !== -1) boundaries.push(headerStart);
  }
  boundaries.push(text.length);
  const chunks: string[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const chunk = text.substring(boundaries[i], boundaries[i + 1]).trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks;
};

/**
 * Normalize PGN – tolerantní vůči špatnýmu exportu (např. zalomení uprostřed tahu).
 * Zpracovává každou partii samostatně. Mezi tagy a tahovnicí je prázdný řádek (požadavek parseru).
 * Mezery uvnitř hlavičkových řádků se nemění; mezery v tahovnici se po spojení řádků zjednoduší.
 */
export const normalizePgn = (raw: string): string => {
  if (!raw?.trim()) return raw;

  const text = raw.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const games = splitPgnIntoRawGames(text);

  const normalized = games.map((game) => {
    const lines = game.split('\n').map((line) => line.replace(/[ \t]+$/g, ''));
    const tagLines: string[] = [];
    const movetextLines: string[] = [];
    let inMovetext = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!inMovetext && trimmed.startsWith('[')) {
        tagLines.push(trimmed);
      } else if (trimmed) {
        inMovetext = true;
        movetextLines.push(trimmed);
      }
    }

    const tags = tagLines.join('\n');
    let movetext = movetextLines.join(' ');
    if (movetext) {
      movetext = movetext.replace(/[ \t]{2,}/g, ' ');
    }

    if (!movetext) return tags;
    if (!tags) return movetext;
    return `${tags}\n\n${movetext}`;
  });

  return normalized.filter(Boolean).join('\n\n');
};

// Build move tree from chess game instance - entry point
// Exported for testing purposes
export const buildMoveTree = (chess: Chess, initialFen: string): Move[] => {
  // Always start from initial position
  chess.seek(null);
  
  // Get the very first move node(s)
  const firstMoveNode = chess.nextMove() as any;
  
  if (!firstMoveNode) {
    return [];
  }

  // Delegate to the recursive builder
  const tree = buildMoveTreeFromNode(chess, firstMoveNode, initialFen);

  // Restore position to start or wherever it was
  chess.seek(null);
  
  return tree;
};

// Build move tree from a specific node (handles main line + variations)
// Exported for testing purposes
export const buildMoveTreeFromNode = (chess: Chess, startMove: any, initialFen: string): Move[] => {
  const moves: Move[] = [];
  let moveNode = startMove;
  
  // Keep track of visited nodes in this branch to prevent cycles
  const visitedInBranch = new Set<any>();
  
  while (moveNode && !visitedInBranch.has(moveNode)) {
    visitedInBranch.add(moveNode);
    
    // 1. Sync the chess instance to this node to get the correct FEN
    chess.seek(moveNode);
    const fen = chess.fen();
    const commentAfter = (moveNode as any).commentAfter || undefined;
    // Use ply from the chess library (0-indexed from start), convert to 1-indexed move number
    const ply = (moveNode as any).ply ?? 0;
    const moveNumber = ply > 0 ? ply : 0;
    
    // 2. Main line continuation is in moveNode.next, variations are in moveNode.variations
    // The @jackstenglein/chess library stores variations as an array of arrays (each variation is an array of moves)
    const mainLineNext = (moveNode as any).next || null;
    // Access variations array - this contains all variation branches (each variation is an array of move nodes)
    const variationBranches = Array.isArray((moveNode as any).variations) 
      ? (moveNode as any).variations 
      : [];
    
    // 3. Process Variations recursively - CRITICAL: variations can have nested variations
    const variations: Move[][] = [];
    if (variationBranches.length > 0) {
      // Save current position to restore later
      const currentPosition = moveNode;
      const parent = moveNode.parent;
      
      // Process each variation branch
      for (const variationBranch of variationBranches) {
        // Each variation branch is an array of move nodes - get the first move to start the variation
        if (Array.isArray(variationBranch) && variationBranch.length > 0) {
          const firstVariationMove = variationBranch[0];
          
          // To build a variation branch, we must start from the parent position
          // This ensures the variation starts from the correct board state
          chess.seek(parent || null);
          
          // Recursively build the variation branch - this will handle nested variations
          // because buildMoveTreeFromNode processes each move and its variations
          const builtVariationBranch = buildMoveTreeFromNode(chess, firstVariationMove, initialFen);
          
          if (builtVariationBranch.length > 0) {
            variations.push(builtVariationBranch);
          }
        }
      }
      
      // Restore to the current move node after processing all variations
      chess.seek(currentPosition);
    }
    
    // 4. Add the move to our list with its variations
    // Note: The recursive call above ensures that moves within variation branches
    // also have their own variations processed correctly
    moves.push({
      san: moveNode.san,
      number: moveNumber,
      fen,
      comment: commentAfter,
      variations,
      moveNode: moveNode
    });
    
    // 5. Advance to the next move in the main line via moveNode.next
    moveNode = mainLineNext;
  }
  
  return moves;
};

// Split and parse a single PGN string (raw or normalized) into games
const parsePgnString = (pgnText: string): GameTree[] => {
  const games: GameTree[] = [];
  const chunks = splitPgnIntoRawGames(pgnText);

  for (const gameText of chunks) {
    try {
      const game = parseSingleGame(gameText);
      if (game) games.push(game);
    } catch (error) {
      console.error('Error parsing game:', error);
    }
  }

  if (games.length === 0) {
    try {
      const game = parseSingleGame(pgnText.trim());
      if (game) games.push(game);
    } catch (error) {
      console.error('Error parsing PGN as single game:', error);
    }
  }
  return games;
};

// Parse PGN string into games – vždy po normalizaci (jednotný vstup pro parser).
const parsePgn = (pgn: string): GameTree[] => {
  if (!pgn || !pgn.trim()) return [];
  return parsePgnString(normalizePgn(pgn.trim()));
};

// Parse a single game from PGN text using @jackstenglein/chess
const parseSingleGame = (pgnText: string): GameTree | null => {
  try {
    const chess = new Chess();
    chess.loadPgn(pgnText);
    
    // Extract headers
    const headers: Record<string, string> = {};
    const headerLines = pgnText.match(/\[(\w+)\s+"([^"]+)"\]/g) || [];
    for (const line of headerLines) {
      const match = line.match(/\[(\w+)\s+"([^"]+)"\]/);
      if (match) {
        headers[match[1]] = match[2];
      }
    }
    
    // Get initial FEN - reset to start to get initial position
    chess.seek(null);
    const initialFen = headers['FEN'] || chess.fen();
    
    return {
      chess,
      headers,
      initialFen
    };
  } catch (error) {
    console.error('Error loading PGN with @jackstenglein/chess:', error);
    return null;
  }
};

// Mini board component for initial position (kept for future use - currently unused)
// const MiniBoard = ({ fen }: { fen: string }) => {
//   ... implementation kept for future use
// };

// Get Unicode symbol for piece (kept for future use - currently unused)
// const getPieceSymbol = (piece: string): string => {
//   const symbols: Record<string, string> = {
//     'P': '♙', 'p': '♟',
//     'R': '♖', 'r': '♜',
//     'N': '♘', 'n': '♞',
//     'B': '♗', 'b': '♝',
//     'Q': '♕', 'q': '♛',
//     'K': '♔', 'k': '♚'
//   };
//   return symbols[piece] || '';
// };

// Format game header for display
const formatGameHeader = (game: GameTree, texts: PgnViewerTexts): string => {
  const white = game.headers['White'] || '';
  const black = game.headers['Black'] || '';
  const whiteElo = game.headers['WhiteElo'] || '';
  const blackElo = game.headers['BlackElo'] || '';
  const title = game.headers['Title'] || game.headers['Event'] || '';
  const hasPlayers = white && black;
  const hasOnlyWhite = white && !black;
  const hasTitle = title && !hasPlayers;
  const hasFen = !!game.initialFen && game.initialFen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  if (hasPlayers) {
    // Format: "White vs Black" or "White (ELO) vs Black (ELO)"
    let whitePart = white;
    if (whiteElo) {
      whitePart += ` (${whiteElo})`;
    }
    let blackPart = black;
    if (blackElo) {
      blackPart += ` (${blackElo})`;
    }
    const vsText = texts.vs || ' vs ';
    return `${whitePart}${vsText}${blackPart}`;
  } else if (hasOnlyWhite) {
    // Format: "White" or "White (ELO)"
    if (whiteElo) {
      return `${white} (${whiteElo})`;
    }
    return white;
  } else if (hasTitle) {
    // Format: "Study: Title"
    const studyText = texts.study || 'Study: ';
    return `${studyText}${title}`;
  } else if (hasFen) {
    // Format: "FEN Position"
    return texts.fenPosition || 'FEN Position';
  } else {
    // Fallback: "Game"
    return texts.game || 'Game';
  }
};

// Variation Popover Component
const VariationPopover = ({
  main,
  variations,
  onSelect,
  translateMove,
  texts,
  onClose,
  buttonElement
}: {
  main: string | null;
  variations: string[];
  onSelect: (variation: string) => void;
  translateMove?: (san: string) => string;
  texts: PgnViewerTexts;
  onClose: () => void;
  buttonElement: HTMLButtonElement | null;
}) => {
  const allMoves = main ? [main, ...variations] : variations;
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // Place below (or above if clipped), centered on the button, clamped to the viewport
  useLayoutEffect(() => {
    if (!buttonElement) {
      setPosition(null);
      return;
    }

    const margin = 8;
    const gap = 8;

    const updatePosition = () => {
      const rect = buttonElement.getBoundingClientRect();
      const popoverWidth = popoverRef.current?.offsetWidth ?? 200;
      const popoverHeight = popoverRef.current?.offsetHeight ?? 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let top = rect.bottom + gap;
      if (popoverHeight > 0 && top + popoverHeight > vh - margin) {
        top = rect.top - gap - popoverHeight;
      }
      if (popoverHeight > 0) {
        top = Math.max(margin, Math.min(top, vh - popoverHeight - margin));
      }

      let left = rect.left + rect.width / 2 - popoverWidth / 2;
      left = Math.max(margin, Math.min(left, vw - popoverWidth - margin));

      setPosition({ top, left });
    };

    updatePosition();
    // Remeasure after paint once the popover has real dimensions
    const frameId = requestAnimationFrame(updatePosition);

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [buttonElement, allMoves.length]);

  if (!buttonElement) return null;

  return (
    <div
      ref={popoverRef}
      className="variation-popover fixed z-[9999] bg-[var(--surface)] border border-[var(--primary)] rounded-lg shadow-lg p-2 min-w-[200px]"
      style={{
        top: `${position?.top ?? 0}px`,
        left: `${position?.left ?? 0}px`,
        visibility: position ? 'visible' : 'hidden',
      }}
    >
      <div className="text-xs text-[var(--textSecondary)] mb-2 px-2">
        {texts.selectMove || 'Select move:'}
      </div>
      <div className="space-y-1">
        {allMoves.map((move, index) => {
          const displayMove = translateMove ? translateMove(move) : move;
          return (
            <button
              key={index}
              onClick={() => {
                onSelect(move);
                onClose();
              }}
              className="w-full text-left px-3 py-2 rounded hover:bg-[var(--primary)]/20 text-sm text-[var(--text)] transition-colors"
            >
              {displayMove}
              {index === 0 && main && variations.length > 0 && (
                <span className="text-[var(--textSecondary)] ml-2 text-xs">
                  {texts.main ? `(${texts.main})` : '(main)'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Recursive MoveList component - handles main line, variations, and nested subvariations
const MoveList = ({
  moves,
  currentMoveNode,
  onMoveClick,
  translateMove,
  texts,
  isVariation = false,
  variationDepth = 0
}: {
  moves: Move[];
  currentMoveNode: any;
  onMoveClick: (moveNode: any) => void;
  translateMove?: (san: string) => string;
  texts: PgnViewerTexts;
  isVariation?: boolean;
  variationDepth?: number;
}) => {
  if (moves.length === 0) return null;
  
  return (
    <span className={`flex flex-wrap items-baseline gap-1 ${isVariation ? 'italic text-[var(--textSecondary)]' : ''}`}>
      {isVariation && <span className="text-[var(--textSecondary)]">(</span>}
      {moves.map((move, index) => {
        const isActive = currentMoveNode === move.moveNode;
        // Move numbers: 1 = white's first move, 2 = black's first move, 3 = white's second, etc.
        // moveNumber should be 1-indexed from the chess library
        const isWhiteMove = move.number % 2 === 1;
        const movePairNumber = Math.ceil(move.number / 2);
        
        // Only show move number if it's valid (> 0) and it's a white move, or it's the first black move in a sequence
        const showMoveNumber = move.number > 0 && (isWhiteMove || (!isWhiteMove && index === 0 && movePairNumber > 0));
        
        return (
          <span key={index} className="inline-flex items-baseline gap-1 flex-wrap">
            {showMoveNumber && isWhiteMove && (
              <span className="text-[var(--textSecondary)] font-medium">{movePairNumber}.</span>
            )}
            {showMoveNumber && !isWhiteMove && index === 0 && (
              <span className="text-[var(--textSecondary)] font-medium">{movePairNumber}...</span>
            )}
            <button
              onClick={() => onMoveClick(move.moveNode)}
              className={`
                px-1.5 py-0.5 rounded transition-colors
                ${isActive
                  ? 'bg-[var(--primary)] text-[var(--onPrimary)] font-semibold'
                  : 'hover:bg-[var(--primary)]/20 text-[var(--text)]'
                }
                ${isVariation ? 'italic' : ''}
              `}
            >
              {translateMove ? translateMove(move.san) : move.san}
            </button>
            {move.comment && (
              <span 
                className="text-[var(--textSecondary)] text-xs italic ml-1.5 select-none pointer-events-none opacity-75"
                aria-label={texts.comment || 'Comment'}
              >
                {move.comment}
              </span>
            )}
            {/* Render all variations of this move - these can be nested subvariations */}
            {move.variations && move.variations.length > 0 && (
              <>
                {move.variations.map((variation, varIndex) => (
                  <MoveList
                    key={`var-${varIndex}`}
                    moves={variation}
                    currentMoveNode={currentMoveNode}
                    onMoveClick={onMoveClick}
                    translateMove={translateMove}
                    texts={texts}
                    isVariation={true}
                    variationDepth={variationDepth + 1}
                  />
                ))}
              </>
            )}
          </span>
        );
      })}
      {isVariation && <span className="text-[var(--textSecondary)]">)</span>}
    </span>
  );
};

const PgnViewer = forwardRef<PgnViewerRef, PgnViewerProps>(({
  pgn,
  showLoadButton = false,
  onPositionChange,
  onPgnLoad,
  initialSelection,
  onSelectionChange,
  forwardSelectButtonRef,
  texts = {},
  translateMove
}, ref) => {
  const [games, setGames] = useState<GameTree[]>([]);
  const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null);
  const [currentMoveNode, setCurrentMoveNode] = useState<any>(null); // Track current move node for highlighting
  const [moveTree, setMoveTree] = useState<Move[]>([]); // Move tree for display
  const [showVariationPopover, setShowVariationPopover] = useState(false);
  const [positionListeners] = useState<Set<PositionChangeListener>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  // texts is often an inline object from parents; keep out of parse effect deps to avoid resetting game index every render
  const textsRef = useRef(texts);
  textsRef.current = texts;
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;
  const initialSelectionRef = useRef(initialSelection);
  initialSelectionRef.current = initialSelection;

  // Register/unregister position change listeners
  useEffect(() => {
    if (onPositionChange) {
      positionListeners.add(onPositionChange);
      return () => {
        positionListeners.delete(onPositionChange);
      };
    }
  }, [onPositionChange, positionListeners]);

  // Emit position change event
  const emitPositionChange = useCallback((event: PositionChangeEvent) => {
    positionListeners.forEach(listener => listener(event));
  }, [positionListeners]);

  // Parse PGN when it changes
  useEffect(() => {
    if (pgn) {
      try {
        const parsedGames = parsePgn(pgn);
        setGames(parsedGames);
        if (parsedGames.length > 0) {
          const selection = initialSelectionRef.current;
          const preferredGameIndex =
            selection &&
            selection.gameIndex >= 0 &&
            selection.gameIndex < parsedGames.length
              ? selection.gameIndex
              : 0;
          setSelectedGameIndex(preferredGameIndex);
          setCurrentMoveNode(null);
          // Reset to initial position
          const game = parsedGames[preferredGameIndex];
          game.chess.seek(null);
          // Build move tree
          const tree = buildMoveTree(game.chess, game.initialFen);
          setMoveTree(tree);
          const initialEvent: PositionChangeEvent = {
            fen: game.initialFen,
            moveNumber: 0,
            moveIndex: 0,
            isInitialPosition: true,
            gameIndex: preferredGameIndex
          };
          emitPositionChange(initialEvent);
          if (onSelectionChangeRef.current) {
            onSelectionChangeRef.current({
              gameIndex: preferredGameIndex,
              moveIndex: 0,
              fen: game.initialFen,
              isInitialPosition: true,
            });
          }
          if (
            selection &&
            selection.gameIndex === preferredGameIndex &&
            !selection.isInitialPosition
          ) {
            const restoredMoveNode =
              typeof selection.moveIndex === 'number' && selection.moveIndex > 0
                ? getMoveNodeByIndex(tree, selection.moveIndex)
                : findMoveNodeByFen(tree, selection.fen);
            if (restoredMoveNode) {
              game.chess.seek(restoredMoveNode);
              setCurrentMoveNode(restoredMoveNode);
              const restoredMoveIndex = getMoveIndexByNode(tree, restoredMoveNode);
              const restoredEvent: PositionChangeEvent = {
                fen: game.chess.fen(),
                moveNumber: restoredMoveNode.moveNumber || 0,
                moveIndex: restoredMoveIndex,
                isInitialPosition: false,
                gameIndex: preferredGameIndex,
              };
              emitPositionChange(restoredEvent);
              if (onSelectionChangeRef.current) {
                onSelectionChangeRef.current({
                  gameIndex: preferredGameIndex,
                  moveIndex: restoredEvent.moveIndex,
                  fen: restoredEvent.fen,
                  isInitialPosition: false,
                });
              }
            }
          }
        } else {
          const msg = textsRef.current?.loadPgnNoGames ?? 'No games found in the PGN file.';
          window.alert(msg);
        }
      } catch (error) {
        console.error('Error parsing PGN:', error);
        setGames([]);
        setSelectedGameIndex(null);
        setMoveTree([]);
        const msg = textsRef.current?.loadPgnError ?? 'Could not load PGN. The file may be invalid or in an unsupported format.';
        window.alert(msg);
      }
    } else {
      setGames([]);
      setSelectedGameIndex(null);
      setCurrentMoveNode(null);
      setMoveTree([]);
    }
  }, [pgn, emitPositionChange]);

  // Get current game
  const currentGame = selectedGameIndex !== null ? games[selectedGameIndex] : null;
  
  // Get current move/node from chess instance
  const getCurrentMove = useCallback(() => {
    if (!currentGame) return null;
    return currentGame.chess.currentMove() as any;
  }, [currentGame]);

  // Get available moves (main line and variations)
  const getAvailableMoves = useCallback(() => {
    if (!currentGame) return { main: null, variations: [] };
    
    const move = getCurrentMove();
    if (!move) {
      // At initial position, get first move and check for variations
      const firstMove = currentGame.chess.nextMove() as any;
      if (firstMove) {
        // Check for variations on the first move (same logic as buildMoveTreeFromNode)
        const variationBranches = Array.isArray((firstMove as any).variations) 
          ? (firstMove as any).variations 
          : [];
        const variations = variationBranches
          .filter((branch: any) => Array.isArray(branch) && branch.length > 0)
          .map((branch: any) => branch[0].san);
        return { main: firstMove.san, variations };
      }
      return { main: null, variations: [] };
    }
    
    // Main line continuation is in moveNode.next
    const nextMove = (move as any).next;
    const mainMove = nextMove?.san || null;
    
    // Variations are stored on the NEXT move node, not the current one!
    // This is because variations are alternatives to the main line continuation
    // e.g., at position after 1...e5, variations are on 2.Nf3, not on 1...e5
    const variationBranches = nextMove && Array.isArray((nextMove as any).variations) 
      ? (nextMove as any).variations 
      : [];
    const variations = variationBranches
      .filter((branch: any) => Array.isArray(branch) && branch.length > 0)
      .map((branch: any) => branch[0].san);
    
    return { main: mainMove, variations };
  }, [currentGame, getCurrentMove]);

  // Handle game selection
  const handleGameSelect = useCallback((index: number) => {
    setSelectedGameIndex(index);
    setCurrentMoveNode(null);
    const game = games[index];
    if (game) {
      game.chess.seek(null);
      // Build move tree
      const tree = buildMoveTree(game.chess, game.initialFen);
      setMoveTree(tree);
      emitPositionChange({
        fen: game.initialFen,
        moveNumber: 0,
        moveIndex: 0,
        isInitialPosition: true,
        gameIndex: index
      });
      if (onSelectionChangeRef.current) {
        onSelectionChangeRef.current({
          gameIndex: index,
          moveIndex: 0,
          fen: game.initialFen,
          isInitialPosition: true,
        });
      }
    }
  }, [games, emitPositionChange, onSelectionChange]);

  // Handle previous game
  const handlePreviousGame = useCallback(() => {
    if (selectedGameIndex !== null && selectedGameIndex > 0) {
      handleGameSelect(selectedGameIndex - 1);
    }
  }, [selectedGameIndex, handleGameSelect]);

  // Handle next game
  const handleNextGame = useCallback(() => {
    if (selectedGameIndex !== null && selectedGameIndex < games.length - 1) {
      handleGameSelect(selectedGameIndex + 1);
    }
  }, [selectedGameIndex, games.length, handleGameSelect]);

  const canGoToPreviousGame = selectedGameIndex !== null && selectedGameIndex > 0;
  const canGoToNextGame = selectedGameIndex !== null && selectedGameIndex < games.length - 1;

  // Navigate to a specific move node
  const navigateToMoveNode = useCallback((moveNode: any | null) => {
    if (!currentGame) return;
    
    if (moveNode === null) {
      // Go to initial position
      currentGame.chess.seek(null);
      setCurrentMoveNode(null);
      emitPositionChange({
        fen: currentGame.initialFen,
        moveNumber: 0,
        moveIndex: 0,
        isInitialPosition: true,
        gameIndex: selectedGameIndex!
      });
      if (onSelectionChangeRef.current) {
        onSelectionChangeRef.current({
          gameIndex: selectedGameIndex!,
          moveIndex: 0,
          fen: currentGame.initialFen,
          isInitialPosition: true,
        });
      }
    } else {
      // Navigate to the move node
      currentGame.chess.seek(moveNode);
      setCurrentMoveNode(moveNode);
      const fen = currentGame.chess.fen();
      const moveNumber = moveNode.moveNumber || 0;
      const moveIndex = getMoveIndexByNode(moveTree, moveNode);
      emitPositionChange({
        fen,
        moveNumber,
        moveIndex,
        isInitialPosition: false,
        gameIndex: selectedGameIndex!
      });
      if (onSelectionChangeRef.current) {
        onSelectionChangeRef.current({
          gameIndex: selectedGameIndex!,
          moveIndex,
          fen,
          isInitialPosition: false,
        });
      }
    }
  }, [currentGame, selectedGameIndex, emitPositionChange, moveTree]);


  // Navigation handlers
  const handleBackwards = useCallback(() => {
    if (!currentGame) return;
    
    // Get the current move from the chess instance to ensure we have the correct node
    const move = getCurrentMove();
    
    if (move && (move as any).previous) {
      // Go to previous move (one ply backwards)
      const previous = (move as any).previous;
      navigateToMoveNode(previous);
    } else {
      // Go to initial position (if we're at a move without previous, go to start)
      navigateToMoveNode(null);
    }
  }, [currentGame, getCurrentMove, navigateToMoveNode]);

  const handleForwardsForce = useCallback(() => {
    if (!currentGame) return;
    
    const move = getCurrentMove();
    if (!move) {
      // At initial position, get first move
      const firstMove = currentGame.chess.nextMove() as any;
      if (firstMove) {
        navigateToMoveNode(firstMove);
      }
    } else {
      // Main line continuation is in moveNode.next
      const mainMove = (move as any).next;
      if (mainMove) {
        navigateToMoveNode(mainMove);
      }
    }
  }, [currentGame, getCurrentMove, navigateToMoveNode]);

  const handleForwardsAsk = useCallback(() => {
    if (!currentGame) return;
    
    const { variations } = getAvailableMoves();
    
    // Show popover only if there are actual variations to choose from
    if (variations.length > 0) {
      // Show popover with main line and variations
      setShowVariationPopover(true);
    } else {
      // If no variations, just follow the main line (same as forward-main)
      handleForwardsForce();
    }
  }, [currentGame, getAvailableMoves, handleForwardsForce]);

  // Handle variation selection from popover
  const handleVariationSelect = useCallback((selectedMove: string) => {
    if (!currentGame) return;
    
    const { main } = getAvailableMoves();
    const move = getCurrentMove();
    
    if (move) {
      // Check if it's the main line
      if (main && main === selectedMove) {
        const mainMove = (move as any).next;
        if (mainMove) {
          navigateToMoveNode(mainMove);
        }
      } else {
        // It's a variation - variations are stored on the next move node, not the current one
        const nextMove = (move as any).next;
        const variationBranches = nextMove && Array.isArray((nextMove as any).variations)
          ? (nextMove as any).variations
          : [];
        for (const branch of variationBranches) {
          if (Array.isArray(branch) && branch.length > 0 && branch[0].san === selectedMove) {
            navigateToMoveNode(branch[0]);
            break;
          }
        }
      }
    } else {
      // At initial position — main first move or a sideline on that node
      const firstMove = currentGame.chess.nextMove() as any;
      if (firstMove) {
        if (firstMove.san === selectedMove) {
          navigateToMoveNode(firstMove);
        } else {
          const variationBranches = Array.isArray((firstMove as any).variations)
            ? (firstMove as any).variations
            : [];
          for (const branch of variationBranches) {
            if (Array.isArray(branch) && branch.length > 0 && branch[0].san === selectedMove) {
              navigateToMoveNode(branch[0]);
              break;
            }
          }
        }
      }
    }
    setShowVariationPopover(false);
  }, [currentGame, getAvailableMoves, getCurrentMove, navigateToMoveNode]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside the popover and not on the button that opened it
      const popoverElement = document.querySelector('.variation-popover');
      if (popoverElement && !popoverElement.contains(target)) {
        const buttonElement = forwardSelectButtonRef?.current;
        if (!buttonElement || !buttonElement.contains(target)) {
          setShowVariationPopover(false);
        }
      }
    };

    if (showVariationPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showVariationPopover, forwardSelectButtonRef]);

  // Expose handlers via ref
  useImperativeHandle(ref, () => ({
    handleBack: handleBackwards,
    handleForwardMain: handleForwardsForce,
    handleForwardSelect: handleForwardsAsk
  }), [handleBackwards, handleForwardsForce, handleForwardsAsk]);

  // Handle file load
  const handleFileLoad = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // Notify parent if callback provided (parent will set pgn and useEffect will parse + show alert on failure)
        if (onPgnLoad) {
          onPgnLoad(content);
        } else {
          // Otherwise, parse directly and show message on failure
          try {
            const parsedGames = parsePgn(content);
            setGames(parsedGames);
            if (parsedGames.length > 0) {
              setSelectedGameIndex(0);
              setCurrentMoveNode(null);
              const game = parsedGames[0];
              game.chess.seek(null);
              const tree = buildMoveTree(game.chess, game.initialFen);
              setMoveTree(tree);
              emitPositionChange({
                fen: game.initialFen,
                moveNumber: 0,
                moveIndex: 0,
                isInitialPosition: true,
                gameIndex: 0
              });
            } else {
              window.alert(texts?.loadPgnNoGames ?? 'No games found in the PGN file.');
            }
          } catch (error) {
            console.error('Error parsing loaded PGN:', error);
            window.alert(texts?.loadPgnError ?? 'Could not load PGN. The file may be invalid or in an unsupported format.');
          }
        }
      };
      reader.readAsText(file);
      // Reset input so same file can be loaded again
      event.target.value = '';
    }
  }, [onPgnLoad, emitPositionChange, texts?.loadPgnError, texts?.loadPgnNoGames]);

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* Game stepper - inline navigation */}
      {games.length > 0 && currentGame && (
        <div className="mb-4 flex-shrink-0">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handlePreviousGame}
              disabled={!canGoToPreviousGame}
              className={`
                flex-shrink-0 p-2 rounded transition-all
                ${canGoToPreviousGame
                  ? 'text-[var(--primary)] hover:bg-[var(--primary)]/10'
                  : 'text-[var(--textSecondary)] cursor-not-allowed opacity-50'
                }
              `}
              aria-label={texts.previousGame || 'Previous game'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            
            <div className="flex-1 text-center min-w-0">
              <div className="text-sm text-[var(--text)] font-medium truncate">
                {formatGameHeader(currentGame, texts)}
              </div>
              {games.length > 1 && (
                <div className="text-xs text-[var(--textSecondary)] mt-1">
                  {`${(selectedGameIndex ?? 0) + 1} / ${games.length}`}
                </div>
              )}
            </div>
            
            <button
              onClick={handleNextGame}
              disabled={!canGoToNextGame}
              className={`
                flex-shrink-0 p-2 rounded transition-all
                ${canGoToNextGame
                  ? 'text-[var(--primary)] hover:bg-[var(--primary)]/10'
                  : 'text-[var(--textSecondary)] cursor-not-allowed opacity-50'
                }
              `}
              aria-label={texts.nextGame || 'Next game'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Move list */}
      <div className="flex-1 flex flex-col min-h-0 mb-4">
        {games.length > 0 && currentGame && (
          <div className="p-3 bg-[var(--surfaceHigh)] rounded-lg h-full flex flex-col min-h-0 overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto flex flex-wrap items-baseline gap-1 text-sm">
              {/* Initial position marker */}
              <button
                onClick={() => navigateToMoveNode(null)}
                className={`
                  px-1.5 py-0.5 rounded transition-colors flex-shrink-0
                  ${currentMoveNode === null
                    ? 'bg-[var(--primary)] text-[var(--onPrimary)] font-semibold'
                    : 'hover:bg-[var(--primary)]/20 text-[var(--text)]'
                  }
                `}
              >
                {INITIAL_POSITION_MARKER}
              </button>
              {moveTree.length > 0 && (
                <MoveList
                  moves={moveTree}
                  currentMoveNode={currentMoveNode}
                  onMoveClick={navigateToMoveNode}
                  translateMove={translateMove}
                  texts={texts}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Variation Popover */}
      {showVariationPopover && (
        <VariationPopover
          main={getAvailableMoves().main}
          variations={getAvailableMoves().variations}
          onSelect={handleVariationSelect}
          translateMove={translateMove}
          texts={texts}
          onClose={() => setShowVariationPopover(false)}
          buttonElement={forwardSelectButtonRef?.current || null}
        />
      )}

      {/* Load PGN button */}
      {showLoadButton && (
        <div className="flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pgn,.txt"
            onChange={handleFileLoad}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-3 py-1.5 text-sm bg-[var(--surfaceHigh)] text-[var(--text)] rounded hover:opacity-90 transition-opacity"
          >
            {texts.loadPgn || 'Load PGN'}
          </button>
        </div>
      )}
    </div>
  );
});

PgnViewer.displayName = 'PgnViewer';

export default PgnViewer;
