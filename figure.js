/* ============================================================================
   IRON INVEST — FIG. 01 : the plate.
   Rebuilt as a STIPPLED HYPSOMETRIC FIELD rather than a survey drawing.

   Governing idea: terrain speaks through continuous TONE, not discrete symbols.
   One signal — real SRTM elevation — drives both the density of the stipple and
   the weight of the contours, so the eye reads *land*, not *instruments*.
   Numbers, spot heights and the settlement crowd are gone; the only enumerated
   facts left on the plate are the six property locations.

   Data (all real, see geo.js): OSM coastline · SRTM elevation grid · SRTM
   contours in six unlabelled bands · OSM settlements (three survive).
   ============================================================================ */
(function () {
  const Iron = window.Iron, GEO = window.IronGeo;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const host = document.getElementById('plate');
  if (!host || !GEO) return;

  const W = 1600, H = 640, PAD = 36;

  /* The frame is derived from the properties themselves, not hard-coded: it
     hugs whatever the collection contains, with air around it, and re-fits the
     moment a coordinate is corrected. The box is then stretched to the plate's
     own proportions so the drawing fills it instead of floating in dead space. */
  function frameFor(list) {
    const lngs = list.map((o) => o.location.coords[1]);
    const lats = list.map((o) => o.location.coords[0]);
    let a = Math.min.apply(null, lngs), b = Math.max.apply(null, lngs);
    let c = Math.min.apply(null, lats), d = Math.max.apply(null, lats);
    const padX = Math.max((b - a) * 0.34, 0.018);   // never tighter than ~1.5 km
    const padY = Math.max((d - c) * 0.34, 0.014);
    a -= padX; b += padX; c -= padY; d += padY;
    const k = Math.cos(((c + d) / 2) * Math.PI / 180);
    const want = (W - 2 * PAD) / (H - 2 * PAD);
    const wx = (b - a) * k, wy = (d - c);
    if (wx / wy < want) { const g = (wy * want - wx) / k / 2; a -= g; b += g; }
    else { const g = (wx / want - wy) / 2; c -= g; d += g; }
    return [a, c, b, d];
  }
  /* Pinned to the working area: the Plaka / Almyrida / Kokkino Chorio coast.
     Set FRAME to null to go back to auto-fitting every object. */
  const FRAME = [24.182, 35.4365, 24.238, 35.4665];
  const BBOX = FRAME || frameFor((window.IronData && window.IronData.OBJECTS) || []);
  const MAXM = 1880;

  /* deterministic randomness — the stipple is identical on every render */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function projector(bbox, w, h, pad) {
    const [aLng, aLat, bLng, bLat] = bbox;
    const k = Math.cos(((aLat + bLat) / 2) * Math.PI / 180);
    const x0 = aLng * k, x1 = bLng * k;
    const s = Math.min((w - 2 * pad) / (x1 - x0), (h - 2 * pad) / (bLat - aLat));
    const ox = pad + ((w - 2 * pad) - (x1 - x0) * s) / 2;
    const oy = pad + ((h - 2 * pad) - (bLat - aLat) * s) / 2;
    const fwd = (lng, lat) => [ox + (lng * k - x0) * s, oy + (bLat - lat) * s];
    fwd.inv = (x, y) => [((x - ox) / s + x0) / k, bLat - (y - oy) / s];
    return fwd;
  }
  const P = projector(BBOX, W, H, PAD);
  const inFrame = (lng, lat) => lng > BBOX[0] - 0.02 && lng < BBOX[2] + 0.02 && lat > BBOX[1] - 0.02 && lat < BBOX[3] + 0.02;

  /* bilinear elevation lookup, normalised 0..1 */
  const DEM = GEO.dem;
  function elev(lng, lat) {
    if (!DEM) return 0;
    const b = DEM.bbox, l0 = b[0], a0 = b[1], l1 = b[2], a1 = b[3];
    const fx = (lng - l0) / (l1 - l0) * (DEM.nx - 1);
    const fy = (a1 - lat) / (a1 - a0) * (DEM.ny - 1);
    if (fx < 0 || fy < 0 || fx > DEM.nx - 1 || fy > DEM.ny - 1) return 0;
    const i = Math.floor(fx), j = Math.floor(fy);
    const i2 = Math.min(i + 1, DEM.nx - 1), j2 = Math.min(j + 1, DEM.ny - 1);
    const tx = fx - i, ty = fy - j;
    const g = (a, bb) => DEM.z[bb * DEM.nx + a] * DEM.unit;
    const v = g(i, j) * (1 - tx) * (1 - ty) + g(i2, j) * tx * (1 - ty)
            + g(i, j2) * (1 - tx) * ty + g(i2, j2) * tx * ty;
    return Math.max(0, v) / MAXM;
  }

  const line = (pts) => pts.map((p, i) => {
    const q = P(p[0], p[1]);
    return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
  }).join('');

  /* contours are smoothed so the stroke reads drawn, not exported */
  function smooth(pts) {
    const q = pts.map((p) => { const r = P(p[0], p[1]); return { x: r[0], y: r[1] }; });
    if (q.length < 3) return q.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join('');
    let d = 'M' + q[0].x.toFixed(1) + ' ' + q[0].y.toFixed(1);
    for (let i = 0; i < q.length - 1; i++) {
      const p0 = q[i - 1] || q[i], p1 = q[i], p2 = q[i + 1], p3 = q[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1)
         + ' ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
    }
    return d;
  }

  /* ── objects grouped by place ───────────────────────────────────────────── */
  function groups() {
    const by = {};
    Iron.list().forEach((o, i) => {
      const key = o.location.areaEn || o.location.area;
      if (!by[key]) by[key] = { key: key, items: [], flagship: false };
      by[key].items.push({ o: o, i: i });
      by[key].flagship = by[key].flagship || !!o._flagship;
    });
    return Object.keys(by).map((k) => {
      const g = by[k];
      g.lng = g.items.reduce((s, x) => s + x.o.location.coords[1], 0) / g.items.length;
      g.lat = g.items.reduce((s, x) => s + x.o.location.coords[0], 0) / g.items.length;
      g.label = Iron.areaOf(g.items[0].o).split(',')[0].trim();
      return g;
    });
  }

  const MIN_GAP = 70, LB_CH = 18 * 1.17, GAP = 18;
  function layout(gs) {
    gs.forEach((g) => {
      const q = P(g.lng, g.lat);
      g.x = q[0]; g.y = q[1]; g.side = q[0] < W / 2 ? 'left' : 'right';
    });
    ['left', 'right'].forEach((side) => {
      const list = gs.filter((g) => g.side === side).sort((a, b) => a.y - b.y);
      let prev = -Infinity;
      list.forEach((g) => { g.ly = Math.max(g.y, prev + MIN_GAP); prev = g.ly; });
      const over = (list.length ? list[list.length - 1].ly : 0) - (H - PAD - 20);
      if (over > 0) list.forEach((g) => { g.ly -= over; });
      let need = 0; list.forEach((g) => { need = Math.max(need, g.label.length * LB_CH); });
      need = Math.ceil(need) + GAP;
      const rail = side === 'left' ? Math.max(PAD + need, 170) : Math.min(W - PAD - need, W - 170);
      list.forEach((g) => { g.lx = rail; });
    });
    return gs;
  }


  function render() {
    const t = (k) => window.I18N.t(k);
    const all = groups();
    const gs = all.filter((g) => inFrame(g.lng, g.lat));
    window.IronPlateOutside = all.filter((g) => !inFrame(g.lng, g.lat)).map((g) => g.label);

    /* Stipple: ONE continuous field across sea and land, density from real
       elevation. Painted above the land so the texture reads through it —
       the land is not an opaque lid over the drawing. */
    const rand = mulberry32(20260823);
    const CELL = 27;
    let dots = '';
    for (let gy = PAD * 0.4; gy < H - PAD * 0.4; gy += CELL) {
      for (let gx = PAD * 0.4; gx < W - PAD * 0.4; gx += CELL) {
        const ll = P.inv(gx, gy);
        const e = elev(ll[0], ll[1]);
        const gm = Math.pow(e, 0.6);
        if (rand() > 0.13 + 0.62 * gm) continue;
        const jx = gx + (rand() - 0.5) * CELL * 0.9;
        const jy = gy + (rand() - 0.5) * CELL * 0.9;
        const r = 1.15 + 2.3 * gm + rand() * 0.5;
        const o = (e < 0.02 ? 0.09 : 0.15) + 0.3 * gm;
        dots += '<circle cx="' + jx.toFixed(1) + '" cy="' + jy.toFixed(1) + '" r="' + r.toFixed(2) + '" fill-opacity="' + o.toFixed(3) + '"/>';
      }
    }

    /* Contours: six bands, unlabelled, clipped to land, opacity climbing with
       altitude. Weight stays hairline — tone carries hierarchy, not width. */
    const bands = (GEO.contours || []);
    let cont = '';
    bands.forEach((c, bi) => {
      const f = bands.length > 1 ? bi / (bands.length - 1) : 0;
      const op = (0.16 + 0.34 * f).toFixed(3);
      const wd = (0.55 + 0.45 * f).toFixed(2);
      c.lines.forEach((ln) => {
        if (!ln.some((p) => inFrame(p[0], p[1]))) return;
        cont += '<path d="' + smooth(ln) + '" stroke-opacity="' + op + '" stroke-width="' + wd + '"/>';
      });
    });

    /* Greenery, built-up areas and main roads — all real OSM geometry, drawn
       as quiet tone so they describe the place without competing with the
       property marks. Everything is clipped to land. */
    const poly = (r) => line(r) + 'Z';
    const green = (GEO.green || []).filter((r) => r.some((q) => inFrame(q[0], q[1])))
      .map((r) => '<path d="' + poly(r) + '"/>').join('');
    const built = (GEO.built || []).filter((r) => r.some((q) => inFrame(q[0], q[1])))
      .map((r) => '<path d="' + poly(r) + '"/>').join('');
    const roads = (GEO.roads || []).filter((w) => w.p.some((q) => inFrame(q[0], q[1])))
      .map((w) => '<path class="' + (w.m ? 'rd rd--maj' : 'rd') + '" d="' + smooth(w.p) + '"/>').join('');

    /* Settlement names are gone by request; this holds only the terrain name. */
    let anchors = '';

    /* property nodes — the only saturated marks on the plate */
    let nodes = '';
    layout(gs).forEach((g) => {
      const n = g.items.length, x = g.x, y = g.y;
      const dir = g.side === 'left' ? -1 : 1;
      const anchor = g.side === 'left' ? 'end' : 'start';
      const tx = g.lx + dir * 12;
      const r = g.flagship ? 6.5 : 5;
      const kx = x + dir * (r + 8);
      const lead = 'M' + kx.toFixed(1) + ' ' + y.toFixed(1)
        + ' L' + (g.lx - dir * 22).toFixed(1) + ' ' + g.ly.toFixed(1)
        + ' L' + g.lx.toFixed(1) + ' ' + g.ly.toFixed(1);
      const sub = n > 1 ? (n + ' ' + t('plate.props')) : t(g.items[0].o.kindKey || '');
      nodes += '<g class="pl-node' + (g.flagship ? ' is-key' : '') + '" data-key="' + esc(g.key) + '" tabindex="0" role="button"'
        + ' aria-label="' + esc(g.label) + '">'
        + '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="24" class="pl-hit"/>'
        + '<path d="' + lead + '" class="pl-lead"/>'
        + '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (r + 6).toFixed(1) + '" class="pl-halo"/>'
        + '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '" class="pl-sym"/>'
        + '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (r + 9).toFixed(1) + '" class="pl-ring"/>'
        + '<text x="' + tx.toFixed(1) + '" y="' + (g.ly - 3).toFixed(1) + '" text-anchor="' + anchor + '" class="pl-lb">' + esc(g.label.toUpperCase()) + '</text>'
        + '<text x="' + tx.toFixed(1) + '" y="' + (g.ly + 18).toFixed(1) + '" text-anchor="' + anchor + '" class="pl-sb">' + esc(String(sub)) + '</text>'
        + '</g>';
    });

    // A proper closed land polygon: the island ring clipped to the frame.
    // (Closing a cropped coastline arc had painted the southern half as sea.)
    const ring = (GEO.land && GEO.land.length) ? GEO.land : GEO.west;
    const landPath = line(ring) + 'Z';

    host.innerHTML =
      '<div class="plate__top">'
        + '<span class="plate__fig">FIG. 01</span>'
        + '<span class="plate__dash" aria-hidden="true"></span>'
        + '<span class="plate__ttl">' + esc(t('plate.title')) + '</span>'
      + '</div>'
      + '<div class="plate__stage">'
        + '<svg class="plate__svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('plate.alt')) + '">'
          + '<defs><clipPath id="landClip"><path d="' + landPath + '"/></clipPath></defs>'
          + '<rect x="0" y="0" width="' + W + '" height="' + H + '" class="pl-sea"/>'
          + '<path d="' + landPath + '" class="pl-land"/>'
          + '<g class="pl-green" clip-path="url(#landClip)">' + green + '</g>'
          + '<g class="pl-built" clip-path="url(#landClip)">' + built + '</g>'
          + '<g class="pl-conts" clip-path="url(#landClip)">' + cont + '</g>'
          + '<g class="pl-roads" clip-path="url(#landClip)">' + roads + '</g>'
          + '<g class="pl-dots" clip-path="url(#landClip)">' + dots + '</g>'
          + '<path d="' + landPath + '" class="pl-coast"/>'
          + '<g class="pl-anchors">' + anchors + '</g>'
          + '<g class="pl-nodes">' + nodes + '</g>'
        + '</svg>'
      + '</div>'
      + '<p class="plate__cap">' + esc(t('plate.cap')) + '</p>';

    host.querySelectorAll('.pl-node').forEach((el) => {
      const act = () => {
        const g = gs.filter((x) => x.key === el.dataset.key)[0];
        if (!g) return;
        if (g.items.length === 1) return Iron.openObject(g.items[0].o.id);
        Iron.focusArea(g.key);
      };
      el.addEventListener('click', act);
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    });

    drawIn();
  }

  /* one restrained gesture: the contours draw themselves once, low ground first */
  function drawIn() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paths = host.querySelectorAll('.pl-conts path');
    if (reduce || !paths.length || !('IntersectionObserver' in window)) return;
    const ok = [];
    paths.forEach((p) => {
      let len = 0; try { len = p.getTotalLength(); } catch (e) { return; }
      if (!len || len > 14000) return;
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len; ok.push(p);
    });
    if (!ok.length) return;
    const reveal = () => ok.forEach((p, i) => {
      p.style.transition = 'stroke-dashoffset 2.1s cubic-bezier(.22,1,.36,1)';
      p.style.transitionDelay = (i * 40) + 'ms';
      p.style.strokeDashoffset = '0';
    });
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => { if (en.isIntersecting) { reveal(); io.disconnect(); } });
    }, { threshold: 0.2 });
    io.observe(host);
    setTimeout(reveal, 3500); // safety net — never leave the relief unfinished
  }

  function highlight(areaKey) {
    const el = host.querySelector('.pl-node[data-key="' + (window.CSS && CSS.escape ? CSS.escape(areaKey) : areaKey) + '"]');
    if (!el) return;
    el.classList.remove('is-hit'); void el.offsetWidth; el.classList.add('is-hit');
  }

  window.IronPlate = { render: render, highlight: highlight };
  document.addEventListener('iron:lang', render);
  document.addEventListener('iron:changed', render);
  render();
})();
