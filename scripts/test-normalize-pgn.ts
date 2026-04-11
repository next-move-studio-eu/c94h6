/**
 * Run: npx tsx scripts/test-normalize-pgn.ts
 */
import { Chess } from '@jackstenglein/chess';
import { normalizePgn } from '../src/components/PgnViewer.tsx';

const sample1 = `[Event "Sicilian Traps"]
[Site "Chess.com"]
[Date "2026.01.10"]
[Round "5"]
[White "Trap Master"]
[Black "Unsuspecting Player"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 { The Dragon Variation. } 
6. Bc4 Bg7 7. O-O O-O 8. Bb3 Nc6 9. Be3 Ng4 10. Qxg4? 
    (10. Nxc6 { This would be the standard response. } 10... bxc6 11. Bd4) 
10... Nxd4 11. Qh4 Nxb3 12. axb3 { White is slightly worse here, but the game continues. } 1-0`;

const sample2 = `[Event "?"]
[Site "?"]
[Date "2026-03-15"]
[Round "1.1"]
[White "Zilka, Stepan"]
[Black "Volosin, Leon"]
[Result "1-0"]
[ECO "D27"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c5 5. e3 dxc4 6. Bxc4 a6 7. a4 Nc6 8. O-O cxd4 9. exd4 Be7 10. Qe2 O-O 11. Rd1 Nd5 12. Ba2 Ncb4 13. Bb1 Bd7 14. Ne5 Rc8 15. Bd2 Be8 16. Qe4 f5 17. Qe2 Bf6 18. Ra3 Bxe5 19. dxe5 Bc6 20. Qh5 Qe8 21. Qh4 Qd8 22. Bg5 Qc7 23. Nxd5 Nxd5 24. Rh3 g6 25. Ba2 Rfe8 26. Bxd5 Bxd5 27. Bf6 Qf7 28. Qh6 Rc7 29. Rg3 Rec8 30. h4 Qf8 31. Qg5 Kf7 32. h5 Ke8 33. hxg6 hxg6 34. Qxg6+ Kd7 35. Rxd5+ exd5 36. Qxf5+ Kc6 37. Qe6+ Kc5 38. Rc3+ 1-0`;

const sample3 = `[Event "?"]
[Site "?"]
[Date "2026.03.15"]
[Round "1.1"]
[White "Zilka, Stepan"]
[Black "Volosin, Leon"]
[Result "1-0"]
[ECO "D27"]
1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 c5 5. e3 dxc4 6.
Bxc4 a6 7. a4 Nc6 8. O-O cxd4 9. exd4 Be7 10. Qe2 O-O 11. Rd1 Nd5 12. Ba2 Ncb4
13. Bb1 Bd7 14. Ne5 Rc8 15. Bd2 Be8 16. Qe4 f5 17. Qe2 Bf6 18. Ra3 Bxe5 19.
dxe5 Bc6 20. Qh5 Qe8 21. Qh4 Qd8 22. Bg5 Qc7 23. Nxd5 Nxd5 24. Rh3 g6 25. Ba2
Rfe8 26. Bxd5 Bxd5 27. Bf6 Qf7 28. Qh6 Rc7 29. Rg3 Rec8 30. h4 Qf8 31. Qg5 Kf7
32. h5 Ke8 33. hxg6 hxg6 34. Qxg6+ Kd7 35. Rxd5+ exd5 36. Qxf5+ Kc6 37. Qe6+
Kc5 38. Rc3+ 1-0

[Event "?"]
[Site "?"]
[Date "2026.03.15"]
[Round "1.2"]
[White "Spacek, Petr"]
[Black "Forman, Stepan"]
[Result "1-0"]
[ECO "A80"]
1. d4 f5 2. Bf4 d6 3. e3 g6 4. h4 Nf6 5. h5 Nxh5 6. Rxh5
gxh5 7. Qxh5+ Kd7 8. Qxf5+ e6 9. Qh3 Qf6 10. Nc3 Qf5 11. Qxf5 exf5 12. Bd3 Kd8
13. Nf3 Be7 14. O-O-O Na6 15. Rh1 Nb4 16. Bc4 Bd7 17. a3 Na6 18. Bh6 Bf8 19.
Bg5+ Be7 20. Bh6 Bf8 21. Bxf8 Rxf8 22. Rxh7 c6 23. Bxa6 bxa6 24. Ne2 Kc7 25.
Nf4 Rae8 26. d5 Rh8 27. Rf7 Kc8 28. Nd4 cxd5 29. Nxf5 Ref8 30. Nxd6+ Kd8 31. c3
Rh1+ 32. Kd2 Rxf7 33. Nxf7+ Ke7 34. Ne5 Bf5 35. Ned3 Kd6 36. Ne1 a5 37. f3 a4
38. g4 Bh7 39. Ke2 Kc5 40. g5 Kc4 41. g6 Rh2+ 42. Kd1 Bxg6 43. Nxg6 Rxb2 44.
Nf4 Rb3 45. Nc2 Rxc3 46. Ne2 Rb3 47. Kd2 Rb7 48. f4 Rh7 49. f5 Kb3 50. Kd3 Rh1
51. Ned4+ Kb2 52. Ke2 1-0`;

