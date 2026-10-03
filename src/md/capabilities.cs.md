# Co jsme a co nejsme

Toto je jednoduchý editor zdrojového kódu pro váš obsah. Zaměřujeme se na obecné otevřené standardy s dlouhodobou čitelností a jeho výstup je až naivně jednoduchý – ZIP složka se soubory, jejichž chování je slepeno JSON souborem. Nejsme prezentační vrstva a tento editor nemá za cíl být čtečkou takto vyrobených souborů. Náhled obsahu je best effort zobrazení, ať máte představu, jaké zhruba parametry má to, co právě vyrábíte.

## Typy bloků v základu

- **Markdown text**
- **Obrázek**
- **Prezentace obrázků**
- **Video v článku**
- **Audio v článku**
- **Kvíz**
- **Šachový diagram**
- **Hra s enginem**
- **Šachové video**
- **DOT diagram**
- **Koláčový graf**
- **Sloupcový graf**
- **TTS**
- **KaTeX**
- **SMILES**

## Formáty, které používáme

- **MD** — Markdown
- **AVIF** — Obrázky
- **AV1** — Video
- **Opus** — Audio
- **FEN** — Šachy
- **DOT** — Diagramy
- **LaTeX** — Matematika
- **SMILES** — Chemie

V základu nepodporujeme JPG, PNG ani H.264, formáty, které všichni dobře známe, ale které už mají svá nejlepší léta za sebou. V editoru si můžete přidat libovolné položky do JSONu i soubory do ZIP složky a naučit svou prezentační vrstvu tato data správně přečíst.

## Proč používat tento editor

- **Open source** — Nikdo nedrží váš obsah uvězněný ve svém SaaS
- **LLM ready** — Vy udáte formu a směr, technickou část vyřeší AI

### Datový formát

- Ukládáme data, ne způsob jejich vykreslení
- Výhoda pro světlý i tmavý režim
- Můžete snadno vyměnit prezentační vrstvu
- Žádné nastylované HTML, MDX ani jiné framework specifika

## Co v editoru mohu vyrábět

- Výukový obsah na míru
- Výuka cizího jazyka
- Zpravodajství, blogy
- Překlad článků
- Interaktivní soutěže, domácí úkoly
- Hlasování

## Co bychom rádi v budoucnu

Pokud pro takový směr zajistíme financování, rádi bychom nabídli základní open source dockerizovanou prezentační vrstvu, frontend i backend, kterou byste si mohli hodit třeba na subdoménu školy, obce nebo svého webu. Rádi bychom prověřili možnosti napojení na decentralizovanou síť Matrix pro sdílení domácích úkolů nebo dotazníků v rámci uzavřené komunity.