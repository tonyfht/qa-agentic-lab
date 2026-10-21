import { parseCatalogQuery, queryCatalog, type RawParams } from './query'
import { listCategories, listProducts } from './repository'

/** One entry point for the catalogue page and the API: same parameters, same result (CAT-009). */
export async function searchCatalog(params: RawParams) {
  const [products, categories] = await Promise.all([listProducts(), listCategories()])
  const { query, errors } = parseCatalogQuery(params, categories.map((c) => c.slug))
  return { page: queryCatalog(products, query), query, errors, categories }
}
