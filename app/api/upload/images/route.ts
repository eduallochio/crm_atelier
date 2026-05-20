import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getStorageClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Formato inválido. Envie uma imagem.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Tamanho máximo: 10MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const random = Math.random().toString(36).slice(2, 8)
    const path = `orders/${user.organizationId}/${Date.now()}-${random}.${ext}`

    const supabase = getStorageClient()

    const { error } = await supabase.storage
      .from('org-assets')
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('[upload/images] Storage error:', error)
      return NextResponse.json({ error: 'Erro ao salvar arquivo' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('org-assets')
      .getPublicUrl(path)

    return NextResponse.json({ url: publicUrl }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.error('[POST /api/upload/images]', error)
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
  }
}
