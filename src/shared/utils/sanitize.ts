// A3: HTML escaping na saída corrompe dados (ex.: O'Brien → O&#39;Brien) e
// clona todo o grafo de objetos por requisição. O React já escapa na renderização
// e application/json não executa HTML, portanto o escape é desnecessário.
// Mantida como identidade para não exigir alteração nos call-sites.
export function sanitizeOutput<T>(obj: T): T {
  return obj;
}
