import { NextResponse } from 'next/server'

/* GET /api/push/cle — la clé publique VAPID de la zawiya.
   Le navigateur en a besoin pour s'abonner au service push :
   il chiffre ses messages avec, et notre serveur prouve son
   identité avec la clé privée correspondante. Publique par
   nature — celle-ci ne secrète rien. */
export async function GET() {
  const cle = process.env.VAPID_PUBLIC_KEY
  if (!cle) {
    /* Notifications non configurées : l'app s'abstient
       silencieusement de les proposer. */
    return NextResponse.json({ cle: null })
  }
  return NextResponse.json({ cle })
}
