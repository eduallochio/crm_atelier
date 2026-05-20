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
const files = walk('app/api').filter(f => !skip.some(s => f.includes(s)))
let fixed = 0

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')

  // Detecta o padrão quebrado: import { ... \nimport { logServerError ... \n  continuação
  // Padrão: "import {\nimport { logServerError } from '@/lib/log-error'\n"
  if (!content.includes("import {\nimport { logServerError }")) continue

  // Remove o import mal posicionado de dentro do bloco
  let fixed_content = content.replace(
    /^(import \{)\nimport \{ logServerError \} from '@\/lib\/log-error'\n/m,
    '$1\n'
  )

  // Adiciona o import corretamente após o último import do bloco inicial
  // Encontra o fim do primeiro bloco de imports (última linha que começa com 'import')
  fixed_content = fixed_content.replace(
    /^((?:import[^\n]+\n)+)/m,
    `$1import { logServerError } from '@/lib/log-error'\n`
  )

  fs.writeFileSync(file, fixed_content)
  fixed++
  console.log('fixed:', file)
}
console.log(`\nDone: ${fixed} files fixed`)
