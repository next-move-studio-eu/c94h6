# Article content JSON specification (ContentItem)

⚠️ **CRITICAL: Use ONLY these item types with EXACTLY these fields. DO NOT INVENT custom types or fields!**

🚨 **OUTPUT: ALWAYS provide a JSON object with a `content` key (array of ContentItems) in a code block with ```json, NEVER format as regular markdown in the chat window!**

Example of correct output:
```json
{
  "content": [
    { "type": "markdown", "content": "# Article Title\n\nContent..." },
    { "type": "chess-diagram", "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "highlights": "", "lookingOnWhite": true }
  ]
}
```

## Structure

Article body is stored in `content.json` (inside `content.zip`) as an **object** with a single key **`content`** — an array of ContentItems. Each element is discriminated by the `type` field. Text (headings, paragraphs, code, tables) lives in items with `type: "markdown"` and a `content` field (plain Markdown). Accordion body (`body`) is clean Markdown.

## ContentItem types (editor-time)

### markdown

All text blocks: headings, paragraphs, code, tables. Single Markdown string.

**Required fields:** `type`, `content`

```json
{ "type": "markdown", "content": "## Section\n\nParagraph with **bold** text.\n\n```\ncode\n```" }
```

- `content`: string — plain Markdown (no MDX, no JSX)

### accordion

Collapsible section. **Body is Markdown only** (no MDX, no nested JSON).

**Required fields:** `type`, `title`, `accordionType`, `body`

```json
{
  "type": "accordion",
  "title": "Accordion heading",
  "accordionType": "Info",
  "body": "Markdown content here.\n\n- bullet 1\n- bullet 2"
}
```

- `title`: string — accordion heading
- `accordionType`: string — ONLY: "Info", "Bike", "Mountain", "Tent", "MapPin", "Train", "Bus", "Ship", "Plane", "Car", "Code", "ShieldCheck", "CircleAlert", "Castle", "EyeOff", "Lightbulb"
- `body`: string — content in plain Markdown (no JSX)

### chess-diagram

Chess board — static or interactive "Play the move" challenge. Use `bestMove` to make it interactive.

**Required fields:** `type`, `fen`, `highlights`, `lookingOnWhite`

**Optional:** `bestMove`, `text`

```json
{
  "type": "chess-diagram",
  "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
  "highlights": "e4Y,d4G",
  "lookingOnWhite": true
}
```

With optional best move challenge and caption:
```json
{
  "type": "chess-diagram",
  "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
  "highlights": "",
  "lookingOnWhite": true,
  "bestMove": "f3g5",
  "text": "White to move — find the best move."
}
```

- `fen`: string — FEN notation of position (REQUIRED!)
- `highlights`: string — e.g. "e4Y,d4G,g1f3R" (square+color: G=green, R=red, Y=yellow, B=blue, O=orange, P=purple)
- `lookingOnWhite`: boolean — true or false
- `bestMove`: string — optional UCI move (e.g. "e2e4", "d7e8q"); when set, the board becomes an interactive "guess the move" challenge: the user plays a move and sees a green arrow for the correct move; if wrong, a red arrow for their move and a green arrow for the correct one
- `text`: string — optional caption displayed centered below the board (e.g. position source, game context)

### photo-article

In-article image. References numbered file (1.avif, 2.avif...).

**Required fields:** `type`, `imageId`

**Optional:** `caption`

```json
{ "type": "photo-article", "imageId": 1 }
{ "type": "photo-article", "imageId": 2, "caption": "Caption text" }
```

- `imageId`: number — 1, 2, 3... (file 1.avif, 2.avif...)
- `caption`: string — optional caption

### chess-video

Reference to chessvideoN.zip package.

**Required fields:** `type`, `videoNumber`

**Optional:** `title`

```json
{ "type": "chess-video", "videoNumber": 1 }
{ "type": "chess-video", "videoNumber": 2, "title": "Video title" }
```

- `videoNumber`: number — 1, 2, 3... (chessvideo1.zip, chessvideo2.zip...)
- `title`: string — optional block heading

### video (in-article WebM)

Video directly in the article (video1.webm, video2.webm...). Content is always collapsed by default.

**Required fields:** `type`, `videoId`, `title`

```json
{ "type": "video", "videoId": "1", "title": "Introduction to openings" }
```

- `videoId`: string — "1", "2"... (video1.webm, video2.webm...)
- `title`: string — video heading

### article-audio

Audio directly in the article (audio1.webm, audio2.webm...). Content is always collapsed by default.

**Required fields:** `type`, `audioId`

**Optional:** `title`

```json
{ "type": "article-audio", "audioId": "1" }
{ "type": "article-audio", "audioId": "2", "title": "Introduction (audio)" }
```

- `audioId`: string — "1", "2"... (audio1.webm, audio2.webm...)
- `title`: string — optional audio heading

### smiles

Chemical structure from a SMILES string. Rendered as a 2D structure (display mode is chosen by the presentation layer).

**Required fields:** `type`, `smiles`

**Optional:** `title`

```json
{ "type": "smiles", "smiles": "CC(=O)Oc1ccccc1C(=O)O" }
{ "type": "smiles", "smiles": "CCO", "title": "Ethanol" }
```

- `smiles`: string — SMILES string of the molecule (REQUIRED!)
- `title`: string — optional caption above the structure

### slideshow

Image gallery (slideshowN.zip).

**Required fields:** `type`, `slideshowNumber`

**Optional:** `title`

```json
{ "type": "slideshow", "slideshowNumber": 1 }
{ "type": "slideshow", "slideshowNumber": 2, "title": "Slideshow title" }
```

- `slideshowNumber`: number — 1, 2, 3...
- `title`: string — optional heading

### play-engine

Interactive game against engine.

**Required fields:** `type`, `fen`, `playWithWhite`

```json
{
  "type": "play-engine",
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "playWithWhite": true
}
```

- `fen`: string — FEN starting position (REQUIRED!)
- `playWithWhite`: boolean — true/false

### dot

Graphviz DOT diagram. The `content` field holds DOT source; rendered as SVG.

**Required fields:** `type`, `content`

```json
{ "type": "dot", "content": "digraph G { A -> B; B -> C; }" }
```

- `content`: string — Graphviz DOT source (e.g. `digraph G { ... }`)
- **Colors in DOT:** When you use colors (node fill, edge color, fontcolor, etc.), use **medium luminosity** colors. The presentation layer will apply post-processing so that text, boxes, arrows, and other elements have sufficient contrast on both light and dark themes.

### pie

Pie chart. Renders slices from an array of label/value/color. Colors are theme-adjusted.

**Required fields:** `type`, `name`, `data`

```json
{
  "type": "pie",
  "name": "Market share 2024",
  "data": [
    { "label": "Product A", "value": 45, "color": "#e14951" },
    { "label": "Product B", "value": 30, "color": "#4a90d9" },
    { "label": "Other", "value": 25, "color": "#6bbf59" }
  ]
}
```

- `name`: string — title above the chart (required)
- `data`: array of `{ "label": string, "value": number, "color": string }` — at least one slice; `color` hex/CSS (required); presentation applies theme adjustment

### bar

Bar chart. Renders bars from x-axis labels and one or more series (name, data array, color). Colors are theme-adjusted.

**Required fields:** `type`, `name`, `xAxis`, `series`

```json
{
  "type": "bar",
  "name": "Quarterly revenue",
  "xAxis": ["Q1", "Q2", "Q3", "Q4"],
  "series": [
    { "name": "2023", "data": [10, 15, 12, 18], "color": "#5b8def" },
    { "name": "2024", "data": [12, 17, 14, 22], "color": "#2e7d32" }
  ]
}
```

- `name`: string — title above the chart (required)
- `xAxis`: array of strings — category labels (same length as each series’ `data`)
- `series`: array of `{ "name": string, "data": number[], "color": string }` — at least one series; `data` length must match `xAxis` length; `color` hex/CSS (required, theme-adjusted)

### katex

Display math block. Renders LaTeX via KaTeX (block/display mode).

**Required fields:** `type`, `content`

```json
{ "type": "katex", "content": "\\\\frac{1}{2} + \\\\sum_{i=1}^n i^2" }
```

- `content`: string — LaTeX source (display math). In JSON, escape backslashes as `\\\\` (e.g. `\\\\frac`, `\\\\sum`).

### tts (text-to-speech / speech-to-text vocabulary)

Dual-language element for vocabulary or phrases: label in article language, text in secondary language (spoken by TTS). Optional per-row speech-to-text (STT) lets the user practice pronunciation.

**Required fields:** `type`, `items`

**Optional root field:** `justRead` (boolean). When `justRead` is `true` and there is **exactly one** item in `items`, the block is shown in "just read" mode: in **preview** only a center-aligned play/stop button (with voice dropdown) is shown; the button label is the item's **`label`** if present, otherwise the default "Play". The block editor has no play button — replay is only in article preview. Use for pure TTS replay of long texts; stop is available for long playback. If there are multiple rows, `justRead` is ignored and the table is always shown.

**Default logic (user can override; if the user specifies another translation approach, prefer the user's instructions):**

- **Specification (when generating content):**
  - Write `label` in the **article language** (e.g. the main language of the article).
  - Write `text` in the **secondary language** (the language being learned or target TTS language).
  - Write `language` as specified by the user, in **BCP 47** (e.g. `"en-GB"`, `"cs-CZ"`). This is the TTS/STT engine language for that row.
- **STT:** For simple vocabulary (single words, short phrases) set `stt` to `true` so the user can practice pronunciation; for longer texts and sentences set `stt` to `false`.

```json
{
  "type": "tts",
  "items": [
    { "label": "žlutá", "text": "yellow", "language": "en-GB", "stt": true },
    { "label": "kuře", "text": "chicken", "language": "en-GB", "stt": true }
  ]
}
```

Just-read single-row example (long text; in preview: play/stop button with optional `label` as button title):
```json
{
  "type": "tts",
  "justRead": true,
  "items": [
    { "label": "Read chapter", "text": "The full paragraph or long passage to be read aloud...", "language": "en-GB", "stt": false }
  ]
}
```

- `justRead`: boolean — optional; when true and exactly one item, in preview show only play/stop + voice dropdown; button shows item `label` as title if set; no play in block editor
- `items`: array of `{ "label"?: string, "text": string, "language": string, "stt": boolean }` — at least one item
- `label`: string — optional; in vocabulary mode: term in article language (e.g. "žlutá"); in just-read mode: button title (e.g. "Read chapter")
- `text`: string — text to be spoken by TTS, in secondary language (e.g. "yellow")
- `language`: string — BCP 47 language code for TTS/STT (e.g. "en-GB", "cs")
- `stt`: boolean — if true, enable "Hold to record" for speech-to-text practice on this row

### quiz

Quiz. Type is given by `quizType`: "radio", "checkbox", "sort", "match". **Never mix option types in one quiz.**

**Required fields:** `type`, `question`, `quizType` plus type-specific fields (see below).

#### quizType: "radio" — single correct answer

```json
{
  "type": "quiz",
  "question": "How many colors are on the Czech flag?",
  "quizType": "radio",
  "options": [
    { "text": "One", "isCorrect": false },
    { "text": "Two", "isCorrect": false },
    { "text": "Three", "isCorrect": true }
  ]
}
```

- `options`: array of `{ "text": string, "isCorrect": boolean }` — exactly one `isCorrect: true`

#### quizType: "checkbox" — multiple correct answers

```json
{
  "type": "quiz",
  "question": "Which of these countries are in the EU?",
  "quizType": "checkbox",
  "options": [
    { "text": "Germany", "isCorrect": true },
    { "text": "Brazil", "isCorrect": false },
    { "text": "Poland", "isCorrect": true }
  ]
}
```

- at least one `isCorrect: true`

#### quizType: "sort" — ordering (drag & drop)

```json
{
  "type": "quiz",
  "question": "Order these animals by number of legs (fewest first)",
  "quizType": "sort",
  "sortOptions": [
    { "caption": "Spider", "order": 2 },
    { "caption": "Chicken", "order": 3 },
    { "caption": "Centipede", "order": 1 }
  ]
}
```

- `sortOptions`: array of `{ "caption": string, "order": number }` — at least 2 items, unique `order` (1 = first). **Output the array in random (shuffled) order**: the order of elements in the array is the display order shown to the user; the correct order is given by the `order` field. Do not output sortOptions in ascending order (1, 2, 3…).

#### quizType: "match" — matching pairs

```json
{
  "type": "quiz",
  "question": "Match chess engines with their specialty",
  "quizType": "match",
  "fixedCaptions": [
    { "caption": "Stockfish 18", "order": 1 },
    { "caption": "LC0", "order": 2 },
    { "caption": "Maia", "order": 3 }
  ],
  "matchOptions": [
    { "caption": "Has NNUE neural networks", "order": 1 },
    { "caption": "Most powerful on graphics cards", "order": 2 },
    { "caption": "Simulates human play style", "order": 3 }
  ]
}
```

- same count of `fixedCaptions` and `matchOptions`, matching `order` sets. **Output `matchOptions` in random (shuffled) order** in the array: the array order is the display order of the draggable options. Do not output matchOptions in the same order as fixedCaptions (1, 2, 3…).

⚠️ In stored JSON do not use fields added at publish time (quizId, isCorrectEncrypted, orderEncrypted).

### Unsupported type

Items with a `type` not in the known list (e.g. `"my-3D-model"`) are shown in the editor/preview as "We don't know how to render this type (type-name)".

## IMPORTANT RULES

1. **NEVER** add fields not in this specification
2. **NEVER** invent new item types
3. Follow type and field names **EXACTLY** (including case)
4. Always output a JSON object with a `content` key (array of ContentItems) in a ```json code block
5. When generating JSON, always escape double quotes inside string values with a backslash (`\"`). Never output raw unescaped `"` inside a JSON string value.

Example of correct escaping in a string:
```json
{ "content": "He said: \"Look!\"" }
```
