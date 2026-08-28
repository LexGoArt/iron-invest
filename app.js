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
  /* В таблице «Тип» — это типология, а не описание: «Дом под полный ремонт»
     дублировал соседнюю колонку состояния и не влезал. Полная формулировка
     остаётся в карточке объекта и в подсказке. */
  const kindOf = (o) => (o.kindKey ? t(o.kindKey) : '');
  const kindShort = (o) => {
    if (!o.kindKey) return '';
    const sh = t(o.kindKey + '.s');            // t() возвращает сам ключ, если его нет
    return sh === o.kindKey + '.s' ? t(o.kindKey) : sh;
  };
  const no = (i) => String(i + 1).padStart(2, '0');

  const state = { cat: 'all', selected: null, view: 'table', area: null, open: false,
    tpane: 'people', tview: 'map', sort: null, sortDir: 1, docsObj: null,
    f: { loc: [], use: [], cond: [], op: [], m2: [], land: [], sea: false },
    q: '', quick: null, mode: 'objects' };
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

  /* quick filters answer "what needs attention", not "what is pretty" */
  const QUICK = {
    blocked: (o) => Iron.blockersOf(o).length > 0,
    nodocs:  (o) => !o.docs || o.docs.have == null || (o.docs.total && o.docs.have < o.docs.total),
    noprice: (o) => o.price.sale == null && o.price.rentMonthly == null,
    nostage: (o) => !o.stage,
    noowner: (o) => !o.responsible || !o.responsible.personId
  };

  /* ── ТРИ РАЗНЫЕ ВЕЩИ, КОТОРЫЕ РАНЬШЕ НАЗЫВАЛИСЬ ОДНИМ СЛОВОМ «ГОТОВ» ──────
     1. condition  — физическое состояние стен: его видно глазами;
     2. stage      — где объект в процессе: это управленческий факт;
     3. readiness  — можно ли его выставлять: это ВЫВОД из первых двух плюс
                     документы, цена и ответственный.
     Портал раньше показывал «7 готовы», имея в виду (1), а читалось это как
     (3) — при том что по всем 11 не было ни документов, ни цены. Поэтому
     readiness не хранится в данных: он вычисляется, и разойтись с фактами
     физически не может. */
  const BLOCKERS = [
    { k: 'docs',  test: QUICK.nodocs },
    { k: 'price', test: QUICK.noprice },
    { k: 'stage', test: QUICK.nostage },
    { k: 'owner', test: QUICK.noowner }
  ];
  const blockersOf = (o) => BLOCKERS.filter((b) => b.test(o)).map((b) => b.k);
  const readinessOf = (o) => {
    const n = blockersOf(o).length;
    if (n === 0) return o.stage === 'ready' || o.stage === 'deal' ? 'deal' : 'publish';
    return 'blocked';
  };
  Iron.blockersOf = blockersOf;
  Iron.readinessOf = readinessOf;
  function matchesQuery(o) {
    const q = state.q.trim().toLowerCase();
    if (!q) return true;
    return [nameOf(o), areaOf(o), kindOf(o), (o.responsible && o.responsible.name) || '', o.nextStep || '']
      .join(' ').toLowerCase().indexOf(q) > -1;
  }
  function passes(o, skip) {
    if (!matchesQuery(o)) return false;
    if (state.quick && QUICK[state.quick] && !QUICK[state.quick](o)) return false;
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
          <button type="button" data-view="table" aria-pressed="${state.view === 'table'}">${esc(t('view.table'))}</button>
          <button type="button" data-view="grid" aria-pressed="${state.view === 'grid'}">${esc(t('view.grid'))}</button>
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

  /* ── working summary: counts that are also filters ──────────────────────── */
  /* дата в локали страницы: реестр хранит ISO, читатель видит своё */
  function fmtDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    const loc = { ru: 'ru-RU', pl: 'pl-PL', en: 'en-GB' }[lang()] || 'ru-RU';
    return d.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  const fmtShort = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    const loc = { ru: 'ru-RU', pl: 'pl-PL', en: 'en-GB' }[lang()] || 'ru-RU';
    return d.toLocaleDateString(loc, { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  function renderSummary() {
    const all = Iron.list();
    const upd = $('#introUpd');
    if (upd) {
      const d = (window.IronData && window.IronData.registryUpdated) || null;
      upd.textContent = d ? t('intro.upd') + ' ' + fmtDate(d) : '';
    }
    const box = $('#sumNums'), qbox = $('#sumQuick');
    if (!box) return;
    const techReady = all.filter((o) => o.condition === 'ready').length;
    const publishable = all.filter((o) => readinessOf(o) !== 'blocked').length;
    const blocked = all.filter((o) => readinessOf(o) === 'blocked').length;
    const nums = [
      [all.length, t('sum.total'), null, null],
      [techReady, t('sum.techReady'), null, 'flat'],
      [publishable, t('sum.publishable'), null, publishable ? 'ok' : 'zero'],
      [blocked, t('sum.blocked'), 'blocked', blocked ? 'warn' : 'ok']
    ];
    box.innerHTML = nums.map(([n, label, q, tone]) =>
      q ? `<button class="sum__n sum__n--${tone || 'flat'}" type="button" data-quick="${q}"
             aria-pressed="${state.quick === q}"><b>${n}</b><span>${esc(label)}</span></button>`
        : `<span class="sum__n sum__n--${tone || 'flat'}"><b>${n}</b><span>${esc(label)}</span></span>`).join('');
    const quicks = [['nodocs', t('sum.nodocs')], ['noprice', t('sum.noprice')],
                    ['nostage', t('sum.nostage')], ['noowner', t('sum.noowner')]];
    qbox.innerHTML = quicks.map(([k, label]) =>
      `<button class="qf" type="button" data-quick="${k}" aria-pressed="${state.quick === k}">${esc(label)}<sup>${all.filter(QUICK[k]).length}</sup></button>`).join('')
      + (state.quick ? `<button class="qf qf--clear" type="button" data-quick="">${esc(t('sum.all'))}</button>` : '');
    const defs = $('#defsIn');
    if (defs) defs.innerHTML = ['cond', 'pub', 'blk'].map((k) =>
      `<p><b>${esc(t('def.' + k + 'T'))}</b> ${esc(t('def.' + k + 'D'))}</p>`).join('');

    [box, qbox].forEach((el) => el.querySelectorAll('[data-quick]').forEach((b) =>
      b.addEventListener('click', () => { state.quick = b.dataset.quick || null; applyFilters(); })));
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

  const dash = '—';
  const stageOf = (o) => (o.stage ? t('stage.' + o.stage) : dash);
  const docsOf = (o) => (o.docs && o.docs.have != null && o.docs.total ? o.docs.have + ' / ' + o.docs.total : dash);
  const priceOf = (o) => (o.price.sale != null ? money(o.price.sale, o.price.currency)
    : (o.price.rentMonthly != null ? money(o.price.rentMonthly, o.price.currency) + ' ' + t('per.month') : t('price.request')));

  /* the register: eleven properties should fit on one screen */
  /* Каждая ячейка, которую может обрезать, несёт полный текст в title:
     решение принимают по этим колонкам, и «Ответстве…» его не поддерживает. */
  const cell = (cls, text, extra) => {
    // часть источников уже возвращает прочерк — он тоже означает «нет данных»
    const empty = text == null || text === '' || text === dash;
    const v = empty ? dash : String(text);
    // пустое поле помечается: на мобильном карточка не должна состоять из прочерков
    return `<span class="${cls}${empty ? ' is-empty' : ''}${extra || ''}"
      title="${esc(v)}">${esc(v)}</span>`;
  };
  function tableRow(o, i) {
    const st = statusOf(o);
    const price = o.price.sale != null || o.price.rentMonthly != null
      ? priceOf(o) : t('price.requestShort');
    return `<button class="row" data-id="${esc(o.id)}" role="row">
      <span class="row__i">${no(i)}</span>
      ${cell('row__nm', nameOf(o))}
      <span class="row__k" title="${esc(kindOf(o))}">${esc(kindShort(o))}</span>
      ${cell('row__loc', areaOf(o).split(',')[0])}
      <span class="row__st${st ? ' ' + st.cls : ''}" title="${esc(st ? st.label : dash)}">${st ? '<i></i>' + esc(st.label) : dash}</span>
      ${cell('row__p', price)}
      ${cell('row__d', docsOf(o))}
      ${cell('row__r', (o.responsible && o.responsible.name) || null, '" data-lb="' + esc(t('th.owner')))}
      ${cell('row__nx', o.nextStep || null, '" data-lb="' + esc(t('th.next')))}
    </button>`;
  }
  function tableHead() {
    // head cells carry the same column classes as the body, otherwise the
    // responsive rules hide body cells while the header keeps all nine and wraps
    const cols = [['row__i','th.no',null], ['row__nm','th.name','name'], ['row__k','th.kind','kind'],
                  ['row__loc','th.loc','loc'], ['row__st','th.stage','cond'], ['row__p','th.price','price'],
                  ['row__d','th.docs','docs'], ['row__r','th.owner','owner'], ['row__nx','th.next','next']];
    return `<div class="row row--head" role="row">${cols.map(([c, k, sortKey]) => sortKey
      ? `<button class="${c} th" type="button" data-sort="${sortKey}"
           aria-sort="${state.sort === sortKey ? (state.sortDir > 0 ? 'ascending' : 'descending') : 'none'}"
           >${esc(t(k))}<i class="th__a" aria-hidden="true"></i></button>`
      : `<span class="${c}">${esc(t(k))}</span>`).join('')}</div>`;
  }

  /* Сортировка. Ключ считается один раз на строку, пустые значения всегда
     уезжают вниз независимо от направления: «нет данных» — это не «меньше». */
  const SORTV = {
    name: (o) => nameOf(o).toLowerCase(),
    kind: (o) => kindOf(o).toLowerCase(),
    loc:  (o) => areaOf(o).toLowerCase(),
    cond: (o) => o.condition || '',
    price:(o) => (o.price.sale != null ? o.price.sale
                 : (o.price.rentMonthly != null ? o.price.rentMonthly : null)),
    docs: (o) => (o.docs && o.docs.have != null ? o.docs.have : null),
    owner:(o) => (o.responsible && o.responsible.name) || '',
    next: (o) => o.nextStep || ''
  };
  function sortItems(items) {
    const k = state.sort; if (!k || !SORTV[k]) return items;
    const dir = state.sortDir || 1;
    return items.slice().sort((a, b) => {
      const x = SORTV[k](a.o), y = SORTV[k](b.o);
      const ex = x == null || x === '', ey = y == null || y === '';
      if (ex && ey) return a.i - b.i;
      if (ex) return 1;              // пустое — всегда внизу
      if (ey) return -1;
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
      return String(x).localeCompare(String(y), lang()) * dir;
    });
  }

  function renderColl() {
    const all = Iron.list();
    const items = sortItems(all.map((o, i) => ({ o, i })).filter(({ o }) => visible(o)));
    const coll = $('#coll');
    coll.className = 'coll coll--' + state.view;
    coll.innerHTML = state.view === 'table'
      ? tableHead() + items.map(({ o, i }) => tableRow(o, i)).join('')
      : items.map(({ o, i }) => entry(o, i)).join('');
    coll.querySelectorAll('.ent, .row[data-id]').forEach((b) => {
      b.addEventListener('click', () => Iron.openObject(b.dataset.id));
    });
    coll.querySelectorAll('[data-sort]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.sort;
      state.sortDir = state.sort === k ? -(state.sortDir || 1) : 1;
      state.sort = k;
      renderColl();
    }));
    // a private collection states its range, it does not announce a result count
    const cc = $('#collCount');
    if (cc) cc.textContent = `${t('nav.collection')} · ${all.length}`;
    renderChips();

    /* Разошедшиеся колонки шапки и тела ломали таблицу уже трижды и каждый раз
       молча. Пусть теперь кричит: проверка стоит один проход по девяти узлам. */
    if (state.view === 'table') {
      const vis = (r) => r ? [].filter.call(r.children,
        (c) => getComputedStyle(c).display !== 'none').length : 0;
      const h = vis(coll.querySelector('.row--head'));
      const b = vis(coll.querySelector('.row[data-id]'));
      if (h && b && h !== b) console.warn(`[iron] колонки разошлись: шапка ${h}, строка ${b}`);
    }

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
        ${o._energy ? row(t('f.energy'), esc(o._energy), true) : ''}
        ${(o._parts && o._parts.length) ? row(t('f.parts'),
          `<span class="parts">${o._parts.map((x) =>
            `<span class="parts__i"><b>${esc(t(x.key))}</b>
               <i>${esc(m2(x.m2))}${x.note ? ' · ' + esc(t(x.note)) : ''}</i></span>`).join('')}</span>`) : ''}
        ${(o.facilities && o.facilities.length) ? row(t('f.facilities'), o.facilities.map((f) => esc(t(f))).join(' · ')) : ''}
        ${(o.rooms && o.rooms.amenities && o.rooms.amenities.length)
          ? row(t('f.roomAmenities'), o.rooms.amenities.map((a) => esc(t(a))).join(' · ')) : ''}
        ${(o.nearby && o.nearby.beachMin) ? row(t('f.beach'), `${o.nearby.beachMin} ${esc(t('unit.minwalk'))}`, true) : ''}
        ${(o.nearby && o.nearby.beachM) ? row(t('f.beach'), `${o.nearby.beachM} ${esc(t('unit.m'))}`, true) : ''}
        ${(o.nearby && o.nearby.airportKm) ? row(t('f.airport'), `${String(o.nearby.airportKm).replace('.', ',')} ${esc(t('unit.km'))}`, true) : ''}
        ${row(t('f.price'), price === t('price.request') ? `<span style="color:var(--ink-500)">${esc(price)}</span>` : esc(price), true)}
      </dl>
      ${g}
    </div>`;
  }

  /* Ссылки и контакты объекта. Всё, что здесь показывается, объект уже
     опубликовал о себе сам — телефон и почта висят на его странице
     в Booking и Facebook. Внутренних контактов тут нет и быть не может. */
  const LINK_LABEL = { booking: 'Booking', tripadvisor: 'TripAdvisor',
    facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', site: 'Site',
    listing: 'Euroland KH371' };

  function viewContacts(o) {
    const addr = o.address ? (o.address[lang()] || o.address.ru || o.address.en) : null;
    const links = (o.links || []).map((l) =>
      `<a class="lnk" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
         ${esc(LINK_LABEL[l.k] || l.k)}<i aria-hidden="true">↗</i></a>`).join('');
    const c = o.contacts || {};
    if (!addr && !links && !c.phone && !c.email) return '';
    return `<div class="spec__h" style="margin-top:var(--sp-7)"><span class="rule" aria-hidden="true"></span>
        <span class="label">${esc(t('dos.contact'))}</span></div>
      <dl>
        ${addr ? row(t('f.address'), esc(addr)) : ''}
        ${o.address && o.address.gr ? row(t('f.addressGr'), `<span lang="el">${esc(o.address.gr)}</span>`) : ''}
        ${row(t('f.coords'), o.location._coordDraft ? null
          : `<span class="mono">${o.location.coords[0].toFixed(6)}, ${o.location.coords[1].toFixed(6)}</span>`)}
        ${c.phone ? row(t('f.phone'), `<a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a>`) : ''}
        ${c.email ? row(t('f.email'), `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`) : ''}
        ${links ? row(t('f.links'), `<span class="lnks">${links}</span>`) : ''}
      </dl>`;
  }

  /* Оценки площадок. Разные шкалы у разных площадок — приводить их к одной
     значило бы придумать число, которого никто не выставлял. */
  function viewRatings(o) {
    if (!o.ratings || !o.ratings.length) return '';
    return `<div class="spec__h" style="margin-top:var(--sp-7)"><span class="rule" aria-hidden="true"></span>
        <span class="label">${esc(t('dos.ratings'))}</span></div>
      <div class="rt">` + o.ratings.map((r) => `<div class="rt__b">
        <div class="rt__h"><b>${String(r.score).replace('.', ',')}</b>
          <span>${esc(t('of'))} ${r.max}</span>
          <em>${esc(r.src)} · ${r.n} ${esc(t('rt.reviews'))}</em></div>
        <div class="rt__d">${(r.detail || []).map(([k, v]) =>
          `<span class="rt__i"><i style="--w:${(v / r.max * 100).toFixed(0)}%"></i>
             <u>${esc(t(k))}</u><b>${String(v).replace('.', ',')}</b></span>`).join('')}</div>
      </div>`).join('') + `</div>`;
  }

  function viewDetails(o) {
    const cur = o.price.currency;
    const comm = (o.communications || []).length
      ? o.communications.map((c) => esc(/^[a-z]+\.[a-z]/.test(c) ? t(c) : c)).join(' · ') : null;
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
        ${row(t('f.legalstatus'), o.legal.status ? esc(/^[a-z]+\.[a-z]/.test(o.legal.status) ? t(o.legal.status) : o.legal.status) : null)}
        ${row(t('f.encumbr'), enc)}
        ${row(t('f.docs'), o.legal.docsReady ? esc(docMap[o.legal.docsReady]) : null)}
      </dl>
      ${viewContacts(o)}
      ${viewRatings(o)}
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

  /* search */
  (function () {
    const inputs = [$('#q'), $('#qm')].filter(Boolean);
    if (!inputs.length) return;
    let tmr;
    inputs.forEach((el) => el.addEventListener('input', () => {
      clearTimeout(tmr);
      tmr = setTimeout(() => {
        state.q = el.value;
        inputs.forEach((o) => { if (o !== el) o.value = el.value; });  // два поля, один запрос
        renderColl();
      }, 120);
    }));
  })();

  /* Objects / Map are modes, not sections — the map no longer sits between
     the header and the work. */
  function setMode(m) {
    state.mode = m;
    const plate = $('#plate-sec'), objects = $('#kolekcja'), sum = $('#sum'), team = $('#team-sec'),
          intro = $('#intro');
    if (plate) plate.hidden = m !== 'map';
    if (objects) objects.hidden = m !== 'objects';
    if (sum) sum.hidden = m !== 'objects';
    if (intro) intro.hidden = m === 'team' || m === 'docs';
    if (team) team.hidden = m !== 'team';
    const docs = $('#docs-sec');
    if (docs) docs.hidden = m !== 'docs';
    document.querySelectorAll('.nav__t').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    if (m === 'map' && window.IronPlate) window.IronPlate.render();
  }
  Iron.setMode = setMode;
  document.querySelectorAll('.nav__t').forEach((b) =>
    b.addEventListener('click', () => setMode(b.dataset.mode)));

  /* ══ TEAM ═══════════════════════════════════════════════════════════════
     Table for the scan, expand-in-place for the detail. People are few and
     their content is prose-shaped, so a second slide-over would be a click
     tax on a roster meant to be read start to finish.
     ══════════════════════════════════════════════════════════════════════ */

  /* Глифы функций. Чертёжный язык плиты: только контур, один вес линии,
     currentColor — иконка живёт в потоке текста, а не рядом с ним. */
  const PATHS = {};
  const G = (d) => d;   // сырой контур: он нужен и в тексте, и внутри схемы
  const GLYPH = {
    owner:     G('<circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.2"/>'),
    ops:       G('<rect x="2.5" y="2.5" width="5" height="5"/><rect x="8.5" y="2.5" width="5" height="5"/><rect x="2.5" y="8.5" width="5" height="5"/><rect x="8.5" y="8.5" width="5" height="5"/>'),
    legal:     G('<path d="M3.5 2h6l3 3v9h-9z"/><path d="M9.5 2v3h3"/><path d="M5.5 8.5h5M5.5 11h3.5"/>'),
    cmo:       G('<path d="M3 6.5v3h2.5l5 3v-9l-5 3z"/><path d="M12.5 5.5a4 4 0 0 1 0 5"/>'),
    web:       G('<rect x="2" y="3" width="12" height="10"/><path d="M2 6h12"/><circle cx="4.2" cy="4.5" r=".5"/>'),
    estimates: G('<rect x="2" y="5" width="12" height="6"/><path d="M5 5v2.5M8 5v3.5M11 5v2.5"/>'),
    deal:      G('<path d="M2 8.5l3-3 3 3 3-3 3 3"/><path d="M2 12l3-3 3 3 3-3 3 3"/>'),
    onsite:    G('<path d="M8 14s4.5-4.6 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 9.4 8 14 8 14z"/><circle cx="8" cy="6.5" r="1.8"/>'),
    tech:      G('<circle cx="5.5" cy="5.5" r="3"/><path d="M7.7 7.7L13 13"/><path d="M11.5 11.5l-1.2 1.2 1.5 1.5 1.2-1.2z"/>'),
    dot:       G('<circle cx="8" cy="8" r="3"/>')
  };
  Object.keys(GLYPH).forEach((k) => { PATHS[k] = GLYPH[k]; });
  const glyph = (k) =>
    `<svg class="gl" viewBox="0 0 16 16" aria-hidden="true">${PATHS[k] || PATHS.dot}</svg>`;

  /* Три состояния функции. Различаются формой, а не только цветом —
     цвет один и тот же в печати и у дальтоника. */
  const STATE = { fixed: 'st.fixed', tentative: 'st.tentative', vacant: 'st.vacant' };
  const stateOf = (p) => p.state || (p.vacant ? 'vacant' : 'fixed');

  const TEAM = window.IronTeam || { people: [], gaps: [], decisions: [], handoffs: [], open: [] };
  const everyone = () => TEAM.people.concat(TEAM.gaps);
  const roleOf = (id) => { const p = everyone().filter((x) => x.id === id)[0]; return p ? p.role : id; };

  /* a person's load is derived, never stored — two copies would drift */
  const loadOf = (p) => Iron.list().filter((o) =>
    o.responsible && (o.responsible.personId === p.id)).length;

  /* ── FIG.02 · Карта ответственности ───────────────────────────────────────
     Радиальная схема: в центре объект, вокруг — функции, которые к нему
     прикладываются. Форма узла кодирует состояние: сплошной контур —
     закреплено, штрих — под вопросом, точки — не закреплено. Смысл читается
     без цвета: схему печатают чёрно-белой. */
  function figResp() {
    const all = everyone();
    const cx = 450, cy = 246, rx = 250, ry = 146;
    const n = all.length;
    const nodes = all.map((p, i) => {
      const a = (-90 + (i * 360) / n) * Math.PI / 180;
      const co = Math.cos(a), si = Math.sin(a);
      return { p, co, si, x: cx + rx * co, y: cy + ry * si, st: stateOf(p) };
    });

    const links = nodes.map((d) => {
      // лёгкий изгиб — иначе девять прямых лучей читаются как колесо, а не как связи
      const mx = cx + (d.x - cx) * 0.55 - d.si * 26;
      const my = cy + (d.y - cy) * 0.55 + d.co * 26;
      return `<path class="rz__link rz__link--${d.st}" d="M${cx} ${cy}Q${mx.toFixed(1)} ${my.toFixed(1)} ${d.x.toFixed(1)} ${d.y.toFixed(1)}"/>`;
    }).join('');

    const marks = nodes.map((d) => {
      const vert = Math.abs(d.co) < 0.3;                 // сверху и снизу подпись центрируется
      const side = d.co >= 0 ? 1 : -1;
      const ax = vert ? 'middle' : (side > 0 ? 'start' : 'end');
      const lx = vert ? d.x : d.x + side * 26;
      const ly = vert ? (d.si < 0 ? d.y - 34 : d.y + 40) : d.y - 4;
      const nm = d.p.name || t(d.p.vacant ? 'team.vacant' : 'team.unassigned');
      return `<g class="rz__n rz__n--${d.st}" data-person="${esc(d.p.id)}"
        tabindex="0" role="button" aria-label="${esc(d.p.role)}">
        <circle class="rz__ring" cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="17"/>
        <svg x="${(d.x - 8).toFixed(1)}" y="${(d.y - 8).toFixed(1)}" width="16" height="16"
             viewBox="0 0 16 16" class="rz__gl">${PATHS[d.p.icon] || PATHS.dot}</svg>
        <text class="rz__role" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${ax}">${esc(d.p.role)}</text>
        <text class="rz__nm" x="${lx.toFixed(1)}" y="${(ly + 15).toFixed(1)}" text-anchor="${ax}">${esc(nm)}</text>
      </g>`;
    }).join('');

    return `<svg class="rz" viewBox="0 0 900 492" role="img"
        aria-label="${esc(t('team.fig1'))}">
      <g class="rz__links">${links}</g>
      <circle class="rz__hub" cx="${cx}" cy="${cy}" r="46"/>
      <text class="rz__hubT" x="${cx}" y="${cy - 3}" text-anchor="middle">${esc(t('team.hub'))}</text>
      <text class="rz__hubN" x="${cx}" y="${cy + 15}" text-anchor="middle">${Iron.list().length}</text>
      ${marks}
    </svg>`;
  }

  /* Покрытие функций одной полосой: сколько закреплено, сколько под вопросом,
     сколько не закреплено вовсе. Считается из данных, руками не дублируется. */
  function figKey() {
    const all = everyone();
    const cnt = { fixed: 0, tentative: 0, vacant: 0 };
    all.forEach((p) => { cnt[stateOf(p)] += 1; });
    const total = all.length || 1;
    const bar = ['fixed', 'tentative', 'vacant'].map((k) =>
      cnt[k] ? `<i class="cov__seg cov__seg--${k}" style="flex:${cnt[k]}"
                   title="${esc(t(STATE[k]))}: ${cnt[k]}"></i>` : '').join('');
    const legend = ['fixed', 'tentative', 'vacant'].map((k) =>
      `<span class="cov__lg"><i class="cov__sw cov__sw--${k}" aria-hidden="true"></i>
        ${esc(t(STATE[k]))} <b>${cnt[k]}</b></span>`).join('');
    return `<div class="cov">
        <div class="cov__bar" role="img"
          aria-label="${esc(t('team.cov'))}: ${cnt.fixed}/${total}">${bar}</div>
        <div class="cov__legend">${legend}</div>
      </div>`;
  }

  /* ── FIG.03 · Путь объекта ────────────────────────────────────────────────
     Этапы — узлы, стыки между ними — места, где поток рвётся. Номер на стыке
     совпадает с номером строки в таблице ниже: схема и текст — одно и то же,
     просто с двух сторон. */
  function figPipe() {
    const st = TEAM.pipeline || [];
    if (!st.length) return '';
    const w = 900, pad = 58, y = 62;
    const gap = (w - pad * 2) / (st.length - 1);
    const nodes = st.map((label, i) => {
      const x = pad + gap * i;
      return `<g class="pp__n">
        <circle class="pp__dot" cx="${x.toFixed(1)}" cy="${y}" r="7"/>
        <text class="pp__lb" x="${x.toFixed(1)}" y="${y - 20}" text-anchor="middle">${esc(label)}</text>
      </g>`;
    }).join('');
    const joints = (TEAM.handoffs || []).map((h, i) => {
      const x = pad + gap * i + gap / 2;
      return `<g class="pp__j" data-ho="${i}" tabindex="0" role="button"
          aria-label="${esc(h.risk)}">
        <path class="pp__hit" d="M${(x - gap / 2).toFixed(1)} ${y}h${gap.toFixed(1)}"/>
        <path class="pp__brk" d="M${x.toFixed(1)} ${y - 9}v18"/>
        <circle class="pp__jn" cx="${x.toFixed(1)}" cy="${y + 30}" r="10"/>
        <text class="pp__jt" x="${x.toFixed(1)}" y="${y + 34}" text-anchor="middle">${i + 1}</text>
      </g>`;
    }).join('');
    return `<svg class="pp" viewBox="0 0 ${w} 108" role="img"
        aria-label="${esc(t('team.fig2'))}">
      <path class="pp__rail" d="M${pad} ${y}H${w - pad}"/>
      ${joints}${nodes}
    </svg>`;
  }


  function personRow(p, i) {
    const n = loadOf(p);
    const st = stateOf(p);
    const groups = [
      ['team.duties', p.responsibilities.map((x) => `<li>${esc(x)}</li>`).join('')],
      ['team.owes', p.deliverables.map((d) =>
        `<li><span>${esc(d.text)}</span><span class="team__st">${d.status ? esc(t('st.' + d.status)) : dash}</span></li>`).join('')],
      ['team.needs', p.dependencies.length ? p.dependencies.map((x) => `<li>${esc(x)}</li>`).join('') : `<li class="tbd">${dash}</li>`],
      ['team.check', p.checks.length ? p.checks.map((x) => `<li>${esc(x)}</li>`).join('') : `<li class="tbd">${dash}</li>`]
    ];
    const openTasks = p.deliverables.filter((d) => d.status === 'open').length;
    return `<button class="team__row is-${st}${n ? ' is-loaded' : ''}" type="button"
        aria-expanded="false" data-person="${esc(p.id)}" data-state="${st}"
        aria-controls="tp-${esc(p.id)}">
        <i class="team__gl" aria-hidden="true">${glyph(p.icon)}</i>
        <span class="team__nm" data-state-label="${esc(p.role + ' · ' + t(STATE[st]))}"
          title="${esc(p.name || t('team.unassigned'))}"
          >${p.name ? esc(p.name) : `<em>${esc(t('team.unassigned'))}</em>`}</span>
        <span class="team__role" title="${esc(p.role)}">${esc(p.role)}</span>
        <span class="team__scope" title="${esc(p.scope)}">${esc(p.scope)}</span>
        <span class="team__n">${n ? n : `<i class="tbd" title="${esc(t('team.noObjects'))}">${dash}</i>`}</span>
        <span class="team__tasks">${openTasks || dash}</span>
        <span class="team__contact"><i class="team__st2 team__st2--${st}"
          aria-hidden="true"></i>${esc(t(STATE[st]))}</span>
        <span class="team__chev" aria-hidden="true"></span>
      </button>
      <div class="fpanel team__panel" data-open="false" id="tp-${esc(p.id)}">
        <div class="fpanel__clip"><div class="fpanel__in team__in">
          <p class="team__owns">${esc(p.owns)}</p>
          <p class="team__zone"><b>${esc(t('team.thScope'))}:</b> ${esc(p.scope)}</p>
          ${p.note ? `<p class="team__fact">${esc(p.note)}</p>` : ''}
          ${groups.map(([k, html]) => `<div class="fgrp"><legend>${esc(t(k))}</legend>
             <ul class="team__list">${html}</ul></div>`).join('')}
        </div></div>
      </div>`;
  }

  /* Список вместо схемы: на узком экране радиальная карта нечитаема, а на
     широком её иногда просто не хочется рассматривать. Одни и те же данные. */
  function respList() {
    return `<ul class="rlist">` + everyone().map((p) => {
      const st = stateOf(p);
      const n = loadOf(p);
      return `<li class="rlist__i is-${st}">
        <button class="rlist__b" type="button" data-goto="${esc(p.id)}">
          <i class="rlist__gl" aria-hidden="true">${glyph(p.icon)}</i>
          <span class="rlist__t">
            <b>${esc(p.role)}</b>
            <span>${p.name ? esc(p.name) : t('team.unassigned')}</span>
          </span>
          <span class="rlist__m">
            <i class="team__st2 team__st2--${st}" aria-hidden="true"></i>${esc(t(STATE[st]))}
            <em>${n ? n + ' ' + t('team.thN').toLowerCase() : t('team.noObjects')}</em>
          </span>
        </button></li>`;
    }).join('') + `</ul>`;
  }

  /* переход со схемы или списка к строке человека — и сразу раскрыть её */
  function gotoPerson(id) {
    const btn = document.querySelector(`.team__row[data-person="${id}"]`);
    if (!btn) return;
    if (btn.getAttribute('aria-expanded') !== 'true') btn.click();
    btn.scrollIntoView({ block: 'center', behavior: 'smooth' });
    btn.focus({ preventScroll: true });
  }

  function renderTeam() {
    const box = $('#team'); if (!box) return;
    // head cells carry the body's column classes, or the responsive rules hide
    // body cells while the header keeps all seven and misaligns
    const head = `<div class="team__row team__row--head" role="row">
      <span class="team__gl"></span>
      <span class="team__nm">${esc(t('team.thName'))}</span>
      <span class="team__role">${esc(t('team.thRole'))}</span>
      <span class="team__scope">${esc(t('team.thScope'))}</span>
      <span class="team__n">${esc(t('team.thN'))}</span>
      <span class="team__tasks">${esc(t('team.thTasks'))}</span>
      <span class="team__contact">${esc(t('team.thState'))}</span>
      <span class="team__chev"></span></div>`;
    box.innerHTML = head + TEAM.people.map(personRow).join('');
    const gaps = $('#teamGaps');
    if (gaps) gaps.innerHTML = TEAM.gaps.map(personRow).join('');

    const f1 = $('#teamFig1');
    if (f1) {
      // на узком экране радиальная схема нечитаема: список — не деградация,
      // а единственная форма, в которой эти данные там работают
      const forced = window.matchMedia('(max-width:720px)').matches;
      const list = forced || state.tview === 'list';
      const seg = document.querySelector('.tbar .seg');
      if (seg) seg.hidden = forced;
      f1.querySelector('.fig__body').innerHTML = list ? respList() : figResp();
      f1.classList.toggle('fig--list', list);
      f1.querySelectorAll('[data-goto], .rz__n').forEach((el) => {
        const id = el.dataset.goto || el.dataset.person;
        if (id) el.addEventListener('click', () => gotoPerson(id));
      });
    }
    document.querySelectorAll('[data-tview]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.tview === state.tview)));
    const key = $('#teamKey'); if (key) key.innerHTML = figKey();
    const raci = $('#teamRaci');
    if (raci) raci.innerHTML = `<b>${esc(t('raci.title'))}</b>`
      + ['d', 'c', 'i'].map((k) => `<span>${esc(t('raci.' + k))}</span>`).join('');
    const f2 = $('#teamFig2'); if (f2) f2.querySelector('.fig__body').innerHTML = figPipe();

    [box, gaps].forEach((host) => host && host.querySelectorAll('[data-person]').forEach((b) => {
      b.addEventListener('click', () => {
        const panel = document.getElementById('tp-' + b.dataset.person);
        const open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', String(open));
        if (panel) panel.dataset.open = String(open);
      });
    }));

    const dec = $('#teamDec');
    if (dec) dec.innerHTML = `<div class="dec__row dec__row--head">
        <span>${esc(t('team.decWhat'))}</span><span>${esc(t('team.decWho'))}</span>
        <span>${esc(t('team.decCons'))}</span><span>${esc(t('team.decInf'))}</span></div>`
      + TEAM.decisions.map((d) => `<div class="dec__row${d.rule ? ' is-rule' : ''}">
          <span class="dec__w">${esc(d.what)}</span>
          <span class="dec__who">${esc(roleOf(d.who))}</span>
          <span>${d.consult.length ? esc(d.consult.map(roleOf).join(' · ')) : dash}</span>
          <span>${d.inform.length ? esc(d.inform.map(roleOf).join(' · ')) : dash}</span></div>`).join('');

    const ho = $('#teamHo');
    if (ho) ho.innerHTML = TEAM.handoffs.map((h, i) => `<div class="ho__row" data-ho="${i}">
        <span class="ho__step"><b class="ho__n">${i + 1}</b>${esc(h.from)} <i aria-hidden="true">→</i> ${esc(h.to)}</span>
        <span class="ho__risk">${esc(h.risk)}</span>
        <span class="ho__rule">${esc(h.rule)}</span></div>`).join('');

    const op = $('#teamOpen');
    if (op) op.innerHTML = TEAM.open.map((x, i) => typeof x === 'string'
      ? `<li><p class="op__q">${esc(x)}</p></li>`
      : `<li><p class="op__q"><b>${i + 1}</b>${esc(x.q)}</p>
           <p class="op__w">${esc(x.why)}</p>
           <p class="op__n">${esc(x.need)}</p></li>`).join('');

    // схема и таблица стыков — одно и то же с двух сторон: подсвечиваем вместе
    if (f2 && ho) f2.querySelectorAll('.pp__j').forEach((j) => {
      const row = ho.querySelector(`[data-ho="${j.dataset.ho}"]`);
      if (!row) return;
      const on = (v) => { row.classList.toggle('is-hi', v); j.classList.toggle('is-hi', v); };
      j.addEventListener('mouseenter', () => on(true));
      j.addEventListener('mouseleave', () => on(false));
      j.addEventListener('focus', () => on(true));
      j.addEventListener('blur', () => on(false));
      j.addEventListener('click', () => row.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    });
  }

  /* Разделы «Команды». Раньше всё лежало одним потоком выше четырёх тысяч
     пикселей, и вопросы, требующие решения, оказывались в самом низу —
     то есть самое рабочее содержимое читалось последним. */
  // у вкладки своё короткое имя: заголовок раздела в неё не помещается.
  // Сводка стоит перед блокерами: вопросы, требующие решения, и места,
  // где рвётся поток, — это одна проблемная зона, читать их надо подряд.
  const TPANES = [
    ['people', 'tab.people'], ['gaps', 'tab.gaps'], ['dec', 'tab.dec'],
    ['sum', 'tab.sum'], ['ho', 'tab.ho']
  ];
  function setPane(k) {
    state.tpane = k;
    document.querySelectorAll('.tpane').forEach((p) => { p.hidden = p.dataset.pane !== k; });
    document.querySelectorAll('[data-tpane]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.tpane === k)));
    if (k === 'people' || k === 'ho') renderTeam();
  }
  function renderTeamNav() {
    const nav = $('#teamNav'); if (!nav) return;
    const n = { gaps: (TEAM.gaps || []).length, ho: (TEAM.handoffs || []).length,
                sum: (TEAM.open || []).length, people: (TEAM.people || []).length,
                dec: (TEAM.decisions || []).length };
    nav.innerHTML = TPANES.map(([k, key]) =>
      `<button class="tnav__b" type="button" data-tpane="${k}"
        aria-pressed="${state.tpane === k}">${esc(t(key))}<sup>${n[k]}</sup></button>`).join('');
    nav.querySelectorAll('[data-tpane]').forEach((b) =>
      b.addEventListener('click', () => setPane(b.dataset.tpane)));
  }

  (function teamControls() {
    document.addEventListener('click', (e) => {
      const v = e.target.closest('[data-tview]');
      if (v) { state.tview = v.dataset.tview; renderTeam(); return; }

      const all = e.target.closest('#teamToggleAll');
      if (all) {
        const rows = document.querySelectorAll('#team .team__row[data-person]');
        const open = all.dataset.open !== 'true';
        rows.forEach((r) => { if ((r.getAttribute('aria-expanded') === 'true') !== open) r.click(); });
        all.dataset.open = String(open);
        all.textContent = t(open ? 'team.collapseAll' : 'team.expandAll');
        return;
      }

      const only = e.target.closest('#teamOnlyOpen');
      if (only) {
        const on = only.getAttribute('aria-pressed') !== 'true';
        only.setAttribute('aria-pressed', String(on));
        document.querySelectorAll('#team .team__row[data-person]').forEach((r) => {
          const hide = on && r.dataset.state === 'fixed';
          r.hidden = hide;
          const panel = document.getElementById('tp-' + r.dataset.person);
          if (panel && hide) { panel.dataset.open = 'false'; r.setAttribute('aria-expanded', 'false'); }
          if (panel) panel.hidden = hide;
        });
      }
    });
    // схема доступна с клавиатуры: узел — это кнопка
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const nd = e.target.closest && e.target.closest('.rz__n[data-person]');
      if (nd) { e.preventDefault(); gotoPerson(nd.dataset.person); }
    });
  })();

  /* Свёрнутая панель схлопнута через grid-template-rows:0fr, но её содержимое
     остаётся в дереве доступности: скринридер читает все группы фильтров, а Tab
     уходит в невидимые чекбоксы. overflow:hidden от этого не спасает — нужен
     inert. Тот же механизм используют карточки людей, поэтому правим оба. */
  function syncInert() {
    document.querySelectorAll('.fpanel').forEach((p) => {
      const open = p.dataset.open === 'true';
      const clip = p.querySelector('.fpanel__clip');
      if (clip) clip.inert = !open;
    });
  }
  Iron.syncInert = syncInert;
  new MutationObserver(syncInert).observe(document.body,
    { subtree: true, attributes: true, attributeFilter: ['data-open'] });

  /* ══ ДОКУМЕНТЫ ПО ОБЪЕКТУ ═══════════════════════════════════════════════
     Стадийная модель из чеклиста ПЛ. Раньше портал знал про «стадию» только
     то, что её нет; теперь стадия — это позиция в понятной лестнице, а
     готовность — закрытые блокирующие документы, а не ощущение.
     177 позиций рендерятся по требованию: разворачиваем стадию — строим её.
     ══════════════════════════════════════════════════════════════════════ */
  const DOCS = window.IronDocs || { stages: [], items: [] };
  const DSTAT = window.IronDocStatus || {};
  /* статус позиции по выбранному объекту; без выбора — общий вид справочника */
  const statOf = (docId) => {
    const o = state.docsObj; if (!o || !DSTAT[o]) return null;
    return DSTAT[o][docId] || null;
  };
  const closedIn = (stageN) => {
    if (!state.docsObj) return null;
    const list = docsOfStage(stageN).filter((d) => d.blocking === 'yes');
    const done = list.filter((d) => { const st = statOf(d.id); return st && (st.s === 'received' || st.s === 'verified'); });
    return { done: done.length, total: list.length };
  };
  const docsOfStage = (n) => DOCS.items.filter((d) => String(d.stage) === String(n));

  function renderDocs() {
    const box = $('#stages'); if (!box) return;

    const key = $('#docsKey');
    if (key) {
      const total = DOCS.items.length;
      const blk = DOCS.items.filter((d) => d.blocking === 'yes').length;
      const cnd = DOCS.items.filter((d) => d.blocking === 'cond').length;
      key.innerHTML = `<div class="cov__legend">
        <span class="cov__lg">${esc(t('docs.total'))} <b>${total}</b></span>
        <span class="cov__lg"><i class="cov__sw cov__sw--fixed" aria-hidden="true"></i>
          ${esc(t('docs.blocking'))} <b>${blk}</b></span>
        <span class="cov__lg"><i class="cov__sw cov__sw--tentative" aria-hidden="true"></i>
          ${esc(t('docs.cond'))} <b>${cnd}</b></span>
        <span class="cov__lg">${esc(t('docs.stages'))} <b>${DOCS.stages.length}</b></span>
      </div>`;
    }

    box.innerHTML = DOCS.stages.map((st) => {
      const list = docsOfStage(st.n);
      const blk = list.filter((d) => d.blocking === 'yes').length;
      const cnd = list.filter((d) => d.blocking === 'cond').length;
      const label = st.n === 'S' ? t('docs.cross') : t('docs.stage') + ' ' + st.n;
      return `<div class="stg">
        <button class="stg__b" type="button" aria-expanded="false" data-stage="${esc(String(st.n))}"
            aria-controls="sg-${esc(String(st.n))}">
          <span class="stg__n">${esc(label)}</span>
          <span class="stg__t">${esc(st.title)}
            ${st.goal ? `<em>${esc(st.goal)}</em>` : ''}</span>
          <span class="stg__m">
            <b>${list.length}</b> ${esc(t('docs.docsN'))}
            ${st.hasBlockFlag
              ? `<i>${blk} ${esc(t('docs.blockShort'))}${cnd ? ' · ' + cnd + ' ' + esc(t('docs.condShort')) : ''}</i>`
              : `<i class="tbd">${esc(t('docs.noFlag'))}</i>`}
            ${(function () { const c = closedIn(st.n);
              return c && c.total ? `<i class="stg__done${c.done === c.total ? ' is-full' : ''}">${
                esc(t('docs.closed'))} ${c.done}/${c.total}</i>` : ''; })()}
          </span>
          <span class="team__chev" aria-hidden="true"></span>
        </button>
        <div class="fpanel" data-open="false" id="sg-${esc(String(st.n))}">
          <div class="fpanel__clip"><div class="fpanel__in stg__in"
            data-fill="${esc(String(st.n))}"></div></div>
        </div>
      </div>`;
    }).join('');

    const sel = $('#docsObj');
    if (sel && !sel.dataset.ready) {
      sel.innerHTML = `<option value="">${esc(t('docs.allObjects'))}</option>`
        + Iron.list().map((o) => `<option value="${esc(o.id)}"${
          Object.keys(DSTAT[o.id] || {}).length ? '' : ' data-empty="1"'
        }>${esc(nameOf(o))}${Object.keys(DSTAT[o.id] || {}).length ? '' : ' — ' + t('docs.nothing')}</option>`).join('');
      sel.value = state.docsObj || '';
      sel.addEventListener('change', () => { state.docsObj = sel.value || null; renderDocs(); });
      sel.dataset.ready = '1';
    }

    box.querySelectorAll('[data-stage]').forEach((b) => b.addEventListener('click', () => {
      const panel = document.getElementById('sg-' + b.dataset.stage);
      const open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(open));
      if (!panel) return;
      const host = panel.querySelector('[data-fill]');
      if (open && !host.dataset.done) { host.innerHTML = stageTable(b.dataset.stage); host.dataset.done = '1'; }
      panel.dataset.open = String(open);
      syncInert();
    }));
  }

  function stageTable(n) {
    const list = docsOfStage(n);
    let lastGroup = null;
    const head = `<div class="dl__row dl__row--head">
      <span>${esc(t('docs.thId'))}</span><span>${esc(t('docs.thDoc'))}</span>
      <span>${esc(t('docs.thIssuer'))}</span><span>${esc(t('docs.thBlock'))}</span></div>`;
    return head + list.map((d) => {
      const g = d.group && d.group !== lastGroup
        ? `<div class="dl__grp">${esc(d.group)}</div>` : '';
      lastGroup = d.group || lastGroup;
      const mark = d.blocking === 'yes'
        ? `<i class="team__st2 team__st2--fixed" aria-hidden="true"></i>${esc(t('docs.blockShort'))}`
        : (d.blocking === 'cond'
          ? `<i class="team__st2 team__st2--tentative" aria-hidden="true"></i>${esc(d.cond || t('docs.condShort'))}`
          : `<span class="tbd">${dash}</span>`);
      const st = statOf(d.id);
      return g + `<div class="dl__row${st ? ' has-st' : ''}">
        <span class="dl__id">${esc(d.id)}</span>
        <span class="dl__d">${esc(d.ru)}${d.gr ? `<em lang="el">${esc(d.gr)}</em>` : ''}
          ${st && st.note ? `<u>${esc(st.note)}</u>` : ''}</span>
        <span class="dl__i" title="${esc(d.issuer || d.period || dash)}">${esc(d.issuer || d.period || dash)}</span>
        <span class="dl__b">${st
          ? `<span class="dst dst--${esc(st.s)}">${esc(t('dst.' + st.s))}${st.at ? ` <em>${esc(fmtShort(st.at))}</em>` : ''}</span>`
          : mark}</span></div>`;
    }).join('');
  }

  function renderAll() {
    renderSummary(); renderPlaces(); renderFilters(); renderColl();
    renderTeamNav(); renderTeam(); renderDocs();
    syncInert();
    if (state.selected) { const o = Iron.get(state.selected); if (o) renderDossier(o); }
  }
  document.addEventListener('iron:lang', renderAll);
  document.addEventListener('iron:changed', renderAll);

  window.I18N.init();      // browser language decides, unless the visitor chose before
  window.I18N.apply();
  syncLangButtons();
  renderAll();
})();
