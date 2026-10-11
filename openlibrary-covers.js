/* TOMORI v1.2 — EXPERIMENTAL v1.1: Open Library Cover API (ISBN-13 exacto).
 * Nunca sustituye datos bibliográficos ni acredita licencias comerciales.
 * Desactivado por defecto. Monta imágenes SOLO con consentimiento del interruptor.
 * Conserva las cubiertas negras, tamaños y componentes aprobados.
 */
(() => {
  'use strict';
  const FLAG = 'tomori-openlibrary-covers-enabled-v1';
  const TRAFFIC = 'tomori-openlibrary-cover-requests-v1';
  const RATE_WINDOW = 5 * 60 * 1000;
  const MAX_REQUESTS = 15; // límite prudente, compartido por pestañas/páginas en este navegador
  const DELAY_MS = 1250;
  const IMAGE_TIMEOUT_MS = 10000;
  const SELECTOR = '.series-card > .series-cover, .series-card .series-cover, .volume-card .volume-cover, .profile-overview .profile-cover';
  const originalLabels = new WeakMap();
  const validated = new Map(); // isbn -> true/false (404, imagen vacía, error)
  const pending = new Map(); // isbn -> Promise<boolean>
  const pendingQueue = [];
  const availability = new Map(); // ISBN -> 'consultando' | 'disponible' | 'no-disponible' | 'limite'
  let enabled = false;
  let processing = false;
  let refreshQueued = false;
  let visibleObserver = null;
  let lastRequestAt = 0;

  function stored(key, fallback) { try { const x = localStorage.getItem(key); return x === null ? fallback : x; } catch (_) { return fallback; } }
  function write(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  enabled = stored(FLAG, 'off') === 'on';

  const editions = () => typeof SERIES !== 'undefined' && Array.isArray(SERIES) ? SERIES : [];
  const volumes = () => typeof VOLUMES !== 'undefined' && Array.isArray(VOLUMES) ? VOLUMES : [];
  function validISBN13(value) {
    if (typeof value !== 'string' || !/^\d{13}$/.test(value)) return false;
    const sum = [...value].reduce((n, c, i) => n + Number(c) * (i % 2 ? 3 : 1), 0);
    return sum % 10 === 0;
  }
  function coverUrl(isbn) { return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`; }
  function sourceUrl(isbn) { return `https://openlibrary.org/isbn/${isbn}`; }

  // La selección siempre se vincula a un ID de tomo estable y a su edición.
  // Las fichas de series usan SOLO una portada del tomo 1 de esa edición, si está verificado su ISBN.
  function isbnFor(node) {
    if (node.classList.contains('volume-cover')) {
      const card = node.closest('.volume-card');
      const id = card?.querySelector('[data-id]')?.getAttribute('data-id') || card?.querySelector('[data-volume-id]')?.getAttribute('data-volume-id');
      const volume = id && volumes().find(v => v.id === id);
      return volume && volume.editionId && validISBN13(volume.isbn13) ? volume.isbn13 : null;
    }
    const card = node.closest('.series-card');
    const name = card ? (card.getAttribute('data-open-series') || card.getAttribute('data-series')) : new URLSearchParams(location.search).get('serie') || editions()[0]?.name;
    const edition = editions().find(s => s.name === name);
    if (!edition?.id) return null;
    const volume = volumes().find(v => v.editionId === edition.id && Number(v.num) === 1 && validISBN13(v.isbn13));
    return volume?.isbn13 || null;
  }

  // Diagnóstico visible: una ausencia de imágenes no debe parecer un fallo silencioso.
  // Los ISBN informan identidad bibliográfica, nunca disponibilidad de portadas ni derechos.
  function eligibleISBNs() {
    return [...new Set(volumes().filter(v => v.editionId && validISBN13(v.isbn13)).map(v => v.isbn13))];
  }
  function report() {
    const target = document.querySelector('.tomori-ol-status');
    if (!target) return;
    if (!enabled) { target.textContent = 'Desactivadas · portada genérica'; return; }
    const n = eligibleISBNs().length;
    const ok = [...availability.values()].filter(x => x === 'disponible').length;
    const bad = [...availability.values()].filter(x => x === 'no-disponible').length;
    const busy = [...availability.values()].filter(x => x === 'consultando').length;
    const limited = [...availability.values()].filter(x => x === 'limite').length;
    if (!n) {target.textContent = 'Sin ISBN válidos para consultar; se mantiene la portada genérica'; return;}
    const parts = [`${n} ISBN registrados`, `${ok} portadas disponibles`];
    if (bad) parts.push(`${bad} sin imagen o error de conexión`);
    if (busy) parts.push(`${busy} consultando`);
    if (limited) parts.push('límite temporal alcanzado; reintentar después');
    if (!availability.size) parts.push('desplázate hasta las tarjetas para consultar');
    target.textContent = parts.join(' · ');
  }
  function requestLog() {
    try { const value = JSON.parse(stored(TRAFFIC, '[]')); return (Array.isArray(value) ? value : []).filter(t => typeof t === 'number' && Date.now() - t < RATE_WINDOW && t <= Date.now()); }
    catch (_) { return []; }
  }
  function recordRequest() {
    const list = requestLog();
    if (list.length >= MAX_REQUESTS) return false;
    list.push(Date.now()); write(TRAFFIC, JSON.stringify(list)); return true;
  }
  function imageExists(isbn) {
    return new Promise(resolve => {
      const probe = new Image();
      let settled = false;
      const finish = valid => { if (settled) return; settled = true; clearTimeout(timeout); probe.onload = null; probe.onerror = null; resolve(valid); };
      const timeout = setTimeout(() => { probe.src = ''; finish(false); }, IMAGE_TIMEOUT_MS);
      probe.onload = () => finish(probe.naturalWidth > 1 && probe.naturalHeight > 1);
      probe.onerror = () => finish(false);
      probe.src = coverUrl(isbn);
    });
  }
  async function runQueue() {
    if (processing) return;
    processing = true;
    while (pendingQueue.length) {
      const task = pendingQueue.shift();
      if (!enabled) { pending.delete(task.isbn); task.resolve(false); continue; }
      if (validated.has(task.isbn)) { pending.delete(task.isbn); task.resolve(validated.get(task.isbn)); continue; }
      if (requestLog().length >= MAX_REQUESTS) { availability.set(task.isbn, 'limite'); report(); pending.delete(task.isbn); task.resolve(false); continue; }
      const delay = Math.max(0, DELAY_MS - (Date.now() - lastRequestAt));
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      if (!enabled || !recordRequest()) { if (enabled) availability.set(task.isbn, 'limite'); report(); pending.delete(task.isbn); task.resolve(false); continue; }
      lastRequestAt = Date.now();
      const success = await imageExists(task.isbn);
      validated.set(task.isbn, success);
      availability.set(task.isbn, success ? 'disponible' : 'no-disponible');
      report();
      pending.delete(task.isbn);
      task.resolve(success);
    }
    processing = false;
  }
  function verify(isbn) {
    if (validated.has(isbn)) return Promise.resolve(validated.get(isbn));
    if (pending.has(isbn)) return pending.get(isbn);
    availability.set(isbn, 'consultando'); report();
    const promise = new Promise(resolve => pendingQueue.push({isbn, resolve}));
    pending.set(isbn, promise);
    void runQueue();
    return promise;
  }
  function clearCover(node) {
    node.querySelectorAll(':scope > img.tomori-ol-cover').forEach(image => image.removeAttribute('src') || image.remove());
    if (originalLabels.has(node)) node.setAttribute('aria-label', originalLabels.get(node));
    node.classList.remove('tomori-ol-loaded');
  }
  function mount(node, isbn) {
    if (!enabled || !node.isConnected || isbnFor(node) !== isbn || node.querySelector(':scope > img.tomori-ol-cover')) return;
    const image = document.createElement('img');
    image.className = 'tomori-ol-cover';
    image.alt = 'Portada bibliográfica de Open Library';
    image.decoding = 'async';
    image.loading = 'lazy';
    image.dataset.isbn13 = isbn;
    image.dataset.source = 'Open Library Covers API';
    image.dataset.sourceUrl = coverUrl(isbn);
    image.dataset.rightsStatus = 'pendiente-de-verificacion';
    image.title = `Open Library · ISBN ${isbn} · Derechos de uso comercial sin confirmar`;
    image.onerror = () => { validated.set(isbn, false); availability.set(isbn, 'no-disponible'); clearCover(node); report(); };
    image.onload = () => {
      if (image.naturalWidth <= 1 || image.naturalHeight <= 1) { validated.set(isbn, false); availability.set(isbn, 'no-disponible'); clearCover(node); report(); return; }
      if (!originalLabels.has(node)) originalLabels.set(node, node.getAttribute('aria-label') || 'Portada provisional');
      node.setAttribute('aria-label', `Portada obtenida desde Open Library para ISBN ${isbn}; autorización comercial pendiente`);
      node.classList.add('tomori-ol-loaded');
      report();
    };
    node.prepend(image);
    image.src = coverUrl(isbn); // URL exacta reutiliza la respuesta ya cacheada por el navegador
  }
  function onVisible(node) {
    if (!enabled) return;
    const isbn = isbnFor(node);
    if (!isbn || node.querySelector(':scope > img.tomori-ol-cover')) return;
    void verify(isbn).then(yes => { if (yes && enabled) mount(node, isbn); });
  }
  function scan() {
    if (!enabled) return;
    document.querySelectorAll(SELECTOR).forEach(node => {
      if (!isbnFor(node) || node.querySelector(':scope > img.tomori-ol-cover')) return;
      if (visibleObserver) visibleObserver.observe(node);
      else onVisible(node); // navegador antiguo sin IntersectionObserver
    });
  }
  function scheduleScan() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => { refreshQueued = false; scan(); });
  }
  function applySwitch(next, persist = true) {
    enabled = Boolean(next);
    if (persist) write(FLAG, enabled ? 'on' : 'off');
    document.querySelectorAll('.tomori-ol-switch').forEach(input => { input.checked = enabled; input.setAttribute('aria-checked', String(enabled)); });
    report();
    if (!enabled) {
      if (visibleObserver) visibleObserver.disconnect();
      document.querySelectorAll('.tomori-ol-cover').forEach(img => clearCover(img.parentElement));
    } else scheduleScan();
  }
  function createControl() {
    const footer = document.querySelector('footer');
    if (!footer || footer.querySelector('.tomori-ol-control')) return;
    const container = document.createElement('div');
    container.className = 'tomori-ol-control';
    container.innerHTML = `<label class="tomori-ol-label"><input type="checkbox" class="tomori-ol-switch" role="switch" aria-label="Activar portadas externas de Open Library"><span>Portadas externas · Open Library</span></label><span class="tomori-ol-status" role="status"></span><small>Si Open Library no tiene la imagen exacta, queda la portada genérica. Derechos comerciales no comprobados · <a href="https://openlibrary.org/dev/docs/api/covers" target="_blank" rel="noopener noreferrer">Fuente</a></small>`;
    // Consulta directa de comprobación, independiente de la carga automática.
    // Nunca se usa para sustituir una edición por otra.
    const sample = eligibleISBNs()[0];
    if (sample) {
      const a = document.createElement('a');
      a.href = coverUrl(sample); a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.className = 'tomori-ol-check';
      a.textContent = 'Comprobar portada por ISBN';
      a.title = `Abrir solicitud exacta para el ISBN ${sample}`;
      container.appendChild(a);
    }
    footer.appendChild(container);
    container.querySelector('input').addEventListener('change', e => applySwitch(e.target.checked));
    applySwitch(enabled, false);
  }
  function initialize() {
    if ('IntersectionObserver' in window) {
      visibleObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) { visibleObserver.unobserve(entry.target); onVisible(entry.target); } });
      }, {rootMargin: '120px 0px'});
    }
    createControl();
    // Las seis páginas reconstruyen tarjetas mediante innerHTML, por lo que se vigilan nuevas fichas.
    const observer = new MutationObserver(records => {
      if (!enabled) return;
      if (records.some(r => [...r.addedNodes].some(n => n.nodeType === 1 && (n.matches?.('.series-card,.volume-card,.profile-cover') || n.querySelector?.('.series-card,.volume-card,.profile-cover'))))) scheduleScan();
    });
    observer.observe(document.body, {childList: true, subtree: true});
    window.addEventListener('storage', e => { if (e.key === FLAG) applySwitch(e.newValue === 'on', false); });
    scheduleScan();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, {once: true});
  else initialize();
  window.TomoriOpenLibraryCovers = Object.freeze({
    get enabled() {return enabled;},
    setEnabled: value => applySwitch(Boolean(value)),
    sourceFor: isbn => validISBN13(isbn) ? ({provider:'Open Library',isbn13:isbn,url:coverUrl(isbn),catalogPage:sourceUrl(isbn),commercialRights:'not_verified'}) : null
  });
})();
