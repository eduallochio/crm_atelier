/** Estilos compartilhados pelas telas lista + ficha (Clientes, Serviços): botões, chips, linhas com
 *  indicador pespontado, linha de limite do plano e entrada da ficha. */
export const MASTER_DETAIL_CSS = `
.font-serif-display { font-family: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif; font-weight: 400; letter-spacing: -0.01em; }
.cli-primary { display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 0 18px; border-radius: 2px; background: #C8714A; color: #FFF8F0; font-size: 12.5px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; transition: background-color .2s; }
.cli-primary:hover:not(:disabled) { background: #B45E37; }
.cli-primary:disabled { opacity: .55; cursor: not-allowed; }
.cli-ghost { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border-radius: 2px; border: 1px solid var(--border); background: var(--card); color: var(--foreground); font-size: 13.5px; font-weight: 500; transition: border-color .2s, background-color .2s; }
.cli-ghost:hover { border-color: #D4A85A; }
.cli-primary:focus-visible, .cli-ghost:focus-visible, .cli-chip:focus-visible, .cli-row:focus-visible { outline: 2px solid #C8714A; outline-offset: 2px; }
.cli-chip { display: inline-flex; align-items: center; gap: 6px; min-height: 34px; padding: 0 12px; border-radius: 17px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); font-size: 13px; font-weight: 500; transition: border-color .15s, background-color .15s, color .15s; }
.cli-chip:hover { border-color: #D4A85A; }
.cli-chip[aria-pressed="true"] { background: #2C1810; border-color: #2C1810; color: #F7F0E6; }
.dark .cli-chip[aria-pressed="true"] { background: #F7F0E6; border-color: #F7F0E6; color: #2C1810; }
.cli-row { position: relative; display: flex; width: 100%; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; text-align: left; transition: background-color .12s; }
.cli-row:hover { background: color-mix(in oklab, var(--muted) 70%, transparent); }
.cli-row.is-on { background: rgba(200,113,74,.1); }
.cli-row.is-on::before { content: ''; position: absolute; left: 0; top: 10px; bottom: 10px; width: 3px; border-radius: 2px; background: repeating-linear-gradient(180deg, #C8714A 0 5px, transparent 5px 8px); }
.cli-thread { height: 3px; background: repeating-linear-gradient(90deg, rgba(200,113,74,.22) 0 7px, transparent 7px 11px); }
.cli-thread > span { display: block; height: 100%; transform-origin: left; background: repeating-linear-gradient(90deg, #C8714A 0 7px, transparent 7px 11px); }
.cli-det { animation: cli-in .26s cubic-bezier(.2,0,0,1) backwards; }
@keyframes cli-in { from { opacity: 0; transform: translateX(12px); } }
@media (prefers-reduced-motion: reduce) { .cli-det { animation: none; } }
`
