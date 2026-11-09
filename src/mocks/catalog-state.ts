import type { NftDetail } from '../contracts/catalog'

interface CatalogFixture extends NftDetail {
  listedAt: number
  trending: boolean
  highlighted: boolean
  network: string
}

const names = [
  'Emerald Ape #042', 'Sage Nomad #009', 'Neon Vessel #552', 'Cosmic Bloom #118',
  'Violet Nomad #314', 'Ivory Baron #088', 'Golden Beat #207', 'Golden Signal #160',
  'Lunar Echo #204', 'Copper Current #031', 'Amber Drift #507', 'Quartz Pulse #016',
  'Silver Garden #021', 'Indigo Arc #119', 'Vermilion Orbit #404', 'Ochre Wave #070',
]
export const catalogCategories = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Colecionáveis', 'Generativa', 'Jogos', 'Assinaturas', 'Utilidade']
const categories = [
  'Arte digital', 'Arte 3D', 'Fotografia', 'Música', 'Colecionáveis', 'Generativa',
  'Arte digital', 'Jogos', 'Assinaturas', 'Utilidade', 'Arte 3D', 'Fotografia',
  'Arte digital', 'Música', 'Colecionáveis', 'Generativa',
]
const collections = ['Kurio Editions', 'Orbit Studio']
const figmaArt: Record<string, string> = {
  'Emerald Ape #042': '8f387',
  'Sage Nomad #009': '83794',
  'Neon Vessel #552': '9add2',
  'Cosmic Bloom #118': '83794',
  'Violet Nomad #314': '83794',
  'Ivory Baron #088': '9add2',
  'Golden Beat #207': 'b7cfc',
  'Golden Signal #160': 'b7cfc',
  'Lunar Echo #204': 'b7cfc',
}
const referencePrices = ['1.19', '1.69', '1.99', '1.29', '1.39', '1.79', '0.99', '0.39']
const networks = ['Ethereum', 'Polygon', 'Solana']

const items: CatalogFixture[] = names.map((name, index) => {
  const [title, tokenId] = name.split(' #')
  const id = `${title.toLowerCase().replaceAll(' ', '-')}-${tokenId}`
  const collection = index >= 3 && index <= 7 ? collections[0] : index === 2 ? collections[1] : collections[index % collections.length]
  const priceEth = referencePrices[index] ?? `${index % 4}.${29 + index}`
  const artwork = figmaArt[name]
  const gallery = [
    artwork ? { src: '/art/' + artwork + '-960.webp', alt: 'Arte digital de ' + name } :
      { src: '/art/edition.svg', alt: 'Arte provisória com anéis sobre fundo escuro' },
    { src: '/art/alternate.svg', alt: 'Arte provisória com formas geométricas sobre fundo escuro' },
  ]

  return {
    id,
    name,
    tokenId,
    collection,
    category: categories[index % categories.length],
    network: networks[index % networks.length],
    description: index === 0
      ? 'Um colecionável digital finalizado à mão da coleção Kurio Editions, com arte desbloqueável e acesso para colecionadores.'
      : `${name} é um colecionável digital da coleção ${collection}.`,
    attributes: index === 0 ? ['Óculos', 'Esmeralda', 'Raro'] : undefined,
    details: index === 0 ? [
      'Emerald Ape #042 é uma obra digital da coleção Kurio Editions. A arte explora identidade, movimento e luz em um mundo digital sem fronteiras.',
      'Na demonstração, a edição 1/50 representa uma tiragem limitada da obra. Os dados do token, a rede e a procedência são apresentados como parte da simulação.',
    ] : undefined,
    rating: index === 0 ? { score: 4.8, count: 19 } : undefined,
    image: artwork ? { ...gallery[0], src: '/art/' + artwork + '-480.webp' } : gallery[0],
    gallery: index === 0 ? Array.from({ length: 4 }, () => gallery[0]) : gallery,
    priceEth,
    version: 1,
    editions: [
      { id: 'limited', label: '1/50', priceEth, available: 3, version: 1 },
      { id: 'single', label: '1/1', priceEth: '2.5', available: 0, version: 1 },
      ...(index === 0 ? [{ id: 'ten', label: '1/10', priceEth: '1.69', available: 2, version: 1 }] : []),
      { id: 'open', label: 'Aberta', priceEth: '0.99', available: 12, version: 1 },
    ],
    listedAt: names.length - index,
    trending: index % 2 === 0,
    highlighted: index < 2,
  }
})

export const catalogState = { items }
