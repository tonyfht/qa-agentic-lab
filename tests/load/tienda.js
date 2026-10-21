// Load test of La Tienda en Casa (EXP-005). Run only against the store started by the pipeline on its own runner,
// never against third parties: BASE_URL defaults to the local E2E store.
import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE = __ENV.BASE_URL || 'http://localhost:3410'

export const options = {
  vus: 20,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
}

const products = ['manta-punto-gruesa', 'cafetera-italiana-aluminio', 'lampara-mesa-ceramica', 'jarron-ceramica-blanco']
const searches = ['taza', 'algodon', 'lampara', 'manta']

export default function shopper() {
  const i = (__VU + __ITER) % products.length
  check(http.get(`${BASE}/catalogo?q=${searches[i]}`), { 'catálogo 200': (r) => r.status === 200 })
  check(http.get(`${BASE}/producto/${products[i]}`), { 'ficha 200': (r) => r.status === 200 })
  check(http.get(`${BASE}/api/products?category=cocina&sort=price-asc`), { 'API 200': (r) => r.status === 200 })
  sleep(1)
}
