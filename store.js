/* ============================================================================
   IRON INVEST — edit overlay (localStorage).
   Mirrors the Dobrograd portal pattern: data.js is the read-only base registry;
   this overlay stores per-object field edits so Pavel can fill/patch objects
   live (no code deploy). Merge is deep-by-id; the merged list is what the UI
   renders. Cross-tab edits sync via the `storage` event → `iron:changed`.

   Public API (window.IronStore):
     list()            -> merged array (base ⊕ overrides), draft flags intact
     get(id)           -> one merged object
     patch(id, partial)-> deep-merge partial into the object's override, persist
     resetObject(id)   -> drop overrides for one object
     resetAll()        -> drop every override
   ============================================================================ */
(function () {
  const LS = 'iron_invest_v1';
  const base = () => (window.IronData && window.IronData.OBJECTS) || [];

  let overrides = {};
  try { const r = JSON.parse(localStorage.getItem(LS)); if (r && typeof r === 'object') overrides = r; } catch (e) {}
  const save = () => { try { localStorage.setItem(LS, JSON.stringify(overrides)); } catch (e) {} };

  // deep merge (plain objects only; arrays replaced wholesale — интуитивно для правок)
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  function merge(target, src) {
    const out = Array.isArray(target) ? target.slice() : Object.assign({}, target);
    for (const k in src) {
      if (isObj(src[k]) && isObj(out[k])) out[k] = merge(out[k], src[k]);
      else out[k] = src[k];
    }
    return out;
  }

  const IronStore = {
    list() { return base().map((o) => (overrides[o.id] ? merge(o, overrides[o.id]) : o)); },
    get(id) { const o = base().find((x) => x.id === id); return o ? (overrides[id] ? merge(o, overrides[id]) : o) : null; },
    patch(id, partial) {
      overrides[id] = merge(overrides[id] || {}, partial);
      save();
      document.dispatchEvent(new CustomEvent('iron:changed', { detail: { id } }));
    },
    resetObject(id) { delete overrides[id]; save(); document.dispatchEvent(new CustomEvent('iron:changed', { detail: { id } })); },
    resetAll() { overrides = {}; save(); document.dispatchEvent(new CustomEvent('iron:changed', { detail: { all: true } })); }
  };

  // sync edits made in another tab
  window.addEventListener('storage', (e) => {
    if (e.key !== LS) return;
    try { overrides = JSON.parse(e.newValue) || {}; } catch (_) { overrides = {}; }
    document.dispatchEvent(new CustomEvent('iron:changed', { detail: { external: true } }));
  });

  window.IronStore = IronStore;
})();
