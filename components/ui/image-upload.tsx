'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageUploadProps {
  orderId?: string
  organizationId: string
  onImagesChange: (urls: string[]) => void
  existingImages?: string[]
  maxFiles?: number
}

export function ImageUpload({
  onImagesChange,
  existingImages = [],
  maxFiles = 5,
}: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(existingImages)
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > maxFiles) {
      alert(`Máximo de ${maxFiles} imagens permitido`)
      return
    }

    setUploading(true)
    try {
      const uploadedUrls: string[] = []

      for (const file of acceptedFiles) {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload/images', { method: 'POST', body: formData })
        if (!res.ok) {
          alert(`Erro ao enviar ${file.name}`)
          continue
        }

        const { url } = await res.json()
        uploadedUrls.push(url)
      }

      const newImages = [...images, ...uploadedUrls]
      setImages(newImages)
      onImagesChange(newImages)
    } catch (error) {
      console.error('Erro no upload:', error)
      alert('Erro ao fazer upload das imagens')
    } finally {
      setUploading(false)
    }
  }, [images, maxFiles, onImagesChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: maxFiles - images.length,
    disabled: uploading || images.length >= maxFiles,
  })

  const removeImage = (url: string) => {
    const newImages = images.filter(img => img !== url)
    setImages(newImages)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-3">
      {images.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
          {isDragActive ? (
            <p className="text-sm text-blue-600">Solte as imagens aqui...</p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-1">
                Arraste fotos ou clique para selecionar
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, JPEG ou WEBP (máx. {maxFiles} imagens)
              </p>
            </>
          )}
          {uploading && (
            <p className="text-sm text-blue-600 mt-2">Enviando...</p>
          )}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Foto ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeImage(url)}
                className="absolute top-1 right-1 h-6 w-6 bg-red-600 text-white hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          {images.length} de {maxFiles} imagens
        </p>
      )}
    </div>
  )
}
