# Technická specifikace JSON obsahu článku (ContentItem)

⚠️ **KRITICKÉ: Používejte POUZE tyto typy položek s PŘESNĚ těmito poli. NEVYMÝŠLEJTE vlastní typy nebo pole!**

🚨 **VÝSTUP: VŽDY poskytuj JSON objekt s klíčem `content` (pole ContentItemů) v code bloku s ```json, NIKDY neformátuj jako běžný markdown do chat okna!**

Příklad správného výstupu:
```json
{
  "content": [
    { "type": "markdown", "content": "# Nadpis článku\n\nObsah..." },
    { "type": "chess-diagram", "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "highlights": "", "lookingOnWhite": true }
  ]
}
```

## Struktura

Tělo článku je v souboru `content.json` (uvnitř `content.zip`) uloženo jako **objekt** s jediným klíčem **`content`** — pole ContentItemů. Každý prvek je rozlišen polem `type`. Text (nadpisy, odstavce, kód, tabulky) je v položkách `type: "markdown"` s polem `content` (čistý Markdown). Akordeon má tělo (`body`) pouze v Markdownu.

## Typy ContentItem (editor-time)

### markdown

Všechny textové bloky: nadpisy, odstavce, kód, tabulky. Jedna řetězec v Markdownu.

**Povinná pole:** `type`, `content`

```json
{ "type": "markdown", "content": "## Sekce\n\nOdstavec s **tučným** textem.\n\n```\nkód\n```" }
```

- `content`: string — čistý Markdown (žádný MDX, žádný JSX)

### accordion

Rozbalovací sekce. **Tělo je pouze Markdown** (bez MDX, bez vnořeného JSON).

**Povinná pole:** `type`, `title`, `accordionType`, `body`

```json
{
  "type": "accordion",
  "title": "Nadpis akordeonu",
  "accordionType": "Info",
  "body": "Markdown obsah zde.\n\n- odrážka 1\n- odrážka 2"
}
```

- `title`: string — nadpis akordeonu
- `accordionType`: string — POUZE: "Info", "Bike", "Mountain", "Tent", "MapPin", "Train", "Bus", "Ship", "Plane", "Car", "Code", "ShieldCheck", "CircleAlert", "Castle", "EyeOff", "Lightbulb"
- `body`: string — obsah v čistém Markdownu.

### chess-diagram

Šachovnice — statická nebo interaktivní výzva „Zahrej tah". Pro interaktivní režim použijte `bestMove`.

**Povinná pole:** `type`, `fen`, `highlights`, `lookingOnWhite`

**Volitelná:** `bestMove`, `text`

```json
{
  "type": "chess-diagram",
  "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
  "highlights": "e4Y,d4G",
  "lookingOnWhite": true
}
```

S volitelnou výzvou nejlepšího tahu a popiskem:
```json
{
  "type": "chess-diagram",
  "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
  "highlights": "",
  "lookingOnWhite": true,
  "bestMove": "f3g5",
  "text": "Bílý táhne — najděte nejlepší tah."
}
```

- `fen`: string — FEN notace pozice (POVINNÉ!)
- `highlights`: string — např. "e4Y,d4G,g1f3R" (pole+barva: G=zelená, R=červená, Y=žlutá, B=modrá, O=oranžová, P=fialová)
- `lookingOnWhite`: boolean — true nebo false
- `bestMove`: string — volitelný tah v UCI notaci (např. "e2e4", "d7e8q"); pokud je nastaven, šachovnice se stane interaktivní výzvou „uhádněte nejlepší tah": uživatel zahraje tah a uvidí zelenou šipku pro správný tah; při špatném tahu se zobrazí červená šipka pro jeho tah a zelená pro správný
- `text`: string — volitelný popisek zobrazený zarovnaně na střed pod šachovnicí (např. zdroj pozice, herní kontext)

### photo-article

Obrázek v článku. Odkazuje na číslovaný soubor (1.avif, 2.avif...).

**Povinná pole:** `type`, `imageId`

**Volitelné:** `caption`

```json
{ "type": "photo-article", "imageId": 1 }
{ "type": "photo-article", "imageId": 2, "caption": "Popisek" }
```

- `imageId`: number — 1, 2, 3... (soubor 1.avif, 2.avif...)
- `caption`: string — volitelný popisek

### chess-video (šachové video)

Odkaz na balíček chessvideoN.zip.

**Povinná pole:** `type`, `videoNumber`

**Volitelné:** `title`

```json
{ "type": "chess-video", "videoNumber": 1 }
{ "type": "chess-video", "videoNumber": 2, "title": "Nadpis videa" }
```

- `videoNumber`: number — 1, 2, 3... (chessvideo1.zip, chessvideo2.zip...)
- `title`: string — volitelný nadpis bloku

### video (WebM v článku)

Video přímo v článku (video1.webm, video2.webm...). Obsah je vždy sbalený na začátku.

**Povinná pole:** `type`, `videoId`, `title`

```json
{ "type": "video", "videoId": "1", "title": "Úvod do zahájení" }
```

- `videoId`: string — "1", "2"... (video1.webm, video2.webm...)
- `title`: string — nadpis videa

### article-audio

Audio přímo v článku (audio1.webm, audio2.webm...). Obsah je vždy sbalený na začátku.

**Povinná pole:** `type`, `audioId`

**Volitelné:** `title`

```json
{ "type": "article-audio", "audioId": "1" }
{ "type": "article-audio", "audioId": "2", "title": "Úvod (audio)" }
```

- `audioId`: string — "1", "2"... (audio1.webm, audio2.webm...)
- `title`: string — volitelný nadpis audia

### smiles

Chemická struktura z řetězce SMILES. Vykresluje se jako 2D struktura (prezentační vrstva může volit styl zobrazení).

**Povinná pole:** `type`, `smiles`

**Volitelné:** `title`

```json
{ "type": "smiles", "smiles": "CC(=O)Oc1ccccc1C(=O)O" }
{ "type": "smiles", "smiles": "CCO", "title": "Ethanol" }
```

- `smiles`: string — SMILES řetězec molekuly (POVINNÉ!)
- `title`: string — volitelný nadpis nad strukturou

### slideshow

Galerie obrázků (slideshowN.zip).

**Povinná pole:** `type`, `slideshowNumber`

**Volitelné:** `title`

```json
{ "type": "slideshow", "slideshowNumber": 1 }
{ "type": "slideshow", "slideshowNumber": 2, "title": "Nadpis prezentace" }
```

- `slideshowNumber`: number — 1, 2, 3...
- `title`: string — volitelný nadpis

### play-engine

Interaktivní hra proti enginu.

**Povinná pole:** `type`, `fen`, `playWithWhite`

```json
{
  "type": "play-engine",
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "playWithWhite": true
}
```

- `fen`: string — FEN startovní pozice (POVINNÉ!)
- `playWithWhite`: boolean — true/false

### dot

Diagram Graphviz DOT. Pole `content` obsahuje DOT zdroj; vykresluje se jako SVG.

**Povinná pole:** `type`, `content`

```json
{ "type": "dot", "content": "digraph G { A -> B; B -> C; }" }
```

- `content`: string — zdroj Graphviz DOT (např. `digraph G { ... }`)
- **Barvy v DOT:** Když používáte barvy (vyplň uzlů, barva hran, fontcolor atd.), používejte barvy **střední světlosti**. Prezentační vrstva pak aplikuje postprocessing, aby text, rámečky, šipky a další prvky měly dostatečný kontrast na světlém i tmavém motivu.

### pie

Koláčový graf. Vykresluje výseče z pole label/hodnota/barva. Barvy se přizpůsobí motivu.

**Povinná pole:** `type`, `name`, `data`

```json
{
  "type": "pie",
  "name": "Podíl na trhu 2024",
  "data": [
    { "label": "Produkt A", "value": 45, "color": "#e14951" },
    { "label": "Produkt B", "value": 30, "color": "#4a90d9" },
    { "label": "Ostatní", "value": 25, "color": "#6bbf59" }
  ]
}
```

- `name`: string — nadpis nad grafem (povinné)
- `data`: pole objektů `{ "label": string, "value": number, "color": string }` — alespoň jedna výseč; `color` hex/CSS (povinné); prezentace aplikuje úpravu podle motivu

### bar

Sloupcový graf. Vykresluje sloupce z popisků osy x a jedné či více řad (název, pole hodnot, barva). Barvy se přizpůsobí motivu.

**Povinná pole:** `type`, `name`, `xAxis`, `series`

```json
{
  "type": "bar",
  "name": "Tržby po čtvrtletích",
  "xAxis": ["Q1", "Q2", "Q3", "Q4"],
  "series": [
    { "name": "2023", "data": [10, 15, 12, 18], "color": "#5b8def" },
    { "name": "2024", "data": [12, 17, 14, 22], "color": "#2e7d32" }
  ]
}
```

- `name`: string — nadpis nad grafem (povinné)
- `xAxis`: pole řetězců — popisky kategorií (stejná délka jako pole `data` u každé řady)
- `series`: pole objektů `{ "name": string, "data": number[], "color": string }` — alespoň jedna řada; délka `data` musí odpovídat délce `xAxis`; `color` hex/CSS (povinné, přizpůsobí se motivu)

### katex

Blok s matematikou (display mode). Vykresluje LaTeX přes KaTeX.

**Povinná pole:** `type`, `content`

```json
{ "type": "katex", "content": "\\\\frac{1}{2} + \\\\sum_{i=1}^n i^2" }
```

- `content`: string — LaTeX zdroj (bloková matematika). V JSON zpětné lomítko escapujte jako `\\\\` (např. `\\\\frac`, `\\\\sum`).

### tts (text-to-speech / speech-to-text slovníček)

Dvojjazyčný prvek pro slovníček nebo fráze: popisek v jazyce článku, text v druhém jazyce (přehrávaný TTS). Volitelné řádkové speech-to-text (STT) umožňuje uživateli trénovat výslovnost.

**Povinná pole:** `type`, `items`

**Volitelné pole na kořeni:** `justRead` (boolean). Když je `justRead` `true` a v `items` je **právě jedna** položka, blok je v režimu „pouze přehrát“: v **náhledu** se zobrazí jen centrované tlačítko přehrát/zastavit a výběr hlasu; text tlačítka je **`label`** položky, pokud je vyplněn, jinak výchozí „Přehrát“. V editoru bloku není tlačítko přehrát — přehrávání je pouze v náhledu článku. Použij pro čisté TTS přehrání dlouhých textů; u dlouhého přehrávání je k dispozici zastavení. Při více řádcích se `justRead` ignoruje a vždy se zobrazí tabulka.

**Výchozí logika (uživatel může přepsat; pokud uživatel zadá jiný přístup k překladu, upřednostni uživatelův požadavek):**

- **Specifikace (při generování obsahu):**
  - Piš `label` v **jazyce článku** (hlavní jazyk článku).
  - Piš `text` v **druhém jazyce** (jazyk, který se uživatel učí, nebo cílový jazyk TTS).
  - Piš `language` podle pokynu uživatele ve formátu **BCP 47** (např. `"en-GB"`, `"cs-CZ"`). Jde o jazyk TTS/STT enginu pro daný řádek.
- **STT:** U jednoduché slovní zásoby (jednotlivá slova, krátké fráze) nastav `stt` na `true`, aby uživatel mohl trénovat výslovnost; u delších textů a vět nastav `stt` na `false`.

```json
{
  "type": "tts",
  "items": [
    { "label": "žlutá", "text": "yellow", "language": "en-GB", "stt": true },
    { "label": "kuře", "text": "chicken", "language": "en-GB", "stt": true }
  ]
}
```

Příklad jednoho řádku v režimu pouze přehrát (v náhledu: tlačítko s volitelným `label` jako názvem):
```json
{
  "type": "tts",
  "justRead": true,
  "items": [
    { "label": "Přečíst kapitolu", "text": "Celý odstavec nebo dlouhý úryvek k předčítání...", "language": "en-GB", "stt": false }
  ]
}
```

- `justRead`: boolean — volitelné; když true a právě jedna položka, v náhledu jen přehrát/zastavit a výběr hlasu; tlačítko zobrazí `label` jako název, pokud je nastaven; v editoru bloku není přehrávání
- `items`: pole objektů `{ "label"?: string, "text": string, "language": string, "stt": boolean }` — alespoň jedna položka
- `label`: string — volitelné; ve slovníčku: výraz v jazyce článku (např. "žlutá"); v režimu pouze přehrát: název tlačítka (např. "Přečíst kapitolu")
- `text`: string — text, který přehrává TTS, v druhém jazyce (např. "yellow")
- `language`: string — kód jazyka BCP 47 pro TTS/STT (např. "en-GB", "cs")
- `stt`: boolean — pokud true, zapne u tohoto řádku „Podrž pro nahrání“ (speech-to-text)

### quiz

Kvíz. Typ určuje pole `quizType`: "radio", "checkbox", "sort", "match". **Nikdy nemíchejte typy opcí v jednom kvízu.**

**Povinná pole:** `type`, `question`, `quizType` + pole dle typu (viz níže).

#### quizType: "radio" — jedna správná odpověď

```json
{
  "type": "quiz",
  "question": "Kolik barev má česká vlajka?",
  "quizType": "radio",
  "options": [
    { "text": "Jednu", "isCorrect": false },
    { "text": "Dvě", "isCorrect": false },
    { "text": "Tři", "isCorrect": true }
  ]
}
```

- `options`: pole objektů `{ "text": string, "isCorrect": boolean }` — přesně jedna `isCorrect: true`

#### quizType: "checkbox" — více správných odpovědí

```json
{
  "type": "quiz",
  "question": "Které z těchto zemí jsou v EU?",
  "quizType": "checkbox",
  "options": [
    { "text": "Německo", "isCorrect": true },
    { "text": "Brazílie", "isCorrect": false },
    { "text": "Polsko", "isCorrect": true }
  ]
}
```

- alespoň jedna `isCorrect: true`

#### quizType: "sort" — seřazení (drag & drop)

```json
{
  "type": "quiz",
  "question": "Seřaď tato zvířata od nejméně noh po nejvíce",
  "quizType": "sort",
  "sortOptions": [
    { "caption": "Pavouk", "order": 2 },
    { "caption": "Slepice", "order": 3 },
    { "caption": "Stonožka", "order": 1 }
  ]
}
```

- `sortOptions`: pole `{ "caption": string, "order": number }` — minimálně 2 položky, `order` jedinečné (1 = první). **Vypisuj pole v náhodném (zamíchaném) pořadí**: pořadí prvků v poli je pořadí zobrazené uživateli; správné pořadí určuje pole `order`. Nevypisuj sortOptions v rostoucím pořadí (1, 2, 3…).

#### quizType: "match" — párování

```json
{
  "type": "quiz",
  "question": "Přiřaď šachové enginy k jejich specialitě",
  "quizType": "match",
  "fixedCaptions": [
    { "caption": "Stockfish 18", "order": 1 },
    { "caption": "LC0", "order": 2 },
    { "caption": "Maia", "order": 3 }
  ],
  "matchOptions": [
    { "caption": "Má NNUE neuronové sítě", "order": 1 },
    { "caption": "Nejsilnější na grafických kartách", "order": 2 },
    { "caption": "Simuluje lidský styl hry", "order": 3 }
  ]
}
```

- stejný počet `fixedCaptions` a `matchOptions`, shodné sady hodnot `order`. **Vypisuj `matchOptions` v náhodném (zamíchaném) pořadí** v poli: pořadí v poli je pořadí zobrazení přetahovatelných možností. Nevypisuj matchOptions ve stejném pořadí jako fixedCaptions (1, 2, 3…).

⚠️ V uloženém JSON nepoužívejte pole přidávaná při publikaci (quizId, isCorrectEncrypted, orderEncrypted).

### Nepodporovaný typ

Položky s `type`, které není v seznamu známých (např. `"my-3D-model"`), se v editoru/náhledu zobrazí jako „Nevíme, jak tento typ zobrazit (název-typu)”.

## DŮLEŽITÉ ZÁSADY

1. **NIKDY** nepřidávejte pole, která nejsou v této specifikaci
2. **NIKDY** nevymýšlejte nové typy položek
3. Dodržujte **PŘESNĚ** názvy typů a polí (včetně velkých/malých písmen)
4. Výstup vždy jako platný JSON objekt s klíčem `content` (pole ContentItemů) v code bloku ```json
5. Při generování JSON uvozovky uvnitř řetězců vždy escapujte zpětným lomítkem (`\"`). Nikdy nevypisujte neescapované `"` uvnitř hodnoty řetězce v JSON.

Příklad správného escapování v řetězci:
```json
{ "content": "A najednou řekl: \"Dívej!\"." }
```
