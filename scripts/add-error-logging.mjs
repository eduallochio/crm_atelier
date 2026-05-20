import fs from 'fs'
import path from 'path'

function walk(dir) {
  let files = []
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f)
    if (fs.statSync(full).isDirectory()) files = files.concat(walk(full))
    else if (f.endsWith('.ts')) files.push(full)
  }
  return files
}

const skip = ['admin/errors', 'admin\\errors']
const allFiles = walk('app/api').filter(f => !skip.some(s => f.includes(s)))
let changed = 0

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8')
  if (content.includes('logServerError')) continue
  if (!content.includes('console.error')) continue

  // Substitui console.error('[context]', error) -> logServerError + console.error
  const updated = content.replace(
    /console\.error\(('[^']*'|"[^"]*"|`[^`]*`),\s*error\)/g,
    (match, ctx) => `logServerError(${ctx}, error); console.error(${ctx}, error)`
  )
  if (updated === content) continue

  // Adiciona import após o primeiro bloco de imports
  const withImport = updated.replace(
    /^((?:import[^\n]+\n)+)/m,
    `$1import { logServerError } from '@/lib/log-error'\n`
  )

  fs.writeFileSync(file, withImport)
  changed++
  console.log('updated:', file)
}
console.log(`\nDone: ${changed} files updated`)