function moveCount(chess: Chess): number {
  chess.seek(null);
  let n = 0;
  let node = chess.nextMove() as any;
  while (node) {
    n++;
    node = node.next;
  }
  return n;
}

function assertLoads(label: string, pgn: string): void {
  const c = new Chess();
  c.loadPgn(pgn);
  if (moveCount(c) < 1) throw new Error(`${label}: expected moves`);
}

function assertSameGame(label: string, a: string, b: string): void {
  const ca = new Chess();
  const cb = new Chess();
  ca.loadPgn(a);
  cb.loadPgn(b);
  const na = moveCount(ca);
  const nb = moveCount(cb);
  if (na !== nb) throw new Error(`${label}: move count ${na} vs ${nb}`);
}

function countGames(pgn: string): number {
  const re = /(1-0|0-1|1\/2-1\/2|\*)\s*\n\s*(?=\[)/g;
  const m = pgn.match(re);
  return (m?.length ?? 0) + 1;
}

/** Must match splitPgnIntoRawGames in PgnViewer.tsx */
function splitPgnIntoRawGames(pgnText: string): string[] {
  const text = pgnText.trim();
  if (!text) return [];
  const gameBoundaryPattern = /(1-0|0-1|1\/2-1\/2|\*)\s*\n\s*(?=\[)/g;
  const boundaries: number[] = [0];
  let m: RegExpExecArray | null;
  while ((m = gameBoundaryPattern.exec(text)) !== null) {
    const afterResult = m.index + m[0].length;
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
}

function main() {
  console.log('--- sample 1: normalized must load same as raw ---');
  const n1 = normalizePgn(sample1);
  assertSameGame('sample1', sample1.trim(), n1);
  assertLoads('sample1 norm', n1);
  console.log('sample1 ok, len raw', sample1.length, 'norm', n1.length);

  console.log('--- sample 2 ---');
  const n2 = normalizePgn(sample2);
  assertSameGame('sample2', sample2.trim(), n2);
  assertLoads('sample2 norm', n2);
  console.log('sample2 ok');

  console.log('--- sample 3: raw may fail; normalized must load 2 games ---');
  let rawOk = true;
  try {
    const c = new Chess();
    c.loadPgn(sample3.trim());
    console.log('sample3 raw unexpectedly loaded');
  } catch {
    rawOk = false;
    console.log('sample3 raw fails as expected:', !rawOk);
  }
  const n3 = normalizePgn(sample3);
  console.log('sample3 normalized games (boundary heuristic):', countGames(n3));
  const parts = splitPgnIntoRawGames(n3);
  console.log('sample3 split by result+[ boundary:', parts.length, 'chunks');
  for (let i = 0; i < parts.length; i++) {
    const c = new Chess();
    try {
      c.loadPgn(parts[i]!.trim());
      console.log(`  chunk ${i + 1}: loads, moves`, moveCount(c));
    } catch (e) {
      console.error(`  chunk ${i + 1}: FAIL`, e);
    }
  }
  if (parts.length !== 2) throw new Error(`expected 2 games, got ${parts.length}`);
  assertLoads('sample3 game 1', parts[0]!);
  assertLoads('sample3 game 2', parts[1]!);
  console.log('sample3 ok');
}

main();
