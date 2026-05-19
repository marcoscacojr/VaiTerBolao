import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10)
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash)
}

export function gerarToken(payload: { id: string; email: string; nome: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verificarToken(token: string): { id: string; email: string; nome: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; nome: string }
  } catch {
    return null
  }
}
