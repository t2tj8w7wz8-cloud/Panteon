/*
 * TOMORI · Sincronización defensiva del listado «Todos los tomos» · 2026-10-13.
 *
 * Compatibilidad con la versión existente de app.js/perfil-serie-v2.js.
 * No toca TomoriCollector, localStorage, portadas, ni los datos del catálogo.
 * Se ejecuta solamente cuando un cambio de estado deja inesperadamente
 * vacío un listado que antes mostraba tomos.
 *
 * Cuando los tres scripts de la aplicación estén disponibles, la solución
 * definitiva debe integrar la actualización en el propio renderizador.
 */
(function () {
  'use strict';

  const section = document.getElementById('tomos');
  const results = document.getElementById('volumeResults');
  const filter = document.getElementById('volumeFilter');
  const more = document.getElementById('volumeMore');
  if (!section || !results || !filter) return;

  const fieldIds = ['volumeSearch', 'volumeEdition', 'volumeSort', 'volumeFilter'];
  const fields = fieldIds.map(id => document.getElementById(id));
  const countCards = () => results.querySelectorAll('.volume-card').length;
  let current = null;
  let timer = null;

  const snapshot = () => fields.map(el => el ? el.value : null);
  const matchesSnapshot = ctx => fields.every((el, i) => !el || el.value === ctx.values[i]);
  const changeEvent = () => new Event('change', { bubbles: true });
  const triggerChange = () => filter.dispatchEvent(changeEvent());

  function markedButton(button) {
    if (!button) return false;
    const attributes = [
      button.dataset.action, button.dataset.mark, button.dataset.status,
      button.dataset.kind, button.getAttribute('aria-label'),
      button.getAttribute('title'), button.textContent
    ].filter(Boolean).join(' ').toLowerCase();
    return /(?:\bown(?:ed)?\b|\bwant(?:ed)?\b|lo\s+tengo|lo\s+quiero|marcar\s+como\s+(?:comprado|deseado))/.test(attributes);
  }

  function cancel() {
    current = null;
    if (timer !== null) { clearTimeout(timer); timer = null; }
  }

  function scheduleCheck(ctx, delay) {
    if (current !== ctx) return;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (current !== ctx) return;
      requestAnimationFrame(() => inspect(ctx));
    }, delay);
  }

  function restoreValues(ctx) {
    fields.forEach((el, i) => {
      if (!el || ctx.values[i] === null) return;
      if (el.tagName === 'INPUT' || [...(el.options || [])].some(opt => opt.value === ctx.values[i])) {
        el.value = ctx.values[i];
      }
    });
  }

  function restoreCount(ctx) {
    if (current !== ctx || !matchesSnapshot(ctx) || section.hidden) return;
    const currentCount = countCards();
    if (!currentCount) {
      if (ctx.repairs < 2) scheduleCheck(ctx, 60);
      else cancel();
      return;
    }
    if (currentCount >= ctx.count || ctx.expansions >= 45 || !more ||
        more.disabled || more.hidden || more.closest('[hidden]') ||
        getComputedStyle(more).display === 'none' ||
        getComputedStyle(more.parentElement).display === 'none') {
      // El clic original guardó el estado; este script no lo vuelve a modificar.
      if (ctx.repaired && !ctx.scrolled) {
        ctx.scrolled = true;
        window.scrollTo(0, ctx.scrollY);
      }
      cancel();
      return;
    }

    ctx.expansions++;
    more.click(); // Reutilizar el paginador aprobado, sin fabricar tarjetas.
    scheduleCheck(ctx, 35);
  }

  function inspect(ctx) {
    if (current !== ctx || section.hidden) { cancel(); return; }
    if (countCards() > 0) {
      if (ctx.repaired) restoreCount(ctx);
      else {
        // No descartar un clic todavía: algunas versiones repintan tarde.
        const remaining = 900 - (performance.now() - ctx.startedAt);
        if (remaining > 0) scheduleCheck(ctx, remaining);
        else cancel();
      }
      return;
    }
    if (ctx.repairs >= 2) { cancel(); return; }

    // Un resultado vacío sí es correcto si se desmarca el único tomo visible
    // de filtros como «Los que tengo» o «Lo que quiero».
    if (ctx.values[3] !== 'all' && ctx.count <= 1) { cancel(); return; }

    ctx.repairs++;
    ctx.repaired = true;
    restoreValues(ctx);
    triggerChange();

    // Algunas versiones solo recalculan al detectar un cambio de valor.
    // Se fuerza un cambio de filtro y se restaura su valor original antes
    // del siguiente repintado del navegador.
    if (!countCards()) {
      const original = ctx.values[3];
      const alternative = [...filter.options].find(option => option.value !== original);
      if (alternative) {
        filter.value = alternative.value;
        triggerChange();
        filter.value = original;
        triggerChange();
      }
    }
    scheduleCheck(ctx, 45);
  }

  // Captura ANTES de que los manejadores existentes modifiquen la colección.
  document.addEventListener('click', event => {
    const button = event.target.closest('button, [role="button"]');
    const card = button && button.closest('.volume-card');
    if (!card || !results.contains(card) || !markedButton(button) || section.hidden) return;
    const count = countCards();
    if (!count) return;
    cancel();
    const ctx = current = {
      values: snapshot(), count, scrollY: window.scrollY, startedAt: performance.now(),
      repairs: 0, expansions: 0, repaired: false, scrolled: false
    };
    // El render original puede ejecutarse tanto en el clic como en un microtask.
    scheduleCheck(ctx, 35);
  }, true);

  // Si el usuario toca los filtros, se respeta su nueva elección.
  fields.forEach(el => {
    if (!el) return;
    ['input', 'change'].forEach(type => el.addEventListener(type, event => {
      if (event.isTrusted) cancel();
    }, true));
  });

  // Cubre renderizados asíncronos posteriores al clic, sin bucles de refresco.
  new MutationObserver(() => {
    if (current && !section.hidden) scheduleCheck(current, 35);
  }).observe(results, { childList: true, subtree: false });
})();
