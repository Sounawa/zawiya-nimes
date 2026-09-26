import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/audit — le journal de la zawiya (80 dernières actions)
export async function GET() {
  try {
    const entrees = await db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 80,
    })
    return NextResponse.json(entrees)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
