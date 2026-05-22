import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { logServerError } from '@/lib/log-error'
import { validateImageUpload } from '@/lib/utils/validate-upload'

// Usa service role para bypass de RLS no Storage
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

    const validation = await validateImageUpload(file, 2)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { ext } = validation
    const path = `logos/${user.organizationId}/logo-${Date.now()}.${ext}`

    const supabase = getStorageClient()

    const { error } = await supabase.storage
      .from('org-assets')
      .upload(path, file, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      logServerError('[upload/logo] Storage error:', error); console.error('[upload/logo] Storage error:', error)
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
    logServerError('[POST /api/upload/logo]', error); console.error('[POST /api/upload/logo]', error)
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
  }
}
