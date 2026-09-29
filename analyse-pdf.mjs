import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import fs from 'fs'

const pdfs = [
  '/home/z/my-project/public/adhkar/cahier-wadhifa.pdf',
  '/home/z/my-project/public/adhkar/cahier-de-sama.pdf',
  '/home/z/my-project/public/adhkar/kitab-arabe.pdf',
  '/home/z/my-project/public/adhkar/dalail.pdf',
  '/home/z/my-project/public/adhkar/diwan-as-sama.pdf',
]

for (const chemin of pdfs) {
  const data = new Uint8Array(fs.readFileSync(chemin))
  const doc = await getDocument({ data, useSystemFonts: true }).promise
  const nom = chemin.split('/').pop()
  const pagesATester = [1, 2, Math.floor(doc.numPages / 2), doc.numPages]
  const res = []
  for (const p of pagesATester) {
    if (p < 1 || p > doc.numPages) continue
    const page = await doc.getPage(p)
    const vp = page.getViewport({ scale: 0.5 })
    const canvas = { width: Math.floor(vp.width), height: Math.floor(vp.height) }
    // faux canvas — pdfjs legacy peut rendre sur un canvas node-canvas absent;
    // on passe par l'opérateur de page pour récupérer les images
    res.push(p)
  }
  console.log(nom, '→', doc.numPages, 'pages, test:', res.join(','))
  doc.destroy()
}
