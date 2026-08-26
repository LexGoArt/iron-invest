/* ============================================================================
   IRON INVEST — object registry (real portfolio, draft figures).
   ONE array = the single source of truth. Swap/extend this array as Alex sends
   final details; nothing else in the app needs to change.

   ── PUBLIC FACE ONLY ──────────────────────────────────────────────────────
   This file ships to a STATIC site: anything written here is readable by anyone
   who opens the page source. Therefore it must never contain:
     · negotiation tactics, seller psychology, leverage or target close dates
       (those live only in Alex's private notes, never in this file)
     · holding entities / tax structuring / inter-company schemes
     · deposits paid, our margins, internal valuations
   Those live in Alex's internal notes, NOT here. (HANDOFF §9)

   Figures are PLACEHOLDERS (null) until confirmed — we do not invent numbers.
   Coordinates are approximate (_coordDraft:true) so the map renders; replace
   with surveyed points later.

   op (operation type) → map node colour + status:
     'sale' · 'rent' · 'business' (turnkey/income) · 'prep' (in preparation)
   ============================================================================ */
(function () {
  const T = (o) => Object.assign({
    id: '', name: '', nameEn: '', nameRu: '',
    op: 'prep',
    kindKey: '',                    // typology label (dom / willa / działka / hotel…)
    location: { area: '', areaEn: '', areaRu: '', coords: [35.44, 24.10], seaView: false, _coordDraft: true },
    owner: null,
    area_m2: null,               // built / floor area
    land_m2: null,               // plot area
    floors: null,
    stars: null,
    units: null,
    rooms: null,
    facilities: [],
    nearby: null,
    communications: [],
    price: { purchase: null, upgrade: null, sale: null, rentMonthly: null, currency: 'EUR' },
    estimate: null,
    condition: null,             // 'ready' | 'renovation' | 'shell' | 'land'
    legal: { status: null, encumbrances: null, docsReady: null },
    greece: {
      residencyEligible: null,
      residencyThreshold: 250000,
      ota: { listed: null, incomeMonthly: null }
    },
    market: null,
    /* ── working fields (internal portal) ──────────────────────────────────
       Deliberately empty. This deployment is a PUBLIC GitHub Pages site, so
       anything written here is readable by anyone. Fill these only once the
       portal sits behind authentication. */
    stage: null,            // 'watch'|'talks'|'docs'|'ready'|'deal'|'closed'
    nextStep: null,         // what has to happen next
    deadline: null,         // ISO date
    blocker: null,          // what is holding it up
    docs: { have: null, total: null },
    updated: null,          // ISO date of the last change
    responsible: { name: null, date: null },
    media: { cover: null, photos: [], plan: null },
    strategy: { sale: null, rent: null, business: null },
    tags: [],
    _draft: true
  }, o);

  window.IronData = {
    /* дата последнего изменения реестра — показывается на первом экране,
       чтобы «обновлено» было фактом, а не ощущением */
    registryUpdated: '2026-08-25',

    region: { name: 'Chania · Apokoronas', center: [35.44, 24.10], zoom: 11 },

    OBJECTS: [
      /* ── PLAKA cluster (Apokoronas) ─────────────────────────────────────── */
      /* Данные из инвест-разбора KH371 от 04.08.2026 и топоплана ЕГСА87.
         Здесь только то, что и так опубликовано агентом в листинге.
         Наша аналитика по этому объекту остаётся во внутренних файлах:
         формат публичный, значит всё написанное здесь читается кем угодно. */
      T({
        id: 'plaka-1',
        name: 'Plaka 1', nameEn: 'Plaka 1',
        op: 'prep',
        kindKey: 'k.house2',
        // снято с топоплана в ЕГСА87 и пересчитано в WGS84; точность ~20 м
        location: { area: 'Plaka, Apokoronas', areaEn: 'Plaka, Apokoronas', areaRu: 'Плака, Апокоронас', coords: [35.4498, 24.2091], seaView: true, _coordDraft: true },
        floors: 2,
        area_m2: 119,          // две готовые квартиры: 73 + 46
        land_m2: 1000,
        condition: 'renovation',
        price: { purchase: 580000, upgrade: null, sale: null, rentMonthly: null, currency: 'EUR' },
        facilities: ['am.garden', 'am.parking', 'am.veranda', 'am.solar', 'am.ac', 'am.kitchen', 'am.wardrobe', 'am.shutters', 'am.mosquito'],
        communications: ['c.power', 'c.water', 'c.solar'],
        legal: { status: 'l.vertical', encumbrances: null, docsReady: false },
        greece: { residencyEligible: false, residencyThreshold: 800000, ota: { listed: null, incomeMonthly: null } },
        stage: 0,
        tags: ['t.twofloors', 't.inprep', 't.rented', 't.unfinished'],
        marketKey: 'm.plscan',
        _energy: 'D',
        media: {
          cover: 'photos/plaka-1/10.jpg',
          photos: ['photos/plaka-1/01.jpg','photos/plaka-1/02.jpg','photos/plaka-1/03.jpg',
                   'photos/plaka-1/04.jpg','photos/plaka-1/05.jpg','photos/plaka-1/06.jpg',
                   'photos/plaka-1/07.jpg','photos/plaka-1/08.jpg','photos/plaka-1/09.jpg',
                   'photos/plaka-1/10.jpg','photos/plaka-1/plan-topo.jpg','photos/plaka-1/plan-floor.jpg'],
          plan: 'photos/plaka-1/plan-floor.jpg'
        },
        _parts: [
          { key: 'p.flat1', m2: 73, note: 'st.rented' },
          { key: 'p.flat2', m2: 46, note: 'st.rented' },
          { key: 'p.store', m2: 50, note: null },
          { key: 'p.unfinished', m2: 158, note: 'st.shellbox' }
        ]
      }),
      /* По топоплану и поэтажным планам (цоколь + 1 этаж): двухуровневый дом
         с балконами и наружной лестницей. Площади в документах не проставлены. */
      T({
        id: 'plaka-2',
        name: 'Plaka 2', nameEn: 'Plaka 2',
        op: 'prep',
        kindKey: 'k.renov',
        location: { area: 'Plaka, Apokoronas', areaEn: 'Plaka, Apokoronas', areaRu: 'Плака, Апокоронас', coords: [35.4516, 24.2124], seaView: false, _coordDraft: true },
        floors: 2,
        condition: 'shell',
        stage: 0,
        media: {
          cover: 'photos/plaka-2/01.jpg',
          photos: ['photos/plaka-2/01.jpg','photos/plaka-2/02.jpg','photos/plaka-2/03.jpg',
                   'photos/plaka-2/04.jpg','photos/plaka-2/05.jpg','photos/plaka-2/06.jpg',
                   'photos/plaka-2/07.jpg','photos/plaka-2/plan-topo.jpg',
                   'photos/plaka-2/plan-base.jpg','photos/plaka-2/plan-floor1.jpg'],
          plan: 'photos/plaka-2/plan-floor1.jpg'
        },
        tags: ['t.fullrenov', 't.potential']
        // shown publicly as a shell-condition property awaiting full renovation
      }),
      T({
        id: 'plaka-3-taverna',
        name: 'Plaka 3', nameEn: 'Plaka 3', nameRu: 'Plaka 3',
        op: 'business',
        kindKey: 'k.taverna',
        location: { area: 'Plaka, Apokoronas', areaEn: 'Plaka, Apokoronas', areaRu: 'Плака, Апокоронас', coords: [35.4498, 24.2126], seaView: false, _coordDraft: true },
        condition: 'ready',
        tags: ['t.horeca', 't.turnkey']
      }),
      T({
        id: 'plaka-4',
        name: 'Plaka 4', nameEn: 'Plaka 4',
        op: 'sale',
        kindKey: 'k.smallhouse',
        location: { area: 'Plaka, Apokoronas', areaEn: 'Plaka, Apokoronas', areaRu: 'Плака, Апокоронас', coords: [35.4519, 24.2088], seaView: false, _coordDraft: true },
        condition: 'ready',
        tags: ['t.compact']
      }),

      /* ── CHANIA (town) ───────────────────────────────────────────────────── */
      T({
        id: 'chania-1-apartment',
        name: 'Chania 1', nameEn: 'Chania 1', nameRu: 'Ханья 1',
        op: 'sale',
        kindKey: 'k.apartment',
        location: { area: 'Apokoronas', areaEn: 'Apokoronas', areaRu: 'Апокоронас', coords: [35.4548, 24.2062], seaView: false, _coordDraft: true },
        condition: 'ready',
        tags: ['t.town']
      }),
      T({
        id: 'chania-2-shop',
        name: 'Chania 2', nameEn: 'Chania 2', nameRu: 'Ханья 2',
        op: 'rent',
        kindKey: 'k.shop',
        location: { area: 'Apokoronas', areaEn: 'Apokoronas', areaRu: 'Апокоронас', coords: [35.4543, 24.2074], seaView: false, _coordDraft: true },
        condition: 'ready',
        tags: ['t.commercial', 't.rent']
      }),
      T({
        id: 'chania-suburb-house',
        name: 'Chania — podmiejski', nameEn: 'Chania — suburban', nameRu: 'Ханья — пригород',
        op: 'sale',
        kindKey: 'k.house',
        location: { area: 'Apokoronas', areaEn: 'Apokoronas', areaRu: 'Апокоронас', coords: [35.4553, 24.2050], seaView: false, _coordDraft: true },
        area_m2: 200,
        land_m2: 300,
        condition: 'ready',
        tags: ['t.200m', 't.plot300']
        // price shown as "on request" — the owner's expectations are not published
      }),

      /* ── EUDORA ──────────────────────────────────────────────────────────── */
      T({
        id: 'eudora-1-villa',
        // marketed as "Eudora Luxury Stone Villa"; address per the listing is the
        // Almirou–Xirosterni road in Almyrida — NOT Kokkino Chorio as first assumed
        name: 'Eudora 1', nameEn: 'Eudora 1', nameRu: 'Eudora 1',
        op: 'sale',
        kindKey: 'k.villa',
        location: { area: 'Almyrida, Apokoronas', areaEn: 'Almyrida, Apokoronas', areaRu: 'Альмирида, Апокоронас',
          coords: [35.4498, 24.2005],
          // the listing names garden / pool / mountain / courtyard views — no sea view
          seaView: false, _coordDraft: true },
        area_m2: 256,
        floors: 2,
        rooms: { bed: 5, bath: 1, sleeps: 11 },
        condition: 'ready',
        facilities: ['fa.poolPriv', 'fa.terrace', 'fa.kitchen', 'fa.fireplace', 'fa.bbq',
                     'fa.parking', 'fa.wifi', 'fa.ac', 'fa.carhire'],
        nearby: { beachM: 100, airportKm: 32 },
        media: {
          cover: 'photos/eudora-1-villa-01.jpg',
          photos: ['photos/eudora-1-villa-01.jpg', 'photos/eudora-1-villa-02.jpg', 'photos/eudora-1-villa-03.jpg'],
          plan: null
        },
        tags: ['t.villa', 't.stone']
      }),
      T({
        // sits immediately beside Eudora 1 (per Alex), in Almyrida
        id: 'eudora-2-plot',
        name: 'Eudora 2', nameEn: 'Eudora 2', nameRu: 'Eudora 2',
        op: 'sale',
        kindKey: 'k.plot',
        location: { area: 'Almyrida, Apokoronas', areaEn: 'Almyrida, Apokoronas', areaRu: 'Альмирида, Апокоронас',
          coords: [35.4501, 24.2011],
          // the villa next door is not advertised with a sea view, so the earlier
          // sea-view flag here was my assumption — dropped until confirmed
          seaView: false, _coordDraft: true },
        condition: 'land',
        tags: ['t.plot', 't.buildable', 't.nextto']
      }),

      /* ── ALMYRIDA (partnerski) ───────────────────────────────────────────── */
      T({
        id: 'almyrida-1',
        name: 'Almyrida 1', nameEn: 'Almyrida 1',
        op: 'prep',
        kindKey: 'k.partnerplot',
        location: { area: 'Almyrida, Apokoronas', areaEn: 'Almyrida, Apokoronas', areaRu: 'Альмирида, Апокоронас', coords: [35.4492, 24.2009], seaView: false, _coordDraft: true },
        land_m2: 800,
        condition: 'land',
        tags: ['t.partner', 't.build800']
        // commercial terms are internal and are not published
      }),

      /* ── AMOR RELAX HOTEL (flagship) ─────────────────────────────────────── */
      T({
        id: 'amor-relax',
        // official listing spelling is "Amour"; address per the hotel's own
        // listing is Almyrida, Apokoronas (the Georgioupoli in some URLs is wrong)
        name: 'Amour Relax Hotel', nameEn: 'Amour Relax Hotel', nameRu: 'Amour Relax Hotel',
        op: 'business',
        kindKey: 'k.hotel',
        location: { area: 'Almyrida, Apokoronas', areaEn: 'Almyrida, Apokoronas', areaRu: 'Альмирида, Апокоронас',
          coords: [35.4486, 24.2032], seaView: true, _coordDraft: true },
        land_m2: 20000, // ~2 ha across two plots — per Alex, TODO confirm exactly
        condition: 'ready',
        stars: 3,
        units: 9,
        facilities: ['fa.pool', 'fa.tennis', 'fa.basketball', 'fa.parking', 'fa.garden', 'fa.shuttle'],
        nearby: { beachMin: 2, airportKm: 11.5 },
        greece: { residencyEligible: null, residencyThreshold: 250000, ota: { listed: true, incomeMonthly: null } },
        media: {
          // drop the real files into photos/ and they appear automatically;
          // a missing file degrades to the honest typographic placeholder
          cover: 'photos/amour-relax-01.jpg',
          photos: ['photos/amour-relax-01.jpg', 'photos/amour-relax-02.jpg', 'photos/amour-relax-03.jpg'],
          plan: null
        },
        tags: ['t.hotel', 't.twoplots', 't.2ha', 't.ota'],
        _flagship: true
      })
    ]
  };
})();
