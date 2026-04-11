# Article translation rules (content.json)

⚠️ **CRITICAL: When translating, DO NOT CHANGE technical parts — only natural human text!**

🚨 **OUTPUT: ALWAYS provide the translated JSON (object with `content` key containing the array) in a code block with ```json, not as formatted text!**

## Multilingual content and custom rules

**Be ready to accept custom translation rules** supplied by the user in the same conversation. Documents may contain content in **multiple languages** (e.g. language-learning articles with L1/L2, mixed-language sections, or terminology that must stay in a specific language). When the user provides extra instructions — such as “translate only the English parts”, “keep French terms as-is”, “add phonetic transcription for Chinese”, or per-language rules — **apply those rules in addition to** the technical rules below. If no custom rules are given, translate human text according to the source/target language pair implied by the task (e.g. EN ↔ CS).

The article is stored in **content.json** inside **content.zip**. The file is a JSON object with a `content` key — an array of objects (ContentItem). Each item has `type` and other fields by type. **No MDX is used.**

## ✅ TRANSLATE (human text):

1. **In items with type: "markdown":**
   - The full string in the `content` field (headings, paragraphs, lists, links, including chess moves written in text)

2. **Fields with human text in other types:**
   - `title` and `body` in accordion
   - `caption` in photo-article
   - `text` in chess-diagram (optional caption below the board)
   - `question` in quiz
   - `text` in options (radio/checkbox)
   - `caption` in sortOptions, fixedCaptions, matchOptions
   - `title` in video (WebM), article-audio, chess-video, slideshow, smiles
   - `name` in pie and bar (optional chart title)
   - `label` in pie `data` array (slice labels)
   - `xAxis` array and `name` in each bar `series` (category labels and series names)
   - **tts:** Depends on `justRead`. Do **not** change the root field `justRead` (boolean) or per-item `language` or `stt`. **Vocabulary mode** (justRead false or absent): translate **`label`** only (article language); do **not** translate `text` (TTS/second language). **Just-read mode** (justRead true): translate both **`label`** (button title) and **`text`** (prose to be read aloud) as normal content. If the user specifies another translation approach for tts, prefer the user's instructions.

3. **Chess moves in natural text (in markdown content or in those text fields):**
   - EN → CS: Nf3 → Jf3, Bb5 → Sb5, Qd4 → Dd4
   - CS → EN: Jf3 → Nf3, Sb5 → Bb5, Dd4 → Qd4
   - ⚠️ Use sparingly — only a few moves from the starting position/diagram make sense

## ❌ DO NOT TRANSLATE (technical parts):

1. **Type and field names:**
   - `type`, `content`, `title`, `body`, `accordionType`, `fen`, `highlights`, `lookingOnWhite`, `imageId`, `caption`, `videoNumber`, `videoId`, `audioId`, `smiles`, `slideshowNumber`, `playWithWhite`, `question`, `quizType`, `options`, `text`, `isCorrect`, `sortOptions`, `fixedCaptions`, `matchOptions`, `order`, `bestMove`, `name`, `data`, `xAxis`, `series`, `justRead`, `items`, `stt` — do not change the names; translate only the values where they are human text

2. **Technical field values:**
   - `type` values: "markdown", "accordion", "chess-diagram", "photo-article", "chess-video", "video", "article-audio", "smiles", "slideshow", "play-engine", "dot", "pie", "bar", "katex", "tts", "quiz" — DO NOT CHANGE
   - `accordionType`: "Info", "Bike", "Lightbulb" etc. — DO NOT CHANGE
   - `fen`: FEN notation — NEVER TRANSLATE!
   - `highlights`: "e4Y,d4G" — DO NOT CHANGE
   - `bestMove`, UCI: "e2e4", "d7e8q" — NEVER TRANSLATE!
   - `imageId`, `videoNumber`, `slideshowNumber`, `order`: numbers — do not change
   - `videoId`, `audioId`: "1", "2" — DO NOT CHANGE
   - smiles: field `smiles` — SMILES string, NEVER TRANSLATE! Field `title` in type smiles: translate (human text).
   - `lookingOnWhite`, `playWithWhite`, `isCorrect`: true/false — DO NOT CHANGE
   - `quizType`: "radio", "checkbox", "sort", "match" — DO NOT CHANGE
   - pie: `data[].value`, `data[].color` — do not change; bar: `series[].data`, `series[].color` — do not change
   - katex: `content` — LaTeX/math, DO NOT TRANSLATE (keep as-is)
   - tts: do **not** change root field `justRead` (boolean). In each item, do **not** change `language` (BCP 47) or `stt` (boolean). **Vocabulary mode** (justRead false/absent): do **not** translate `text`; translate only `label`. **Just-read mode** (justRead true): translate both `label` (button title) and `text` (prose to be read aloud).

3. **Programming code in markdown content:**
   - Content in ``` code blocks ``` and inline `code` — do not change (or only comments if educational)

4. **URL addresses** — do not change

## EXAMPLE — Translation EN → CS:

**Original (EN) content.json:** translate only the string values that are human text (content in markdown items, question, title, body, caption). Leave all field names, `type` values, `quizType`, `accordionType`, FEN, bestMove, numbers and booleans unchanged.

- ✅ "Opening Principles" → "Zásady zahájení"
- ✅ "After 1.e4, White develops with Nf3 and Bb5." → "Po 1.e4 bílý rozvíjí Jf3 a Sb5."
- ✅ "Find the best move for White" → "Najdi nejlepší tah pro bílého"
- ✅ "Why Nf3?" → "Proč Jf3?"
- ✅ Accordion body, captions, video titles — translate
- ❌ `type`, `fen`, `bestMove`, `accordionType`, `videoId` etc. — unchanged
