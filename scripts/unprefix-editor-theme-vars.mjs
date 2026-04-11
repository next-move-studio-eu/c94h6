/**
 * One-shot: strip --root- prefix from CSS custom properties and related class names in editor sources.
 */
import fs from 'node:fs'
import path from 'node:path'

const root = path.join(import.meta.dirname, '..', 'src')

const exts = new Set(['.tsx', '.ts', '.css', '.jsx', '.js'])

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name)
    if (name.isDirectory()) walk(p, out)
    else if (exts.has(path.extname(name.name))) out.push(p)
  }
  return out
}

const regexReplacements = [
  [/var\(--root-/g, 'var(--'],
  [/text-root-text/g, 'text-text'],
  [/text-root-error/g, 'text-error'],
  [/text-root-warning/g, 'text-warning'],
  [/scrollbar-root/g, 'scrollbar-theme'],
]

/** Template / class strings using dynamic prefix */
const stringReplacements = [
  ['`var(--${EDITOR_THEME_CSS_PREFIX}-', '`var(--'],
  ['`text-[var(--${EDITOR_THEME_CSS_PREFIX}-', '`text-[var(--'],
  ['text-[var(--${EDITOR_THEME_CSS_PREFIX}-', 'text-[var(--'],
  ['e.currentTarget.style.backgroundColor = `var(--${EDITOR_THEME_CSS_PREFIX}-', 'e.currentTarget.style.backgroundColor = `var(--'],
]

for (const file of walk(root)) {
  let s = fs.readFileSync(file, 'utf8')
  const orig = s
  for (const [re, to] of regexReplacements) s = s.replace(re, to)
  for (const [from, to] of stringReplacements) s = s.split(from).join(to)
  if (s !== orig) fs.writeFileSync(file, s)
}
