import Image from 'next/image'
import { productPhoto } from '@/lib/catalog/images'
import { ProductArt } from './ProductArt'

// SHOP-003 and EXP-006: the product photo through next/image (WebP, responsive sizes, lazy unless `priority`), or the
// generated illustration when the product has no photo.
export function ProductImage({
  slug,
  name,
  category,
  sizes,
  priority = false,
  className = '',
}: {
  slug: string
  name: string
  category: string
  sizes: string
  priority?: boolean
  className?: string
}) {
  const photo = productPhoto(slug)
  if (!photo) return <ProductArt category={category} name={name} />
  return (
    <Image
      src={photo.src}
      alt={photo.alt}
      width={900}
      height={900}
      sizes={sizes}
      priority={priority}
      className={`aspect-square w-full object-cover ${className}`}
    />
  )
}
