// Deterministic sample catalogue. Some rows exist on purpose to exercise the spec:
// - "Manta de punto gruesa" costs exactly 19,90 € (CAT-004 boundaries)
// - two items are out of stock (CAT-005) and one has 3 units left (CAT-007)
// - "Funda nórdica lisa" describes its fabric as "algodon" without the accent (CAT-002)

export interface CategorySeed {
  slug: string
  name: string
}

export interface ProductSeed {
  slug: string
  name: string
  description: string
  category: string
  priceCents: number
  stock: number
  rating: number
  isNew: boolean
}

export const categories: CategorySeed[] = [
  { slug: 'cocina', name: 'Cocina' },
  { slug: 'textil', name: 'Textil' },
  { slug: 'decoracion', name: 'Decoración' },
  { slug: 'bano', name: 'Baño' },
  { slug: 'iluminacion', name: 'Iluminación' },
]

export const products: ProductSeed[] = [
  // Cocina
  { slug: 'cafetera-italiana-aluminio', name: 'Cafetera italiana de aluminio', description: 'Cafetera de 6 tazas para fuego de gas y vitrocerámica.', category: 'cocina', priceCents: 2490, stock: 18, rating: 4.6, isNew: false },
  { slug: 'juego-tazas-ceramica', name: 'Juego de 4 tazas de cerámica', description: 'Tazas esmaltadas a mano, aptas para lavavajillas y microondas.', category: 'cocina', priceCents: 2290, stock: 12, rating: 4.4, isNew: true },
  { slug: 'taza-desayuno-xl', name: 'Taza de desayuno XL', description: 'Taza de 500 ml en gres con asa ancha.', category: 'cocina', priceCents: 990, stock: 30, rating: 4.1, isNew: false },
  { slug: 'tabla-cortar-bambu', name: 'Tabla de cortar de bambú', description: 'Tabla con canal recogejugos y asas laterales.', category: 'cocina', priceCents: 1890, stock: 25, rating: 4.5, isNew: false },
  { slug: 'set-cuchillos-cocina', name: 'Set de 3 cuchillos de cocina', description: 'Acero inoxidable con mango ergonómico y funda protectora.', category: 'cocina', priceCents: 4590, stock: 7, rating: 4.7, isNew: true },
  { slug: 'sarten-antiadherente-28', name: 'Sartén antiadherente 28 cm', description: 'Apta para inducción, sin PFOA.', category: 'cocina', priceCents: 3290, stock: 0, rating: 4.2, isNew: false },
  // Textil
  { slug: 'manta-punto-gruesa', name: 'Manta de punto gruesa', description: 'Manta tejida en punto grueso para sofá, 130 x 170 cm.', category: 'textil', priceCents: 1990, stock: 15, rating: 4.8, isNew: true },
  { slug: 'funda-nordica-lisa', name: 'Funda nórdica lisa', description: 'Funda de 100 % algodon peinado para cama de 150 cm.', category: 'textil', priceCents: 3990, stock: 9, rating: 4.3, isNew: false },
  { slug: 'cojin-lino-natural', name: 'Cojín de lino natural', description: 'Cojín de 45 x 45 cm con funda de lino lavado.', category: 'textil', priceCents: 1590, stock: 22, rating: 4.0, isNew: false },
  { slug: 'mantel-antimanchas', name: 'Mantel antimanchas', description: 'Mantel rectangular para 6 comensales, fácil de limpiar.', category: 'textil', priceCents: 2190, stock: 3, rating: 3.9, isNew: false },
  { slug: 'alfombra-yute-redonda', name: 'Alfombra de yute redonda', description: 'Alfombra tejida a mano de 120 cm de diámetro.', category: 'textil', priceCents: 5990, stock: 4, rating: 4.5, isNew: false },
  // Decoración
  { slug: 'jarron-ceramica-blanco', name: 'Jarrón de cerámica blanco', description: 'Jarrón de 30 cm con acabado mate.', category: 'decoracion', priceCents: 2790, stock: 11, rating: 4.2, isNew: false },
  { slug: 'espejo-redondo-ratan', name: 'Espejo redondo de ratán', description: 'Espejo de pared con marco de ratán natural, 60 cm.', category: 'decoracion', priceCents: 6490, stock: 5, rating: 4.6, isNew: true },
  { slug: 'marco-fotos-madera', name: 'Marco de fotos de madera', description: 'Marco de roble para fotografías de 13 x 18 cm.', category: 'decoracion', priceCents: 1290, stock: 40, rating: 4.0, isNew: false },
  { slug: 'reloj-pared-minimal', name: 'Reloj de pared minimalista', description: 'Reloj silencioso de 35 cm con esfera clara.', category: 'decoracion', priceCents: 2990, stock: 0, rating: 3.8, isNew: false },
  { slug: 'velas-aromaticas-set', name: 'Set de 3 velas aromáticas', description: 'Velas de cera de soja con aroma a lavanda, vainilla y cedro.', category: 'decoracion', priceCents: 1790, stock: 26, rating: 4.4, isNew: true },
  // Baño
  { slug: 'toallas-algodon-pack', name: 'Pack de 2 toallas de algodón', description: 'Toallas de baño de 550 g/m² extra suaves.', category: 'bano', priceCents: 2590, stock: 20, rating: 4.5, isNew: false },
  { slug: 'dispensador-jabon-vidrio', name: 'Dispensador de jabón de vidrio', description: 'Dispensador de 350 ml con dosificador de acero.', category: 'bano', priceCents: 1190, stock: 14, rating: 4.1, isNew: false },
  { slug: 'alfombra-bano-algodon', name: 'Alfombra de baño de algodón', description: 'Alfombra absorbente con base antideslizante.', category: 'bano', priceCents: 1490, stock: 17, rating: 4.3, isNew: false },
  { slug: 'organizador-bambu-bano', name: 'Organizador de bambú', description: 'Bandeja con tres compartimentos para el lavabo.', category: 'bano', priceCents: 2090, stock: 6, rating: 4.0, isNew: true },
  // Iluminación
  { slug: 'lampara-mesa-ceramica', name: 'Lámpara de mesa de cerámica', description: 'Lámpara con pantalla de lino y base de cerámica.', category: 'iluminacion', priceCents: 4990, stock: 8, rating: 4.6, isNew: false },
  { slug: 'guirnalda-luces-led', name: 'Guirnalda de luces LED', description: 'Guirnalda de 5 m con 50 luces cálidas y temporizador.', category: 'iluminacion', priceCents: 1390, stock: 35, rating: 4.2, isNew: true },
  { slug: 'lampara-pie-arco', name: 'Lámpara de pie en arco', description: 'Lámpara de 180 cm con brazo regulable y base de mármol.', category: 'iluminacion', priceCents: 12990, stock: 2, rating: 4.7, isNew: false },
  { slug: 'aplique-pared-laton', name: 'Aplique de pared de latón', description: 'Aplique orientable con acabado de latón envejecido.', category: 'iluminacion', priceCents: 5490, stock: 10, rating: 4.4, isNew: false },
]

export interface CouponSeed {
  code: string
  kind: 'percent' | 'fixed' | 'shipping'
  value: number
  minSubtotalCents: number
  category: string | null
  validUntil: string
}

// Coupons chosen to exercise each branch of the promotions decision table (PROMO-002).
export const coupons: CouponSeed[] = [
  { code: 'BIENVENIDA10', kind: 'percent', value: 10, minSubtotalCents: 3000, category: null, validUntil: '2099-12-31' },
  { code: 'CASA5', kind: 'fixed', value: 500, minSubtotalCents: 2500, category: null, validUntil: '2099-12-31' },
  { code: 'TEXTIL15', kind: 'percent', value: 15, minSubtotalCents: 0, category: 'textil', validUntil: '2099-12-31' },
  { code: 'ENVIOGRATIS', kind: 'shipping', value: 0, minSubtotalCents: 0, category: null, validUntil: '2099-12-31' },
  { code: 'VERANO2026', kind: 'percent', value: 20, minSubtotalCents: 0, category: null, validUntil: '2026-09-30' },
]

// Fictitious demo customer (".test" is a reserved domain). Its password is public on purpose.
export const demoCustomer = { name: 'Cliente de Prueba', email: 'cliente@ejemplo.test', password: 'Casa2026' }
