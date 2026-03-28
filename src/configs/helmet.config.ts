import type { HelmetOptions } from "helmet";

/**
 * Configuração EXPLÍCITA do Helmet — cada header é declarado individualmente.
 *
 * ┌────────────────────────────────┬──────────────────────────────────────────┐
 * │ Header                        │ Vetor de ataque mitigado                 │
 * ├────────────────────────────────┼──────────────────────────────────────────┤
 * │ Content-Security-Policy       │ XSS, injeção de scripts/styles/iframes  │
 * │ Strict-Transport-Security     │ Downgrade HTTP, MITM (SSL stripping)    │
 * │ X-Frame-Options               │ Clickjacking                            │
 * │ X-Content-Type-Options        │ MIME-type sniffing (drive-by downloads)  │
 * │ Referrer-Policy               │ Vazamento de URLs internas via Referer   │
 * │ Cross-Origin-Opener-Policy    │ Side-channel attacks (Spectre)           │
 * │ Cross-Origin-Resource-Policy  │ Inclusão cross-origin indevida           │
 * │ X-Powered-By (removido)       │ Fingerprinting de tecnologia             │
 * └────────────────────────────────┴──────────────────────────────────────────┘
 */
export const helmetOptions: HelmetOptions = {
  /**
   * CSP: default-src 'none' — API pura não serve HTML/JS/CSS.
   * frame-ancestors 'none' impede embedding via iframe (reforça X-Frame-Options).
   */
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
    },
  },

  /**
   * HSTS: força HTTPS por 1 ano, incluindo subdomínios.
   * Mitiga: SSL stripping (ex.: sslstrip) e downgrade para HTTP.
   */
  hsts: {
    maxAge: 31_536_000,
    includeSubDomains: true,
    preload: true,
  },

  /**
   * X-Frame-Options: DENY — impede qualquer site de embutir a API em iframe.
   * Mitiga: clickjacking.
   */
  frameguard: { action: "deny" },

  /**
   * X-Content-Type-Options: nosniff — impede o browser de adivinhar MIME type.
   * Mitiga: ataques de MIME-type confusion / drive-by downloads.
   */
  noSniff: true,

  /**
   * Referrer-Policy: strict-origin-when-cross-origin
   * Envia origin em cross-origin mas URL completa apenas same-origin.
   * Mitiga: vazamento de paths/query-strings internos em headers Referer.
   */
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },

  /** Remove header X-Powered-By para dificultar fingerprinting. */
  xPoweredBy: false,

  /** Restringe carregamento de recursos ao mesmo origin. */
  crossOriginResourcePolicy: { policy: "same-origin" },

  /** Isola o browsing context para mitigar side-channel attacks (Spectre). */
  crossOriginOpenerPolicy: { policy: "same-origin" },
};
