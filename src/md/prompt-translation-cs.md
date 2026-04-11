# Pravidla překladu článků (content.json)

⚠️ **KRITICKÉ: Při překladu NEMĚŇTE technické části — pouze přirozený lidský text!**

🚨 **VÝSTUP: VŽDY poskytuj přeložený JSON (objekt s klíčem `content` obsahujícím pole) v code bloku s ```json, ne jako formátovaný text!**

## Vícejazyčný obsah a vlastní pravidla

**Buď připraven přijmout vlastní pravidla překladu**, která uživatel dodá v rámci stejné konverzace. Dokumenty mohou obsahovat **vícejazyčný obsah** (např. články pro výuku jazyků s L1/L2, sekce ve více jazycích nebo terminologie, která musí zůstat v daném jazyce). Když uživatel zadá doplňující instrukce — např. „překládej jen anglické části“, „francouzské termíny nech beze změny“, „doplň fonetický přepis u čínštiny“ nebo pravidla pro jednotlivé jazyky — **tato pravidla aplikuj navíc k** technickým pravidlům níže. Pokud vlastní pravidla nejsou zadána, překládej lidský text podle zdrojového/cílového jazykového páru daného úkolem (např. EN ↔ CS).

Článek je uložen v souboru **content.json** uvnitř **content.zip**. Soubor je JSON objekt s klíčem `content` — pole objektů (ContentItem). Každá položka má `type` a další pole dle typu. **Nepoužívá se MDX.**

## ✅ PŘEKLÁDAT (lidský text):

1. **V položkách type: "markdown":**
   - Celý řetězec v poli `content` (nadpisy, odstavce, seznamy, odkazy včetně šachových tahů v textu)

2. **Pole s lidským textem v ostatních typech:**
   - `title` a `body` v accordion
   - `caption` v photo-article
   - `text` v chess-diagram (volitelný popisek pod šachovnicí)
   - `question` v quiz
   - `text` v options (radio/checkbox)
   - `caption` v sortOptions, fixedCaptions, matchOptions
   - `title` u video (WebM), article-audio, chess-video, slideshow, smiles
   - `name` v pie a bar (volitelný nadpis grafu)
   - `label` v poli `data` u pie (popisky výsečí)
   - pole `xAxis` a `name` u každé řady v bar `series` (popisky kategorií a názvy řad)
   - **tts:** Záleží na `justRead`. **Neměň** kořenové pole `justRead` (boolean) ani v položkách `language` nebo `stt`. **Režim slovníčku** (justRead false nebo chybí): překládej pouze **`label`** (jazyk článku); **nepřekládej** `text` (TTS/druhý jazyk). **Režim pouze přehrát** (justRead true): překládej **`label`** (název tlačítka) i **`text`** (text k předčítání) jako běžný obsah. Pokud uživatel zadá jiný přístup k překladu u tts, upřednostni uživatelův požadavek.

3. **Šachové tahy v přirozeném textu (v markdown content nebo v textech):**
   - EN → CS: Nf3 → Jf3, Bb5 → Sb5, Qd4 → Dd4
   - CS → EN: Jf3 → Nf3, Sb5 → Bb5, Dd4 → Qd4
   - ⚠️ Používejte střídmě — pouze několik tahů od výchozí pozice/diagramu dává smysl

## ❌ NEPŘEKLÁDAT (technické části):

1. **Názvy typů a polí:**
   - `type`, `content`, `title`, `body`, `accordionType`, `fen`, `highlights`, `lookingOnWhite`, `imageId`, `caption`, `videoNumber`, `videoId`, `audioId`, `smiles`, `slideshowNumber`, `playWithWhite`, `question`, `quizType`, `options`, `text`, `isCorrect`, `sortOptions`, `fixedCaptions`, `matchOptions`, `order`, `bestMove`, `name`, `data`, `xAxis`, `series`, `justRead`, `items`, `stt` — názvy NEMĚNIT, překládat pouze hodnoty tam, kde jde o lidský text

2. **Hodnoty technických polí:**
   - `type` hodnoty: "markdown", "accordion", "chess-diagram", "photo-article", "chess-video", "video", "article-audio", "smiles", "slideshow", "play-engine", "dot", "pie", "bar", "katex", "tts", "quiz" — NEMĚNIT
   - `accordionType`: "Info", "Bike", "Lightbulb" atd. — NEMĚNIT
   - `fen`: FEN notace — NIKDY NEPŘEKLÁDAT!
   - `highlights`: "e4Y,d4G" — NEMĚNIT
   - `bestMove`, UCI: "e2e4", "d7e8q" — NIKDY NEPŘEKLÁDAT!
   - `imageId`, `videoNumber`, `slideshowNumber`, `order`: čísla — neměnit
   - `videoId`, `audioId`: "1", "2" — NEMĚNIT
   - smiles: pole `smiles` — SMILES řetězec, NIKDY NEPŘEKLÁDAT! Pole `title` u typu smiles překládej (lidský text).
   - `lookingOnWhite`, `playWithWhite`, `isCorrect`: true/false — NEMĚNIT
   - `quizType`: "radio", "checkbox", "sort", "match" — NEMĚNIT
   - pie: `data[].value`, `data[].color` — neměnit; bar: `series[].data`, `series[].color` — neměnit
   - katex: `content` — LaTeX/matematika, NEPŘEKLÁDAT (nechat beze změny)
   - tts: **neměň** kořenové pole `justRead` (boolean). U každé položky **neměň** `language` (BCP 47) ani `stt` (boolean). **Režim slovníčku** (justRead false nebo chybí): **nepřekládej** `text`; překládej pouze `label`. **Režim pouze přehrát** (justRead true): překládej `label` (název tlačítka) i `text` (text k předčítání).

3. **Programovací kód v markdown content:**
   - Obsah v ``` code blocks ``` a inline `kód` — neměnit (nebo jen komentáře, pokud výukové)

4. **URL adresy** — neměnit

## PŘÍKLAD — Překlad EN → CS:

**Originál (EN) content.json:**
```json
[
  { "type": "markdown", "content": "## Opening Principles\n\nAfter 1.e4, White develops with Nf3 and Bb5." },
  { "type": "chess-diagram", "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", "highlights": "e4Y", "lookingOnWhite": true },
  { "type": "markdown", "content": "After 1.e4, White develops with Nf3 and Bb5." },
  { "type": "quiz", "question": "Which of these is a chess piece?", "quizType": "radio", "options": [{ "text": "Knight", "isCorrect": true }, { "text": "Ace", "isCorrect": false }] },
  { "type": "accordion", "title": "Why Nf3?", "accordionType": "Lightbulb", "body": "The knight move Nf3 controls the center." },
  { "type": "photo-article", "imageId": 1, "caption": "World Champion" },
  { "type": "video", "videoId": "1", "title": "Watch the full game" }
]
```

**Překlad (CS):** překládejte pouze hodnoty řetězců, které jsou lidský text (content v markdown, question, title, body, caption). Všechny názvy polí, hodnoty `type`, `quizType`, `accordionType`, FEN, bestMove, čísla a boolean nechte beze změny.

- ✅ "Opening Principles" → "Zásady zahájení"
- ✅ "After 1.e4, White develops with Nf3 and Bb5." → "Po 1.e4 bílý rozvíjí Jf3 a Sb5."
- ✅ "Which of these is a chess piece?" → "Které z toho je šachová figura?"
- ✅ "Knight" → "Jezdec", "Ace" → "Eso"
- ✅ "Why Nf3?" → "Proč Jf3?"
- ✅ "The knight move Nf3 controls the center." → "Tah jezdcem Jf3 kontroluje centrum."
- ✅ "World Champion" → "Mistr světa"
- ✅ "Watch the full game" → "Sledujte celou partii"
- ❌ `type`, `fen`, `bestMove`, `accordionType`, `videoId` atd. — beze změny
