# What we are and what we are not

This is a simple source code editor for your content. We focus on general open standards with long-term readability, and its output is almost naively straightforward – a ZIP folder with files whose behaviour is glued together by a JSON file. We are not a presentation layer, and this editor is not intended to be a reader for files produced this way. The content preview is a best-effort display so you have a rough idea of the parameters of what you are currently creating.

## Core block types

- **Markdown text**
- **Image**
- **Image slideshow**
- **Video in article**
- **Audio in article**
- **Quiz**
- **Chess diagram**
- **Game against engine**
- **Chess video**
- **DOT diagram**
- **Pie chart**
- **Bar chart**
- **TTS**
- **KaTeX**
- **SMILES**

## Formats we use

- **MD** — Markdown
- **AVIF** — Images
- **AV1** — Video
- **Opus** — Audio
- **FEN** — Chess
- **DOT** — Diagrams
- **LaTeX** — Mathematics
- **SMILES** — Chemistry

We do not support JPG, PNG or H.264 by default — formats we all know well, but which already have their best years behind them. In the editor you can add any items to the JSON and files to the ZIP folder, and teach your presentation layer to read this data correctly.

## Why use this editor

- **Open source** — Nobody keeps your content locked inside their SaaS
- **LLM ready** — You set the form and direction, AI handles the technical part

### Data format

- We store data, not the way it is rendered
- Works well in both light and dark mode
- You can easily swap out the presentation layer
- No styled HTML, MDX or other framework-specific solutions

## What can I create in the editor

- Custom educational content
- Foreign language learning
- News, blogs
- Article translation
- Interactive competitions, homework assignments
- Polls

## What we would like in the future

If we secure funding for such a direction, we would like to offer a basic open source dockerised presentation layer — both frontend and backend — that you could deploy on a school, municipality or personal website subdomain. We would also like to explore the possibilities of connecting to the decentralised Matrix network for sharing homework assignments or questionnaires within a closed community.
