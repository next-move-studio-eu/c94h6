import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { useTheme } from '../contexts/ThemeContext';

// Import chess piece SVGs
import pawnDark from '../assets/chess-pieces/Chess_pdt45.svg';
import pawnLight from '../assets/chess-pieces/Chess_plt45.svg';
import rookDark from '../assets/chess-pieces/Chess_rdt45.svg';
import rookLight from '../assets/chess-pieces/Chess_rlt45.svg';
import knightDark from '../assets/chess-pieces/Chess_ndt45.svg';
import knightLight from '../assets/chess-pieces/Chess_nlt45.svg';
import bishopDark from '../assets/chess-pieces/Chess_bdt45.svg';
import bishopLight from '../assets/chess-pieces/Chess_blt45.svg';
import queenDark from '../assets/chess-pieces/Chess_qdt45.svg';
import queenLight from '../assets/chess-pieces/Chess_qlt45.svg';
import kingDark from '../assets/chess-pieces/Chess_kdt45.svg';
import kingLight from '../assets/chess-pieces/Chess_klt45.svg';

export interface ChessBoardTexts {
  choosePromotionPiece?: string; // "Choose promotion piece"
  cancel?: string; // "Cancel"
}

interface ChessBoardProps {
  fen?: string;
  highlights?: string;
  lookingOnWhite?: boolean;
  onMove?: (move: { from: string; to: string; promotion?: string }) => void;
  onSquareClick?: (square: string) => void;
  disabled?: boolean;
  allowInput?: boolean;
  texts?: ChessBoardTexts;
}

type Square = string | null;
type SquareHighlight = { square: string; color: string };
type ArrowHighlight = { from: string; to: string; color: string };

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

/** PGN-style color letter → token name segment (`highlight${Name}OnLight` / Arrow, etc.). */
const HIGHLIGHT_CODE_TO_NAME: Record<string, string> = {
  G: 'Green',
  R: 'Red',
  Y: 'Yellow',
  B: 'Blue',
  O: 'Orange',
  P: 'Purple',
};

function highlightTileVar(colorCode: string, tile: 'light' | 'dark'): string {
  const name = HIGHLIGHT_CODE_TO_NAME[colorCode.toUpperCase()] ?? 'Green';
  return tile === 'light' ? `var(--highlight${name}OnLight)` : `var(--highlight${name}OnDark)`;
}

function highlightArrowVar(colorCode: string): string {
  const name = HIGHLIGHT_CODE_TO_NAME[colorCode.toUpperCase()] ?? 'Green';
  return `var(--highlight${name}Arrow)`;
}

// Unified 100x100 coordinate system constants
const FRAME_SIZE = 5.0;  // For labels on left and bottom
const BOARD_SIZE = 90.0; // The actual playable area
const SQ_SIZE = 11.25;   // 90.0 / 8

