/* ============================================================================
   IRON INVEST — app controller (editorial collection + dossier).
   Renders: hero figures, category filters, the numbered collection, the dossier
   slide-over, services, language toggle. The map (map.js) is engine-agnostic and
   talks to this through shared events:
     Iron.openObject(id)      — open a dossier (collection AND map call this)
     'iron:select' {id, fly}  — a property became active
     'iron:filter' {cat}      — category filter changed
     'iron:changed'           — store edited · 'iron:lang' — language switched
   ============================================================================ */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const t = (k) => window.I18N.t(k);
  const lang = () => window.I18N.lang;

  /* ── categories: segment by TYPE, never by price tier ────────────────────── */
  const CATS = [
    { key: 'villa',       kinds: ['k.villa', 'k.house', 'k.house2', 'k.smallhouse', 'k.renov', 'k.apartment'] },
    { key: 'land',        kinds: ['k.plot', 'k.partnerplot'] },
    { key: 'hospitality', kinds: ['k.taverna', 'k.hotel'] },
    { key: 'commercial',  kinds: ['k.shop'] }
  ].map((c) => ({ key: c.key, match: (o) => c.kinds.indexOf(o.kindKey) > -1 }));
  const catOf = (o) => (CATS.find((c) => c.match(o)) || { key: 'villa' }).key;

  /* ── formatting — never invents a number ─────────────────────────────────── */
  const loc = () => ({ ru: 'ru-RU', pl: 'pl-PL', en: 'en-GB' }[lang()] || 'en-GB');
  const money = (n, cur) => (n == null ? null : new Intl.NumberFormat(loc(), { style: 'currency', currency: cur || 'EUR', maximumFractionDigits: 0 }).format(n));
  const m2 = (n) => (n == null ? null :
    new Intl.NumberFormat(loc()).format(n).replace(/\s/g, '\u202F') + '\u00A0' + t('unit.m2'));
  const pick = (o, base) => {
    const L = lang();
    if (L === 'ru' && o[base + 'Ru']) return o[base + 'Ru'];
    if (L === 'en' && o[base + 'En']) return o[base + 'En'];
    return o[base];
  };
  const nameOf = (o) => pick(o, 'name');
  const areaOf = (o) => pick(o.location, 'area');
  const kindOf = (o) => (o.kindKey ? t(o.kindKey) : '');
  const no = (i) => String(i + 1).padStart(2, '0');

  const state = { cat: 'all', selected: null, view: 'grid', area: null, open: false,
    f: { loc: [], use: [], cond: [], op: [], m2: [], land: [], sea: false } };
  const Iron = { state,
    list: () => window.IronStore.list(),
    get: (id) => window.IronStore.get(id),
    catOf, nameOf, areaOf, no, t };
  window.Iron = Iron;

  const areaKey = (o) => o.location.areaEn || o.location.area;
  const visible = (o) => passes(o, null);
  const indexOfId = (id) => Iron.list().findIndex((o) => o.id === id);

  /* ── status: desaturated, quiet ──────────────────────────────────────────── */
  function statusOf(o) {
    if (o.condition === 'ready') return { cls: 'st-ready', label: t('cond.ready') };
    if (o.condition === 'renovation') return { cls: 'st-progress', label: t('cond.renovation') };
    if (o.condition === 'shell') return { cls: 'st-progress', label: t('cond.shell') };
    if (o.condition === 'land') return { cls: 'st-quiet', label: t('cond.land') };
    return null;
  }

  /* ── hero figures ────────────────────────────────────────────────────────── */
  function renderFigs() {
    const all = Iron.list();
    const areas = new Set(all.map((o) => o.location.areaEn || o.location.area));
    const sea = all.filter((o) => o.location.seaView).length;
    const land = all.reduce((s, o) => s + (o.land_m2 || 0), 0);
    const figs = [
      [all.length, 'fig.objects'],
      [areas.size, 'fig.areas'],
      [sea, 'fig.sea'],
      [land ? (land >= 10000 ? new Intl.NumberFormat(loc(), { maximumFractionDigits: 1 }).format(land / 10000) + ' ' + t('unit.ha') : new Intl.NumberFormat(loc()).format(land) + ' m²') : '—', 'fig.land']
    ];
    const host = $('#collFigs');
    if (host) host.innerHTML = figs.map(([v, k]) =>
      `<div class="fig"><b>${esc(String(v))}</b><span>${esc(t(k))}</span></div>`).join('');
  }

  /* ══ FILTERS ══════════════════════════════════════════════════════════════
     Category row stays the primary facet. Everything else lives in a
     disclosure. A group is only rendered if it can actually split the set:
     fewer than two properties with a value means it is not a filter yet, so
     it stays wired but hidden until the data arrives.
     ══════════════════════════════════════════════════════════════════════ */
  const RES_KINDS = ['k.house2', 'k.renov', 'k.smallhouse', 'k.apartment', 'k.house', 'k.villa'];
  const NONRES_KINDS = ['k.taverna', 'k.shop', 'k.hotel'];
  const useOf = (o) => RES_KINDS.indexOf(o.kindKey) > -1 ? 'res'
                     : (NONRES_KINDS.indexOf(o.kindKey) > -1 ? 'nonres' : null);

  const BUCKETS = {
    m2:   [[0, 100], [100, 200], [200, 350], [350, Infinity]],
    land: [[0, 500], [500, 2000], [2000, 6000], [6000, Infinity]]
  };
  const bLabel = (b) => (b[0] === 0 ? '< ' + b[1] : (b[1] === Infinity ? b[0] + '+' : b[0] + '–' + b[1])) + ' м²';
  const bKey = (b) => b[0] + '_' + (b[1] === Infinity ? 'inf' : b[1]);
  const inB = (v, b) => v != null && v >= b[0] && v < b[1];
  const valOf = (o, field) => (field === 'm2' ? o.area_m2 : o.land_m2);

  /* one predicate per group, so facet counts can exclude their own group */
  const PRED = {
    loc:  (o, sel) => !sel.length || sel.indexOf(areaKey(o)) > -1,
    use:  (o, sel) => !sel.length || sel.indexOf(useOf(o)) > -1,
    cond: (o, sel) => !sel.length || sel.indexOf(o.condition) > -1,
    op:   (o, sel) => !sel.length || sel.indexOf(o.op) > -1,
    m2:   (o, sel) => !sel.length || sel.some((k) => k === 'na' ? o.area_m2 == null
            : BUCKETS.m2.some((b) => bKey(b) === k && inB(o.area_m2, b))),
    land: (o, sel) => !sel.length || sel.some((k) => k === 'na' ? o.land_m2 == null
            : BUCKETS.land.some((b) => bKey(b) === k && inB(o.land_m2, b))),
    sea:  (o, on) => !on || !!o.location.seaView
  };

  function passes(o, skip) {
    if (!(state.cat === 'all' || catOf(o) === state.cat)) return false;
    if (state.area && areaKey(o) !== state.area) return false;
    for (const g in PRED) {
      if (g === skip) continue;
      if (!PRED[g](o, g === 'sea' ? state.f.sea : state.f[g])) return false;
    }
    return true;
  }
  /* count an option as if only it were added to the current combination */
  const countIf = (group, test) => Iron.list().filter((o) => passes(o, group) && test(o)).length;

  function groupsSpec() {
    const all = Iron.list();
    const has = (fn) => all.filter(fn).length;
    const g = [];

    const locs = [];
    all.forEach((o) => { const k = areaKey(o); if (locs.indexOf(k) < 0) locs.push(k); });
    if (locs.length > 1) g.push({ id: 'loc', title: t('f.location'), type: 'check',
      opts: locs.map((k) => ({ v: k, label: areaOf(all.filter((o) => areaKey(o) === k)[0]),
        n: countIf('loc', (o) => areaKey(o) === k) })) });

    if (has((o) => useOf(o) === 'res') && has((o) => useOf(o) === 'nonres'))
      g.push({ id: 'use', title: t('f.use'), type: 'check', opts: [
        { v: 'res', label: t('use.res'), n: countIf('use', (o) => useOf(o) === 'res') },
        { v: 'nonres', label: t('use.nonres'), n: countIf('use', (o) => useOf(o) === 'nonres') }] });

    const conds = ['ready', 'renovation', 'shell', 'land'].filter((c) => has((o) => o.condition === c));
    if (conds.length > 1) g.push({ id: 'cond', title: t('f.condition'), type: 'check',
      opts: conds.map((c) => ({ v: c, label: t('cond.' + c), n: countIf('cond', (o) => o.condition === c) })) });

    const ops = ['sale', 'rent', 'business', 'prep'].filter((c) => has((o) => o.op === c));
    if (ops.length > 1) g.push({ id: 'op', title: t('f.op'), type: 'check',
      opts: ops.map((c) => ({ v: c, label: t('op.' + c), n: countIf('op', (o) => o.op === c) })) });

    /* numeric groups appear only once at least two properties carry a value */
    [['m2', 'f.area'], ['land', 'f.land']].forEach(([field, tk]) => {
      const known = all.filter((o) => valOf(o, field) != null).length;
      if (known < 2) return;
      const opts = BUCKETS[field]
        .filter((b) => all.some((o) => inB(valOf(o, field), b)))
        .map((b) => ({ v: bKey(b), label: bLabel(b), n: countIf(field, (o) => inB(valOf(o, field), b)) }));
      const na = all.length - known;
      if (na) opts.push({ v: 'na', label: t('f.unknown'), n: countIf(field, (o) => valOf(o, field) == null) });
      if (opts.length > 1) g.push({ id: field, title: t(tk), type: 'pill', opts });
    });

    if (has((o) => o.location.seaView)) g.push({ id: 'sea', title: t('f.features'), type: 'toggle',
      opts: [{ v: 'sea', label: t('f.sea'), n: countIf('sea', (o) => !!o.location.seaView) }] });

    return g;
  }

  const activeCount = () => ['loc', 'use', 'cond', 'op', 'm2', 'land']
    .reduce((n, g) => n + state.f[g].length, 0) + (state.f.sea ? 1 : 0);

  function renderFilters() {
    const all = Iron.list();
    const counts = {}; CATS.forEach((c) => { counts[c.key] = all.filter((o) => catOf(o) === c.key).length; });
    const btn = (key, label, n) =>
      `<button class="filt" type="button" data-cat="${key}" aria-pressed="${state.cat === key}">${esc(label)}<sup>${n}</sup></button>`;
    const a = activeCount();
    const right = `<span class="filters__right">
        <button class="fbtn" type="button" id="fToggle" aria-expanded="${state.open}" aria-controls="fpanel">
          ${esc(t('f.filters'))}${a ? `<b>${a}</b>` : ''}<i class="fbtn__chev" aria-hidden="true"></i>
        </button>
        <span class="filters__div" aria-hidden="true"></span>
        <span class="views" role="group" aria-label="${esc(t('view.label'))}">
          <button type="button" data-view="grid" aria-pressed="${state.view === 'grid'}">${esc(t('view.grid'))}</button>
          <button type="button" data-view="list" aria-pressed="${state.view === 'list'}">${esc(t('view.list'))}</button>
        </span>
      </span>`;
    $('#filters').innerHTML =
      btn('all', t('coll.all'), all.length) +
      CATS.filter((c) => counts[c.key] > 0).map((c) => btn(c.key, t('cat.' + c.key), counts[c.key])).join('') + right;
    $('#filters').querySelectorAll('.filt').forEach((b) => b.addEventListener('click', () => setCat(b.dataset.cat)));
    $('#filters').querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
    $('#fToggle').addEventListener('click', togglePanel);
    renderPanel();
  }

  function renderPanel() {
    const gs = groupsSpec();
    const box = $('#fpanelIn');
    box.innerHTML = gs.map((g) => {
      const rows = g.opts.map((o) => {
        const on = g.id === 'sea' ? state.f.sea : state.f[g.id].indexOf(o.v) > -1;
        if (g.type === 'pill') {
          return `<label class="pill${on ? ' on' : ''}${o.n === 0 ? ' zero' : ''}">
            <input type="checkbox" data-g="${g.id}" value="${esc(o.v)}"${on ? ' checked' : ''}>
            ${esc(o.label)}<b>${o.n}</b></label>`;
        }
        return `<label class="chk${o.n === 0 ? ' zero' : ''}">
          <input type="checkbox" data-g="${g.id}" value="${esc(o.v)}"${on ? ' checked' : ''}>
          <span class="chk__box" aria-hidden="true"></span>
          <span class="chk__t">${esc(o.label)}</span>
          <span class="chk__n" aria-hidden="true">${o.n}</span>
          <span class="sr-only">, ${o.n}</span></label>`;
      }).join('');
      return `<fieldset class="fgrp"><legend>${esc(g.title)}</legend>
        <div class="fgrp__b${g.type === 'pill' ? ' fgrp__b--pills' : ''}">${rows}</div></fieldset>`;
    }).join('') + `<div class="fpanel__foot"><button type="button" class="freset" id="fReset"${activeCount() ? '' : ' hidden'}>${esc(t('f.reset'))}</button></div>`;

    box.querySelectorAll('input[type=checkbox]').forEach((i) => i.addEventListener('change', () => {
      const g = i.dataset.g, v = i.value;
      if (g === 'sea') state.f.sea = i.checked;
      else {
        const arr = state.f[g], k = arr.indexOf(v);
        if (i.checked && k < 0) arr.push(v); else if (!i.checked && k > -1) arr.splice(k, 1);
      }
      applyFilters();
    }));
    const rst = $('#fReset'); if (rst) rst.addEventListener('click', resetFilters);
  }

  function togglePanel() {
    state.open = !state.open;
    const p = $('#fpanel'), b = $('#fToggle');
    p.dataset.open = String(state.open);
    b.setAttribute('aria-expanded', String(state.open));
    if (state.open) { p.removeAttribute('inert'); setTimeout(() => { const f = p.querySelector('input'); if (f) f.focus(); }, 120); }
    else { p.setAttribute('inert', ''); b.focus(); }
  }
  function resetFilters() {
    state.f = { loc: [], use: [], cond: [], op: [], m2: [], land: [], sea: false };
    applyFilters();
  }
  function applyFilters() { renderFilters(); renderColl(); }

  function renderChips() {
    const box = $('#chips'); if (!box) return;
    const gs = groupsSpec(); const out = [];
    gs.forEach((g) => g.opts.forEach((o) => {
      const on = g.id === 'sea' ? state.f.sea : state.f[g.id].indexOf(o.v) > -1;
      if (on) out.push({ g: g.id, v: o.v, label: o.label });
    }));
    if (!out.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML = out.map((c) =>
      `<span class="chip">${esc(c.label)}<button type="button" data-g="${c.g}" data-v="${esc(c.v)}" aria-label="${esc(t('f.remove'))}: ${esc(c.label)}">×</button></span>`).join('')
      + `<button type="button" class="freset" id="chipReset">${esc(t('f.reset'))}</button>`;
    box.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => {
      const g = b.dataset.g;
      if (g === 'sea') state.f.sea = false;
      else { const k = state.f[g].indexOf(b.dataset.v); if (k > -1) state.f[g].splice(k, 1); }
      applyFilters();
    }));
    $('#chipReset').addEventListener('click', resetFilters);
  }

  function setView(v) {
    state.view = v;
    $('#filters').querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
    renderColl();
  }
  function setCat(cat) {
    state.cat = cat;
    applyFilters();
    document.dispatchEvent(new CustomEvent('iron:filter', { detail: { cat } }));
  }

  /* ── the collection ──────────────────────────────────────────────────────── */
  function plate(o, i) {
    const st = statusOf(o);
    const stHtml = st ? `<span class="ent__st ${st.cls}"><i></i>${esc(st.label)}</span>` : '';
    if (o.media.cover) {
      // If the file is not there yet the image removes itself and the honest
      // typographic plate underneath shows through — never a broken icon.
      return `<div class="ent__plate ent__plate--photo plate--empty">
        <img src="${esc(o.media.cover)}" alt="${esc(nameOf(o))}" loading="lazy"
             onerror="this.closest('.ent__plate').classList.remove('ent__plate--photo');this.remove();">
        <span class="ent__idx">No. ${no(i)}</span>${stHtml}
        <span class="pl__nm">${esc(nameOf(o))}</span>
        <span class="rule" aria-hidden="true"></span>
        <span class="pl__soon">${esc(t('photo.soon'))}</span>
      </div>`;
    }
    // honest typographic placeholder — an intentional editorial state
    return `<div class="ent__plate plate--empty">
      <span class="ent__idx">No. ${no(i)}</span>${stHtml}
      <span class="pl__nm">${esc(nameOf(o))}</span>
      <span class="rule" aria-hidden="true"></span>
      <span class="pl__soon">${esc(t('photo.soon'))}</span>
    </div>`;
  }

  function priceHtml(o) {
    const p = o.price.sale != null ? money(o.price.sale, o.price.currency)
      : (o.op === 'rent' && o.price.rentMonthly != null ? money(o.price.rentMonthly, o.price.currency) + ' ' + t('per.month') : null);
    return p ? `<span class="ent__price">${esc(p)}</span>`
             : `<span class="ent__price ent__price--req">${esc(t('price.request'))}</span>`;
  }

  function entry(o, i) {
    const specs = [];
    if (o.area_m2) specs.push(`<span class="n">${esc(m2(o.area_m2))}</span>`);
    if (o.land_m2) specs.push(`<span class="n">${esc(m2(o.land_m2))}</span>`);
    if (o.location.seaView) specs.push(`<span>${esc(t('f.sea'))}</span>`);
    const specHtml = '<span class="ent__figs">'
      + specs.join('<span class="sep" aria-hidden="true">·</span>') + '</span>';
    return `<button class="ent" data-id="${esc(o.id)}" aria-label="${esc(nameOf(o))}">
      ${plate(o, i)}
      <span class="ent__body">
        <span class="ent__kind">${esc(kindOf(o))}</span>
        <span class="ent__nm">${esc(nameOf(o))}</span>
        <span class="ent__loc" title="${esc(areaOf(o))}">${esc(areaOf(o))}</span>
        <span class="ent__specs">${specHtml}${priceHtml(o)}</span>
      </span>
    </button>`;
  }

  function renderColl() {
    const all = Iron.list();
    const items = all.map((o, i) => ({ o, i })).filter(({ o }) => visible(o));
    const coll = $('#coll');
    coll.className = 'coll' + (state.view === 'list' ? ' coll--list' : '');
    coll.innerHTML = items.map(({ o, i }) => entry(o, i)).join('');
    coll.querySelectorAll('.ent').forEach((b) => {
      b.addEventListener('click', () => Iron.openObject(b.dataset.id));
    });
    // a private collection states its range, it does not announce a result count
    const cc = $('#collCount');
    if (cc) cc.textContent = `${t('nav.collection')} · ${all.length}`;
    renderChips();

    // nothing matched — say so plainly and offer the one recovery action
    const emptyBox = $('#empty');
    if (emptyBox) {
      if (!items.length) {
        emptyBox.hidden = false;
        emptyBox.innerHTML = `<h3>${esc(t('empty.title'))}</h3><p>${esc(t('empty.sub'))}</p>
          <button type="button" class="freset" id="emptyReset">${esc(t('f.reset'))}</button>`;
        $('#emptyReset').addEventListener('click', () => { state.area = null; resetFilters(); });
      } else emptyBox.hidden = true;
    }
    const ann = $('#announcer');
    if (ann) ann.textContent = `${t('shown')} ${items.length} ${t('of')} ${all.length}`;

    // when the plate filtered us to one place, say so and offer the way back
    const note = $('#collNote');
    if (note) {
      if (state.area) {
        note.hidden = false;
        note.innerHTML = `${esc(t('coll.filtered'))} <b>${esc(state.area)}</b> · <button type="button" id="clearArea">${esc(t('coll.showall'))}</button>`;
        $('#clearArea').addEventListener('click', () => { state.area = null; renderColl(); });
      } else note.hidden = true;
    }
    revealInit();
  }

  /* ── dossier ─────────────────────────────────────────────────────────────── */
  const dossier = $('#dossier'), scrim = $('#scrim');
  let tab = 'overview', returnFocus = null;

  const row = (label, value, mono) => {
    const empty = value == null || value === '';
    return `<div><dt>${esc(label)}</dt><dd class="${empty ? 'tbd' : (mono ? 'n' : '')}">${empty ? esc(t('tbd')) : value}</dd></div>`;
  };

  function viewOverview(o) {
    const cur = o.price.currency;
    const st = statusOf(o);
    const price = o.price.sale != null ? money(o.price.sale, cur)
      : (o.price.rentMonthly != null ? money(o.price.rentMonthly, cur) + ' ' + t('per.month') : t('price.request'));
    let g = '';
    if (o.greece && o.greece.ota && o.greece.ota.listed) {
      g += `<div class="note note--bronze"><b>${esc(t('greece.ota'))}</b> — ${esc(t('greece.ota.yes'))}</div>`;
    }
    return `<div class="spec">
      <div class="spec__h"><span class="rule" aria-hidden="true"></span><span class="label">${esc(t('dos.specs'))}</span></div>
      <dl>
        ${row(t('f.kind'), esc(kindOf(o)))}
        ${st ? row(t('f.condition'), esc(st.label)) : ''}
        ${o.stars ? row(t('f.stars'), '★'.repeat(o.stars)) : ''}
        ${o.units ? row(t('f.units'), o.units, true) : ''}
        ${(o.rooms && o.rooms.bed) ? row(t('f.bedrooms'), o.rooms.bed, true) : ''}
        ${(o.rooms && o.rooms.bath) ? row(t('f.bathrooms'), o.rooms.bath, true) : ''}
        ${(o.rooms && o.rooms.sleeps) ? row(t('f.sleeps'), o.rooms.sleeps, true) : ''}
        ${row(t('f.area'), m2(o.area_m2), true)}
        ${row(t('f.land'), m2(o.land_m2), true)}
        ${(o.facilities && o.facilities.length) ? row(t('f.facilities'), o.facilities.map((f) => esc(t(f))).join(' · ')) : ''}
        ${(o.nearby && o.nearby.beachMin) ? row(t('f.beach'), `${o.nearby.beachMin} ${esc(t('unit.minwalk'))}`, true) : ''}
        ${(o.nearby && o.nearby.beachM) ? row(t('f.beach'), `${o.nearby.beachM} ${esc(t('unit.m'))}`, true) : ''}
        ${(o.nearby && o.nearby.airportKm) ? row(t('f.airport'), `${String(o.nearby.airportKm).replace('.', ',')} ${esc(t('unit.km'))}`, true) : ''}
        ${row(t('f.price'), price === t('price.request') ? `<span style="color:var(--ink-500)">${esc(price)}</span>` : esc(price), true)}
      </dl>
      ${g}
    </div>`;
  }

  function viewDetails(o) {
    const cur = o.price.currency;
    const comm = (o.communications || []).length ? esc(o.communications.join(' · ')) : null;
    const docMap = { ready: t('docs.ready'), partial: t('docs.partial'), pending: t('docs.pending') };
    const enc = o.legal.encumbrances === null ? null : (o.legal.encumbrances ? esc(o.legal.encumbrances) : esc(t('none')));
    return `<div class="spec">
      <div class="spec__h"><span class="rule" aria-hidden="true"></span><span class="label">${esc(t('dos.specs'))}</span></div>
      <dl>
        ${row(t('f.floors'), o.floors, true)}
        ${row(t('f.comm'), comm)}
        ${row(t('f.owner'), o.owner)}
        ${row(t('f.market'), o.marketKey ? esc(t(o.marketKey)) : o.market)}
      </dl>
      <div class="spec__h" style="margin-top:var(--sp-7)"><span class="rule" aria-hidden="true"></span><span class="label">${esc(t('dos.legal'))}</span></div>
      <dl>
        ${row(t('f.legalstatus'), o.legal.status)}
        ${row(t('f.encumbr'), enc)}
        ${row(t('f.docs'), o.legal.docsReady ? esc(docMap[o.legal.docsReady]) : null)}
      </dl>
      <div class="spec__h" style="margin-top:var(--sp-7)"><span class="rule" aria-hidden="true"></span><span class="label">${esc(t('dos.greece'))}</span></div>
      <dl>
        ${row(t('greece.residency'), o.greece.residencyEligible == null ? null : esc(o.greece.residencyEligible ? t('yes') : t('no')))}
        ${row(t('greece.ota'), o.greece.ota.listed == null ? null : esc(o.greece.ota.listed ? t('greece.ota.yes') : t('greece.ota.no')))}
      </dl>
    </div>`;
  }

  function viewPlan(o) {
    const s = o.strategy || {};
    const written = [s.sale, s.rent, s.business].filter(Boolean);
    return `<div class="spec">
      <div class="spec__h"><span class="rule" aria-hidden="true"></span><span class="label">${esc(t('dos.planh'))}</span></div>
      ${written.length ? written.map((x) => `<p class="dos__lead">${esc(x)}</p>`).join('')
                       : `<div class="note">${esc(t('dos.planstub'))}</div>`}
    </div>`;
  }

  const VIEWS = { overview: viewOverview, details: viewDetails, plan: viewPlan };
  const TABS = [['overview', 'dos.overview'], ['details', 'dos.details'], ['plan', 'dos.plan']];

  function renderDossier(o) {
    const i = indexOfId(o.id);
    const coordNote = o.location._coordDraft ? ` · ${t('coord.draft')}` : '';
    const shots = (o.media.photos && o.media.photos.length ? o.media.photos
                   : (o.media.cover ? [o.media.cover] : []));
    const plateHtml = shots.length
      ? `<div class="gal" data-i="0">
           <div class="gal__stage">
             ${shots.map((src, k) => `<img src="${esc(src)}" alt="${esc(nameOf(o))}" class="gal__img${k ? '' : ' on'}"
                 loading="${k ? 'lazy' : 'eager'}" data-k="${k}"
                 onerror="this.dataset.dead='1';this.remove();">`).join('')}
             <span class="gal__none">${esc(t('photo.soon'))}</span>
           </div>
           ${shots.length > 1 ? `<div class="gal__nav">
             <button type="button" class="gal__b" data-d="-1" aria-label="${esc(t('gal.prev'))}">‹</button>
             <span class="gal__c"><b>1</b> / ${shots.length}</span>
             <button type="button" class="gal__b" data-d="1" aria-label="${esc(t('gal.next'))}">›</button>
           </div>` : ''}
         </div>`
      : `<div class="dos__plate plate--empty"><span class="pl__soon">${esc(t('photo.soon'))}</span></div>`;

    dossier.innerHTML = `
      <div class="dos__bar">
        <span class="dos__no">No. ${no(i)}</span>
        <button class="dos__x" id="dosX">${esc(t('dos.close'))}</button>
      </div>
      <div class="dos__body">
        <div class="dos__kind">${esc(kindOf(o))}</div>
        <h2 class="dos__nm" id="dosName">${esc(nameOf(o))}</h2>
        <div class="dos__loc">${esc(areaOf(o))}${esc(coordNote)}</div>
        ${plateHtml}
        <div class="tabs" role="tablist">
          ${TABS.map(([k, lk]) => `<button role="tab" data-tab="${k}" aria-selected="${tab === k}">${esc(t(lk))}</button>`).join('')}
        </div>
        <div id="dosView">${VIEWS[tab](o)}</div>
      </div>
      <div class="dos__foot">
        <a class="btn btn--ink" href="#kontakt" id="dosEnq">${esc(t('dos.enquire'))}</a>
        <button class="btn btn--quiet" id="dosMap" style="color:var(--ink-700);border-bottom-color:var(--hairline)">${esc(t('dos.showmap'))}</button>
      </div>`;

    $('#dosX').addEventListener('click', close);
    $('#dosEnq').addEventListener('click', close);
    $('#dosMap').addEventListener('click', () => {
      close();
      const sec = document.getElementById('plate-sec');
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const key = o.location.areaEn || o.location.area;
      setTimeout(() => { if (window.IronPlate) window.IronPlate.highlight(key); }, 620);
    });
    dossier.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; renderDossier(o); }));

    const gal = dossier.querySelector('.gal');
    if (gal) {
      const imgs = () => [...gal.querySelectorAll('.gal__img')];
      const show = (d) => {
        const list = imgs(); if (list.length < 2) return;
        let i = (+gal.dataset.i + d + list.length) % list.length;
        gal.dataset.i = i;
        list.forEach((im, k) => im.classList.toggle('on', k === i));
        const c = gal.querySelector('.gal__c b'); if (c) c.textContent = i + 1;
      };
      gal.querySelectorAll('[data-d]').forEach((b) =>
        b.addEventListener('click', (e) => { e.stopPropagation(); show(+b.dataset.d); }));
    }
  }

  function openObject(id) {
    const o = Iron.get(id); if (!o) return;
    state.selected = id;
    renderDossier(o);
    scrim.classList.add('on');
    dossier.classList.add('on');
    dossier.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    returnFocus = document.activeElement;
    document.addEventListener('keydown', onKey, true);
    setTimeout(() => { const x = $('#dosX'); if (x) x.focus(); }, 40);
    document.dispatchEvent(new CustomEvent('iron:select', { detail: { id, fly: false } }));
  }
  Iron.openObject = openObject;

  // a plate node with several properties filters the collection to that place
  Iron.focusArea = function (key) {
    state.area = key; state.cat = 'all';
    $('#filters').querySelectorAll('.filt').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === 'all')));
    renderColl();
    const sec = document.getElementById('kolekcja');
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  function close() {
    scrim.classList.remove('on');
    dossier.classList.remove('on');
    dossier.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey, true);
    state.selected = null;
    if (returnFocus && returnFocus.focus) returnFocus.focus();
    returnFocus = null;
  }

  const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); return close(); }
    if (e.key !== 'Tab') return;
    const f = [...dossier.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  scrim.addEventListener('click', close);

  /* ── reveal on scroll — slow fade-up, no spring ──────────────────────────── */
  let io = null;
  function revealAll() { document.querySelectorAll('.ent.rv').forEach((el) => el.classList.add('in')); }
  function revealInit() {
    // Content is visible by default; we only hold an entry back in order to
    // animate it, and a failed observer can never leave the grid blank.
    if (!('IntersectionObserver' in window) || reduceMotion()) return revealAll();
    if (!io) io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -6% 0px' });
    const vh = window.innerHeight;
    let onScreen = 0;
    document.querySelectorAll('.ent:not(.rv)').forEach((el) => {
      el.classList.add('rv');
      const top = el.getBoundingClientRect().top;
      if (top < vh * 0.95) {
        // already in view (first paint, or a filter change) — settle it now
        el.style.transitionDelay = Math.min(onScreen++, 7) * 40 + 'ms';
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
      } else {
        el.style.transitionDelay = '0ms';
        io.observe(el);
      }
    });
    clearTimeout(revealInit._t);
    revealInit._t = setTimeout(revealAll, 2500);
  }

  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── language ────────────────────────────────────────────────────────────── */
  function syncLangButtons() {
    document.querySelectorAll('.lang button').forEach((x) =>
      x.setAttribute('aria-pressed', String(x.dataset.lang === window.I18N.lang)));
  }
  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
    window.I18N.set(b.dataset.lang);   // an explicit pick is remembered
    syncLangButtons();
  }));

  /* the narrow-screen stand-in for the plate: same places, same counts */
  function renderPlaces() {
    const host = $('#places'); if (!host) return;
    const by = {};
    Iron.list().forEach((o) => {
      const k = areaKey(o);
      if (!by[k]) by[k] = { k, n: 0, label: areaOf(o), key: false };
      by[k].n++; by[k].key = by[k].key || !!o._flagship;
    });
    host.innerHTML = Object.values(by).map((g) =>
      `<button class="places__row${g.key ? ' is-key' : ''}" type="button" data-area="${esc(g.k)}">
         <span class="places__dot" aria-hidden="true"></span>
         <span class="places__n">${esc(g.label.split(',')[0].toUpperCase())}</span>
         <span class="places__c">${g.n} ${esc(t('plate.props'))}</span>
       </button>`).join('');
    host.querySelectorAll('[data-area]').forEach((b) =>
      b.addEventListener('click', () => Iron.focusArea(b.dataset.area)));
  }

  /* mobile menu */
  (function () {
    const b = $('#burger'), m = $('#mnav');
    if (!b || !m) return;
    b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(open));
      m.hidden = !open;
    });
    m.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') { b.setAttribute('aria-expanded', 'false'); m.hidden = true; }
    });
  })();

  function renderAll() {
    renderFigs(); renderPlaces(); renderFilters(); renderColl();
    if (state.selected) { const o = Iron.get(state.selected); if (o) renderDossier(o); }
  }
  document.addEventListener('iron:lang', renderAll);
  document.addEventListener('iron:changed', renderAll);

  window.I18N.init();      // browser language decides, unless the visitor chose before
  window.I18N.apply();
  syncLangButtons();
  renderAll();
})();
