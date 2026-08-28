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
        rooms: { bed: 3, bath: 3 },   // 2+1 спальни и 2+1 санузла по двум квартирам
        listing: { code: 'KH371', agency: 'Euroland Property Group',
                   url: 'https://www.euroland-crete.com/property/prime-development-opportunity-in-plaka-kh371/' },
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
          // 00-* — снимки из листинга агентства Euroland (KH371). Права
          // на них у агентства; на портале они по решению владельца.
          cover: 'photos/plaka-1/00-aerial.jpg',
          photos: ['photos/plaka-1/00-aerial.jpg','photos/plaka-1/00b-facade.jpg',
                   'photos/plaka-1/10.jpg',
                   'photos/plaka-1/01.jpg','photos/plaka-1/02.jpg','photos/plaka-1/03.jpg',
                   'photos/plaka-1/04.jpg','photos/plaka-1/05.jpg','photos/plaka-1/06.jpg',
                   'photos/plaka-1/07.jpg','photos/plaka-1/08.jpg','photos/plaka-1/09.jpg',
                   'photos/plaka-1/plan-topo.jpg','photos/plaka-1/plan-floor.jpg'],
          plan: 'photos/plaka-1/plan-floor.jpg'
        },
        _parts: [
          { key: 'p.flat1', m2: 73, note: 'st.flat1' },
          { key: 'p.flat2', m2: 46, note: 'st.flat2' },
          { key: 'p.store', m2: 50, note: null },
          { key: 'p.unfinished', m2: 158, note: 'st.shellbox' }
        ],
        links: [
          { k: 'listing', url: 'https://www.euroland-crete.com/property/prime-development-opportunity-in-plaka-kh371/' }
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
        // обложка — проектный рендер, не текущее состояние: объект в стадии
        // реконструкции, и рендер показывает, чем он должен стать
        media: {
          cover: 'photos/plaka-2/00-render.jpg',
          photos: ['photos/plaka-2/00-render.jpg','photos/plaka-2/00b-render.jpg',
                   'photos/plaka-2/plan-f1.jpg','photos/plaka-2/plan-f2.jpg',
                   'photos/plaka-2/01.jpg','photos/plaka-2/02.jpg','photos/plaka-2/03.jpg',
                   'photos/plaka-2/04.jpg','photos/plaka-2/05.jpg','photos/plaka-2/06.jpg',
                   'photos/plaka-2/07.jpg','photos/plaka-2/plan-topo.jpg',
                   'photos/plaka-2/plan-base.jpg','photos/plaka-2/plan-floor1.jpg'],
          plan: 'photos/plaka-2/plan-f1.jpg'
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
        // Данные собраны 26.08.2026 с публичных страниц отеля: Booking,
        // TripAdvisor, Facebook. Всё здесь опубликовано самим отелем.
        name: 'Amour Relax Hotel', nameEn: 'Amour Relax Hotel', nameRu: 'Amour Relax Hotel',
        op: 'business',
        kindKey: 'k.hotel',
        // точка из карточки TripAdvisor — не черновая
        location: { area: 'Almyrida, Apokoronas', areaEn: 'Almyrida, Apokoronas', areaRu: 'Алмирида, Апокоронас',
          coords: [35.448112, 24.190527], seaView: true, _coordDraft: false },
        address: {
          ru: 'Epar.Od. Kalivon-Kefalas, Алмирида, Крит 730 08, Греция',
          en: 'Epar.Od. Kalivon-Kefalas, Almyrida, Crete 730 08, Greece',
          gr: 'Επαρ.Οδ. Καλυβών-Κεφαλά, Αλμυρίδα, Κρήτη 730 08'
        },
        land_m2: 20000, // ~2 га на двух участках — со слов Alex, требует подтверждения
        condition: 'ready',
        stars: 3,
        units: 9,
        facilities: ['fa.pool', 'fa.tennis', 'fa.badminton', 'fa.parking', 'fa.garden',
                     'fa.shuttle', 'fa.wifi', 'fa.terrace', 'fa.roomservice', 'fa.concierge',
                     'fa.adultsonly', 'fa.nonsmoking'],
        rooms: { amenities: ['ra.ac', 'ra.safe', 'ra.tv', 'ra.balcony', 'ra.kitchenette',
                             'ra.microwave', 'ra.fridge', 'ra.kettle', 'ra.wardrobe',
                             'ra.shower', 'ra.toiletries'] },
        nearby: { beachName: 'Keras', beachKm: 1.4, airportKm: 32, airportName: 'Souda',
                  airport2Km: 90.9, airport2Name: 'Heraklion', restaurants500m: 28 },
        greece: { residencyEligible: null, residencyThreshold: 250000,
                  ota: { listed: true, bookable: false, incomeMonthly: null } },
        ratings: [
          { src: 'Booking', score: 9.3, max: 10, n: 22, label: 'Превосходно',
            detail: [['r.comfort', 9.7], ['r.clean', 9.5], ['r.amenities', 9.2],
                     ['r.value', 9.2], ['r.staff', 8.6], ['r.location', 8.6], ['r.wifi', 7.5]] },
          { src: 'TripAdvisor', score: 5.0, max: 5, n: 4, label: null,
            detail: [['r.rooms', 5.0], ['r.quality', 5.0], ['r.clean', 5.0],
                     ['r.service', 5.0], ['r.sleep', 5.0], ['r.location', 4.3]] }
        ],
        links: [
          { k: 'booking', url: 'https://www.booking.com/hotel/gr/amour-relax.html' },
          { k: 'tripadvisor', url: 'https://www.tripadvisor.com.gr/Hotel_Review-g775923-d28077053-Reviews-Amour_Relax_Hotel-Almyrida_Chania_Prefecture_Crete.html' },
          { k: 'facebook', url: 'https://www.facebook.com/profile.php?id=61561312883178' },
          { k: 'instagram', url: 'https://www.instagram.com/amourrelax/' },
          { k: 'tiktok', url: 'https://www.tiktok.com/@amourrelax' }
        ],
        contacts: { phone: '+30 697 333 8667', email: 'info.amourhotel@gmail.com' },
        pitch: { ru: 'Отель для пар, только для взрослых. Девять номеров, бассейн, теннисный корт и оливковый сад.',
                 en: 'An adults-only retreat for couples. Nine rooms, a pool, a tennis court and an olive grove.' },
        languages: ['uk', 'ru', 'en', 'es', 'cs', 'sk', 'fr'],
        stage: null,
        media: {
          cover: 'photos/amour-relax/01-aerial-day.jpg',
          photos: [
            'photos/amour-relax/01-aerial-day.jpg',
            'photos/amour-relax/02-aerial-night.jpg',
            'photos/amour-relax/03.jpg',
            'photos/amour-relax/04.jpg',
            'photos/amour-relax/05.jpg',
            'photos/amour-relax/06.jpg',
            'photos/amour-relax/07.jpg',
            'photos/amour-relax/08.jpg',
            'photos/amour-relax/09.jpg',
            'photos/amour-relax/10.jpg',
            'photos/amour-relax/11.jpg',
            'photos/amour-relax/12.jpg',
            'photos/amour-relax/13.jpg',
            'photos/amour-relax/14.jpg',
            'photos/amour-relax/15.jpg',
            'photos/amour-relax/16.jpg',
            'photos/amour-relax/17.jpg',
            'photos/amour-relax/18.jpg',
            'photos/amour-relax/19.jpg',
            'photos/amour-relax/20.jpg',
            'photos/amour-relax/21.jpg',
            'photos/amour-relax/22.jpg',
            'photos/amour-relax/23.jpg',
            'photos/amour-relax/24.jpg',
            'photos/amour-relax/25.jpg'
          ],
          plan: null
        },
        tags: ['t.hotel', 't.twoplots', 't.2ha', 't.ota', 't.adultsonly'],
        _flagship: true
      })
    ]
  };
})();