export default function ChessBoard({
  fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  highlights = '',
  lookingOnWhite = true,
  onMove,
  onSquareClick,
  disabled = false,
  allowInput = false,
  texts = {}
}: ChessBoardProps) {
  const { mode } = useTheme();
  const [game, setGame] = useState<Chess>(() => {
    try {
      return new Chess(fen);
    } catch (error) {
      console.error('Failed to initialize Chess with FEN:', fen, error);
      return new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    }
  });
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [board, setBoard] = useState<Square[][]>(() => {
    // Initialize board immediately
    try {
      const initialGame = new Chess(fen);
      const boardState: Square[][] = [];
      for (let rank = 7; rank >= 0; rank--) {
        const row: Square[] = [];
        for (let file = 0; file < 8; file++) {
          const square = `${FILES[file]}${RANKS[rank]}` as any;
          const piece = initialGame.get(square);
          if (piece) {
            row.push(piece.color === 'w' ? piece.type.toUpperCase() : piece.type);
          } else {
            row.push(null);
          }
        }
        boardState.push(row);
      }
      return boardState;
    } catch (error) {
      console.error('Failed to initialize board with FEN:', fen, error);
      return [];
    }
  });
  const [promotionSquare, setPromotionSquare] = useState<{ from: string; to: string } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Parse highlights
  const parseHighlights = useCallback((): { squares: SquareHighlight[]; arrows: ArrowHighlight[] } => {
    if (!highlights) return { squares: [], arrows: [] };
    
    const squareHighlights: SquareHighlight[] = [];
    const arrowHighlights: ArrowHighlight[] = [];
    
    const parts = highlights.split(',').filter(p => p.trim());
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length === 3) {
        // Square highlight: e4G
        const square = trimmed.slice(0, 2);
        const color = trimmed.slice(2);
        if (isValidSquare(square)) {
          squareHighlights.push({ square, color });
        }
      } else if (trimmed.length === 5) {
        // Arrow highlight: c7c5R
        const from = trimmed.slice(0, 2);
        const to = trimmed.slice(2, 4);
        const color = trimmed.slice(4);
        if (isValidSquare(from) && isValidSquare(to)) {
          arrowHighlights.push({ from, to, color });
        }
      }
    }
    
    return { squares: squareHighlights, arrows: arrowHighlights };
  }, [highlights]);

  const isValidSquare = (square: string): boolean => {
    return square.length === 2 && 
           FILES.includes(square[0]) && 
           RANKS.includes(square[1]);
  };

  // Update board from FEN
  useEffect(() => {
    try {
      const newGame = new Chess(fen);
      setGame(newGame);
      const boardState: Square[][] = [];
      
      // Create board from rank 8 to rank 1 (top to bottom)
      for (let rank = 7; rank >= 0; rank--) {
        const row: Square[] = [];
        for (let file = 0; file < 8; file++) {
          const square = `${FILES[file]}${RANKS[rank]}` as any;
          const piece = newGame.get(square);
          if (piece) {
            row.push(piece.color === 'w' ? piece.type.toUpperCase() : piece.type);
          } else {
            row.push(null);
          }
        }
        boardState.push(row);
      }
      
      setBoard(boardState);
      setSelectedSquare(null);
    } catch (error) {
      console.error('Invalid FEN:', error);
    }
  }, [fen]);

  // Get square color
  const getSquareColor = (file: number, rank: number): 'light' | 'dark' => {
    const isLight = (file + rank) % 2 === 0;
    return isLight ? 'light' : 'dark';
  };

  // Get piece image path
  const getPieceImage = (piece: string): string => {
    const pieceMap: Record<string, string> = {
      'p': pawnDark,
      'P': pawnLight,
      'r': rookDark,
      'R': rookLight,
      'n': knightDark,
      'N': knightLight,
      'b': bishopDark,
      'B': bishopLight,
      'q': queenDark,
      'Q': queenLight,
      'k': kingDark,
      'K': kingLight,
    };
    return pieceMap[piece] || pawnLight;
  };

  // Get square center coordinates in 100x100 coordinate system
  // square: chess notation (e.g., 'e4')
  // flipped: whether board is flipped (looking from black side)
  const getSquareCenter = (square: string, flipped: boolean): { x: number; y: number } => {
    const file = FILES.indexOf(square[0]);
    const rank = parseInt(square[1]) - 1; // Convert rank to 0-7 index
    
    // Calculate visual indices based on flipped state
    let visualFileIndex: number;
    let visualRankIndex: number;
    
    if (flipped) {
      // When flipped: file h (7) is visual 0, file a (0) is visual 7
      visualFileIndex = 7 - file;
      // When flipped: rank 1 (0) is visual 0, rank 8 (7) is visual 7
      visualRankIndex = rank;
    } else {
      // When not flipped: file a (0) is visual 0, file h (7) is visual 7
      visualFileIndex = file;
      // When not flipped: rank 8 (7) is visual 0, rank 1 (0) is visual 7
      visualRankIndex = 7 - rank;
    }
    
    // Calculate center coordinates
    // CenterX = FRAME_SIZE + (visualFileIndex * SQ_SIZE) + (SQ_SIZE / 2)
    // CenterY = FRAME_SIZE + (visualRankIndex * SQ_SIZE) + (SQ_SIZE / 2)
    const x = FRAME_SIZE + (visualFileIndex * SQ_SIZE) + (SQ_SIZE / 2);
    const y = FRAME_SIZE + (visualRankIndex * SQ_SIZE) + (SQ_SIZE / 2);
    
    return { x, y };
  };

  // Convert board coordinates to square notation
  // rank is 0-7 (0 = top row visually, 7 = bottom row visually)
  // file is 0-7 (0 = left column visually, 7 = right column visually)
  // Board array: board[0] = rank 8, board[7] = rank 1
  const getSquareNotation = (file: number, rank: number, flipped: boolean): string => {
    let actualFile: number;
    let actualRank: number;
    
    if (flipped) {
      // When flipped: visual position (0,0) should be h1
      // Visual rank 0 = rank 1, visual rank 7 = rank 8
      // Visual file 0 = file h, visual file 7 = file a
      actualFile = 7 - file;
      actualRank = rank; // Visual rank 0 = rank 1, so rank number = visual rank
    } else {
      // When not flipped: visual position (0,0) should be a8
      // Visual rank 0 = rank 8, visual rank 7 = rank 1
      actualFile = file;
      actualRank = 7 - rank; // Visual rank 0 = rank 8, so rank number = 7 - visual rank
    }
    
    return `${FILES[actualFile]}${RANKS[actualRank]}`;
  };

  // Handle square click
  const handleSquareClick = useCallback((file: number, rank: number) => {
    const flipped = !lookingOnWhite;
    const square = getSquareNotation(file, rank, flipped);
    
    // Call onSquareClick callback if provided (fires on any click, regardless of allowInput/disabled)
    if (onSquareClick) {
      onSquareClick(square);
    }
    
    // Move handling logic only runs if allowInput is enabled and not disabled
    if (!allowInput || disabled) return;
    
    const piece = game.get(square as any);
    
    // If a square is already selected
    if (selectedSquare) {
      // If clicking the same square, deselect
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      
      // Validate move using a temporary game instance
      try {
        const tempGame = new Chess(game.fen());
        const move = tempGame.move({
          from: selectedSquare as any,
          to: square as any,
          promotion: 'q' // Default promotion, will be overridden if needed
        });
        
        if (move) {
          // Check if promotion is needed
          if (move.promotion) {
            setPromotionSquare({ from: selectedSquare, to: square });
            return;
          }
          
          setSelectedSquare(null);
          if (onMove) {
            onMove({ from: selectedSquare, to: square });
          }
        }
      } catch (error) {
        // Invalid move, try selecting the new square if it has a piece of the current player
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      // Select square if it has a piece of the current player
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
    }
  }, [selectedSquare, game, allowInput, disabled, lookingOnWhite, onMove, onSquareClick]);

  // Handle promotion selection
  const handlePromotion = useCallback((promotionPiece: 'q' | 'r' | 'b' | 'n') => {
    if (!promotionSquare) return;
    
    // Validate promotion move using a temporary game instance
    try {
      const tempGame = new Chess(game.fen());
      const move = tempGame.move({
        from: promotionSquare.from as any,
        to: promotionSquare.to as any,
        promotion: promotionPiece
      });
      
      if (move && onMove) {
        onMove({ 
          from: promotionSquare.from, 
          to: promotionSquare.to, 
          promotion: promotionPiece 
        });
      }
      
      setPromotionSquare(null);
      setSelectedSquare(null);
    } catch (error) {
      console.error('Promotion move failed:', error);
      setPromotionSquare(null);
    }
  }, [promotionSquare, game, onMove]);

  const { squares: squareHighlights, arrows: arrowHighlights } = parseHighlights();

  // Check if square is highlighted (overlay color matches light vs dark tile)
  const isSquareHighlighted = (
    square: string,
    tile: 'light' | 'dark'
  ): { highlighted: boolean; colorVar?: string } => {
    const highlight = squareHighlights.find(h => h.square === square);
    if (highlight) {
      return { highlighted: true, colorVar: highlightTileVar(highlight.color, tile) };
    }
    if (selectedSquare === square) {
      return {
        highlighted: true,
        colorVar: tile === 'light' ? 'var(--selectedSquareOnLight)' : 'var(--selectedSquareOnDark)',
      };
    }
    return { highlighted: false };
  };

  const renderArrow = (arrow: ArrowHighlight, flipped: boolean, index: number) => {
    const fromCenter = getSquareCenter(arrow.from, flipped);
    const toCenter = getSquareCenter(arrow.to, flipped);

    const x1 = fromCenter.x;
    const y1 = fromCenter.y;
    const x2 = toCenter.x;
    const y2 = toCenter.y;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.1) return null;

    const unitX = dx / len;
    const unitY = dy / len;
    const perpX = -unitY;
    const perpY = unitX;

    const headLen = 3.0;
    const headWidth = 3.5;
    const shaftWidth = 1.5;

    // Arrow polygon points
    const points = [
        `${x2},${y2}`, // Tip
        `${x2 - unitX * headLen + perpX * (headWidth / 2)},${y2 - unitY * headLen + perpY * (headWidth / 2)}`,
        `${x2 - unitX * headLen + perpX * (shaftWidth / 2)},${y2 - unitY * headLen + perpY * (shaftWidth / 2)}`,
        `${x1 + perpX * (shaftWidth / 2)},${y1 + perpY * (shaftWidth / 2)}`, // Start left
        `${x1 - perpX * (shaftWidth / 2)},${y1 - perpY * (shaftWidth / 2)}`, // Start right
        `${x2 - unitX * headLen - perpX * (shaftWidth / 2)},${y2 - unitY * headLen - perpY * (shaftWidth / 2)}`,
        `${x2 - unitX * headLen - perpX * (headWidth / 2)},${y2 - unitY * headLen - perpY * (headWidth / 2)}`
    ].join(' ');

    const arrowColorVar = highlightArrowVar(arrow.color);
    const strokeWidth = 0.35;
    
    return (
        <g key={`arrow-${index}`}>
            {/* Arrow with stroke for better visibility */}
            <polygon
                points={points}
                fill={arrowColorVar}
                stroke="var(--text)"
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity="1.0"
                filter="url(#arrow-shadow)"
            />
        </g>
    );
  };

  const flipped = !lookingOnWhite;

  return (
    <div className="relative block mx-auto w-full h-full min-w-0 min-h-0" style={{ userSelect: 'none' }}>
      <div 
        ref={boardRef}
        className="relative"
        style={{ 
          width: '100%',
          height: '100%',
          maxWidth: '450px',
          maxHeight: '450px',
          userSelect: 'none',
          overflow: 'hidden'
        }}
      >
        {/* SVG for arrows and labels - covers entire 100x100 coordinate system */}
        <svg
          className="absolute pointer-events-none z-10"
          style={{ 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%',
            userSelect: 'none',
            shapeRendering: 'geometricPrecision'
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Arrow shadow filter definition */}
          <defs>
            <filter id="arrow-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="0.4"/>
              <feOffset dx="0.2" dy="0.2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Frame background on all 4 sides - with slight overlap to prevent gaps */}
          {/* Left frame - extends slightly right to overlap with board */}
          <rect
            x="0"
            y="0"
            width={FRAME_SIZE + 0.1}
            height="100"
            fill="var(--frame)"
          />
          {/* Right frame - extends slightly left to overlap with board */}
          <rect
            x={FRAME_SIZE + BOARD_SIZE - 0.1}
            y="0"
            width={FRAME_SIZE + 0.1}
            height="100"
            fill="var(--frame)"
          />
          {/* Top frame - extends slightly down to overlap with board */}
          <rect
            x={FRAME_SIZE}
            y="0"
            width={BOARD_SIZE}
            height={FRAME_SIZE + 0.1}
            fill="var(--frame)"
          />
          {/* Bottom frame - extends slightly up to overlap with board */}
          <rect
            x={FRAME_SIZE}
            y={FRAME_SIZE + BOARD_SIZE - 0.1}
            width={BOARD_SIZE}
            height={FRAME_SIZE + 0.1}
            fill="var(--frame)"
          />
          
          {/* Rank labels (1-8) on the left */}
          {(flipped ? [...RANKS] : [...RANKS].reverse()).map((rank, visualIndex) => {
            const centerY = FRAME_SIZE + (visualIndex * SQ_SIZE) + (SQ_SIZE / 2);
            return (
              <text
                key={`rank-${rank}`}
                x={FRAME_SIZE / 2}
                y={centerY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="3.5"
                fontWeight="600"
                style={{
                  fill: 'var(--boardLabel)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              >
                {rank}
              </text>
            );
          })}

          {/* File labels (a-h) on the bottom */}
          {(flipped ? [...FILES].reverse() : FILES).map((file, visualIndex) => {
            const centerX = FRAME_SIZE + (visualIndex * SQ_SIZE) + (SQ_SIZE / 2);
            return (
              <text
                key={`file-${file}`}
                x={centerX}
                y={100 - (FRAME_SIZE / 2)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="3.5"
                fontWeight="600"
                style={{
                  fill: 'var(--boardLabel)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              >
                {file}
              </text>
            );
          })}

          {/* Arrows */}
          {arrowHighlights.map((arrow, index) => renderArrow(arrow, flipped, index))}
          
          {/* Turn indicator rectangle (right side, between ranks 4 and 5) */}
          {(() => {
            const activeColor = game.turn(); // 'w' or 'b'
            const rectWidth = 1.8;
            const rectHeight = 1.8;
            const centerX = FRAME_SIZE + BOARD_SIZE + (FRAME_SIZE / 2); // 97.5
            // Position between ranks 4 and 5 (visual rank indices 3 and 4, so 3.5)
            const centerY = FRAME_SIZE + (3.5 * SQ_SIZE) + (SQ_SIZE / 2); // 50
            
            // Visibility strategy: Use contrasting colors with borders
            let fillColor: string;
            let strokeColor: string;
            let strokeWidth: number;
            
            if (activeColor === 'w') {
              // White indicator
              if (mode === 'light') {
                // Light mode: Use light gray fill with dark border for visibility on light frame
                fillColor = '#e8e8e8';
                strokeColor = '#333333';
                strokeWidth = 0.2;
              } else {
                // Dark mode: Use white with dark border
                fillColor = '#ffffff';
                strokeColor = '#000000';
                strokeWidth = 0.2;
              }
            } else {
              // Black indicator
              fillColor = '#000000';
              if (mode === 'light') {
                // Light mode: Black with white border for visibility on light frame
                strokeColor = '#ffffff';
                strokeWidth = 0.25;
              } else {
                // Dark mode: Black with white border for visibility on dark frame
                strokeColor = '#ffffff';
                strokeWidth = 0.25;
              }
            }
            
            return (
              <rect
                x={centerX - rectWidth / 2}
                y={centerY - rectHeight / 2}
                width={rectWidth}
                height={rectHeight}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                opacity="1.0"
                rx="0.3"
              />
            );
          })()}
        </svg>
        
        {/* Board squares area - positioned absolutely using percentages */}
        {/* Extend slightly into frame area to prevent gaps, then clip */}
        <div 
          className="absolute"
          style={{
            top: `${FRAME_SIZE}%`,
            left: `${FRAME_SIZE}%`,
            width: `${BOARD_SIZE}%`,
            height: `${BOARD_SIZE}%`,
            userSelect: 'none',
            overflow: 'hidden'
          }}
        >
          {/* 8×8 fr grid: keeps cells exactly square in a square container without row rounding gaps */}
          <div
            className="grid min-h-0 min-w-0"
            style={{
              width: '100%',
              height: '100%',
              gap: 0,
              gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(8, minmax(0, 1fr))',
            }}
          >
            {(board.length > 0 ? (flipped ? [...board].reverse() : board) : Array(8).fill(null).map(() => Array(8).fill(null))).map((row, visualRankIndex) => {
              const rowToRender = flipped && row ? [...row].reverse() : (row || Array(8).fill(null));
              return rowToRender.map((piece, visualFileIndex) => {
                const square = getSquareNotation(visualFileIndex, visualRankIndex, flipped);
                const squareColor = getSquareColor(visualFileIndex, visualRankIndex);
                const { highlighted, colorVar } = isSquareHighlighted(square, squareColor);

                const baseFill =
                  squareColor === 'light' ? 'var(--lightSquare)' : 'var(--darkSquare)';
                const overlayGradient =
                  highlighted && colorVar
                    ? `linear-gradient(${colorVar}, ${colorVar})`
                    : undefined;

                return (
                  <div
                    key={`${visualFileIndex}-${visualRankIndex}`}
                    onClick={() => handleSquareClick(visualFileIndex, visualRankIndex)}
                    className={`
                      relative min-h-0 min-w-0 flex items-center justify-center
                      ${allowInput && !disabled ? 'cursor-pointer' : ''}
                    `}
                    style={{
                      backgroundColor: baseFill,
                      ...(overlayGradient ? { backgroundImage: overlayGradient } : {}),
                      outline: 'none',
                    }}
                  >
                    {/* Piece */}
                    {piece && (
                      <img
                        src={getPieceImage(piece)}
                        alt={piece}
                        className="w-4/5 h-4/5 object-contain pointer-events-none"
                        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                        draggable={false}
                      />
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
      
      {/* Promotion dialog */}
      {promotionSquare && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface)] rounded-lg p-6 shadow-xl">
            <div className="text-[var(--text)] mb-4 text-center font-semibold">
              {texts.choosePromotionPiece || 'Choose promotion piece'}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {(['q', 'r', 'b', 'n'] as const).map(piece => (
                <button
                  key={piece}
                  onClick={() => handlePromotion(piece)}
                  className="bg-[var(--primary)] text-[var(--onPrimary)] p-4 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <img
                    src={getPieceImage(game.turn() === 'w' ? piece.toUpperCase() : piece)}
                    alt={piece}
                    className="w-12 h-12 mx-auto"
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setPromotionSquare(null);
                setSelectedSquare(null);
              }}
              className="mt-4 w-full bg-[var(--surfaceHigh)] text-[var(--onPrimary)] py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              {texts.cancel || 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
