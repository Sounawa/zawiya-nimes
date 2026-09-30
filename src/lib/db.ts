/* ─── Client Prisma — double mode ────────────────────────────────────
   Un seul fichier sert les deux mondes :
   • en local (sandbox) : DATABASE_URL = file:… → PrismaClient
     classique sur le fichier SQLite ;
   • en production (Netlify) : DATABASE_URL = libsql://… → PrismaClient
     branchée sur Turso (base SQLite hébergée gratuite) via l'adaptateur
     LibSQL — le système de fichiers des fonctions serverless étant
     éphémère, la base doit vivre à l'extérieur.
   Le choix est fait à la lecture de l'URL : rien à configurer.
   NB : PrismaLibSQL attend la CONFIG { url, authToken } — il crée
   lui-même le client libsql en interne (ne PAS lui passer un client,
   il le prendrait pour une config et l'URL deviendrait « undefined »). */

import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const url = process.env.DATABASE_URL ?? ''
const estTurso = url.startsWith('libsql://')

function creerClient(): PrismaClient {
  if (estTurso) {
    return new PrismaClient({
      adapter: new PrismaLibSQL({
        url,
        authToken: process.env.DATABASE_AUTH_TOKEN,
      }),
      log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
    })
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? creerClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
