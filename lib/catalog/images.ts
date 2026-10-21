import credits from '@/public/images/creditos.json'

export interface PhotoCredit {
  /** Path inside `public/`, e.g. `images/productos/mantel-antimanchas.webp`. */
  file: string
  alt: string
  author: string
  authorUrl: string
  source: string
  license: string
}

export const PHOTO_CREDITS: PhotoCredit[] = credits

export interface Photo {
  src: string
  alt: string
}

function photo(file: string): Photo | null {
  const credit = PHOTO_CREDITS.find((c) => c.file === file)
  return credit ? { src: `/${credit.file}`, alt: credit.alt } : null
}

/** The product photo, or null when there is none (the card then falls back to the illustration). SHOP-003. */
export const productPhoto = (slug: string) => photo(`images/productos/${slug}.webp`)
export const categoryPhoto = (slug: string) => photo(`images/categorias/${slug}.webp`)
export const bannerPhoto = (name: 'salon' | 'textil') => photo(`images/portada/${name}.webp`)
