'use client'

/**
 * Comprime uma imagem no browser usando Canvas API antes do upload.
 * Reduz fotos de 3–10 MB para ~200–500 KB sem perda visual perceptível.
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number      // 0–1, padrão 0.82
    maxSizeKB?: number    // se definido, tenta reduzir até atingir
  } = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.82, maxSizeKB } = options

  // SVG e GIF animado: retorna sem alterar
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Calcula dimensões mantendo aspect ratio
      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width  = Math.round(width  * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }

      ctx.drawImage(img, 0, 0, width, height)

      const compress = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return }

            // Se ainda acima do maxSizeKB e qualidade pode baixar mais
            if (maxSizeKB && blob.size > maxSizeKB * 1024 && q > 0.4) {
              compress(q - 0.1)
              return
            }

            const ext      = file.type === 'image/png' ? 'png' : 'jpg'
            const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
            const name     = file.name.replace(/\.[^.]+$/, `.${ext}`)
            resolve(new File([blob], name, { type: mimeType }))
          },
          file.type === 'image/png' ? 'image/png' : 'image/jpeg',
          q
        )
      }

      compress(quality)
    }

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

/** Compressão para logos: quadrado pequeno, alta qualidade */
export function compressLogo(file: File): Promise<File> {
  return compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.88, maxSizeKB: 150 })
}

/** Compressão para fotos de ordens: resolução média, boa qualidade */
export function compressOrderImage(file: File): Promise<File> {
  return compressImage(file, { maxWidth: 1280, maxHeight: 960, quality: 0.82, maxSizeKB: 400 })
}
