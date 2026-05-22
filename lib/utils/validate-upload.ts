// Extensões e magic bytes permitidos para upload de imagens
const ALLOWED: Record<string, { magic: number[]; mime: string }> = {
  jpg:  { magic: [0xFF, 0xD8, 0xFF],       mime: 'image/jpeg' },
  jpeg: { magic: [0xFF, 0xD8, 0xFF],       mime: 'image/jpeg' },
  png:  { magic: [0x89, 0x50, 0x4E, 0x47], mime: 'image/png'  },
  webp: { magic: [0x52, 0x49, 0x46, 0x46], mime: 'image/webp' },
  gif:  { magic: [0x47, 0x49, 0x46, 0x38], mime: 'image/gif'  },
}

export async function validateImageUpload(
  file: File,
  maxSizeMB = 5
): Promise<{ ok: true; ext: string } | { ok: false; error: string }> {
  // 1. Tamanho
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { ok: false, error: `Tamanho máximo: ${maxSizeMB}MB` }
  }

  // 2. Extensão
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED[ext]) {
    return { ok: false, error: 'Formato não permitido. Use JPG, PNG, WEBP ou GIF.' }
  }

  // 3. Magic bytes (verifica o conteúdo real do arquivo, não apenas o nome)
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const magic = ALLOWED[ext].magic
  const matches = magic.every((b, i) => bytes[i] === b)
  if (!matches) {
    return { ok: false, error: 'Arquivo inválido ou corrompido.' }
  }

  // 4. SVG é proibido mesmo que renomeado — busca tag <svg no conteúdo
  const text = new TextDecoder().decode(bytes.slice(0, 512)).toLowerCase()
  if (text.includes('<svg') || text.includes('<!doctype svg')) {
    return { ok: false, error: 'SVG não é permitido por segurança.' }
  }

  return { ok: true, ext }
}
