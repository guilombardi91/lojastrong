import { readdir } from 'node:fs/promises'
import path from 'node:path'

/**
 * Imagens disponíveis em public/produtos, oferecidas ao admin na hora de
 * montar a galeria do produto.
 *
 * Quando entrar um serviço de upload (S3, Cloudinary, UploadThing), esta é a
 * função a trocar — o formulário só espera uma lista de URLs.
 */
export async function availableProductImages(): Promise<string[]> {
  try {
    const dir = path.join(process.cwd(), 'public', 'produtos')
    const files = await readdir(dir)
    return files
      .filter((file) => /\.(svg|png|jpe?g|webp|avif)$/i.test(file))
      .sort()
      .map((file) => `/produtos/${file}`)
  } catch {
    return []
  }
}
