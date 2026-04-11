export interface ChessPositionTag {
  timestamp: number; // Time in milliseconds from recording start
  fen: string; // FEN notation of the position
  highlight: string; // Highlight string (same format as ChessBoard highlights prop)
  lookingOnWhite?: boolean; // Board orientation: true = white at bottom, false = black at bottom. Default true for backwards compatibility.
}
