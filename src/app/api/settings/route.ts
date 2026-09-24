import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/settings — tous les réglages
export async function GET() {
  try {
    const settings = await db.setting.findMany()
    const map: Record<string, unknown> = {}
    for (const s of settings) {
      try {
        map[s.key] = JSON.parse(s.value)
      } catch {
        map[s.key] = s.value
      }
    }
    return NextResponse.json(map)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/settings — mettre à jour un réglage (upsert)
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    if (!body.key) return NextResponse.json({ error: 'Clé requise' }, { status: 400 })
    const value = typeof body.value === 'string' ? body.value : JSON.stringify(body.value)
    const setting = await db.setting.upsert({
      where: { key: body.key },
      update: { value },
      create: { key: body.key, value },
    })
    return NextResponse.json(setting)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
