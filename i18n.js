/* ============================================================================
   IRON INVEST — i18n. RU is the default (Alex reviews in Russian); PL and EN
   are the public-facing buyer languages and stay complete.
   Editorial register throughout: private-collection vocabulary, never
   marketplace-speak ("Коллекция" not "результаты", "Цена по запросу").
   ============================================================================ */
(function () {
  const DICT = {
    ru: {
      'nav.collection': 'Объекты', 'nav.map': 'Карта', 'nav.about': 'О нас', 'nav.enquire': 'Запрос',

      'hero.kick': 'Крит · Ханья · Апокоронас',
      'hero.title': 'Греческая недвижимость,<br>отобранная <em>поштучно</em>.',
      'hero.lead': 'Частная коллекция объектов в районе Ханьи — от каменных домов до гостиничных проектов. Каждый объект ведём сами: от осмотра и документов до передачи ключей.',
      'hero.cta': 'Смотреть коллекцию', 'hero.cta2': 'Частный запрос',

      'fig.objects': 'Объектов', 'fig.areas': 'Локаций',
      'fig.sea': 'Вид на море', 'fig.land': 'Земли',

      'intro.kick': 'Iron Invest Group · частная коллекция',
      'intro.title': '11 объектов на Крите',
      'intro.lead': 'Виллы, дома, участки под застройку, таверна, торговое помещение и отель — в районе Ханьи. География на карте ниже, полный список — под ней.',
      'intro.cta': 'Смотреть объекты', 'intro.cta2': 'Частный запрос',
      'coll.title': 'Объекты в районе Ханьи',
      'coll.lead': 'Что сейчас в работе: дома и виллы, участки под застройку, доходные объекты. Нажмите на объект, чтобы открыть карточку.',
      'coll.all': 'Все',
      'a11y.skip': 'Перейти к содержанию', 'a11y.h1': 'Недвижимость в районе Ханьи — карта и каталог объектов',
      'a11y.menu': 'Меню', 'a11y.nav': 'Основная навигация', 'a11y.lang': 'Язык интерфейса', 'a11y.map': 'Карта объектов', 'a11y.cats': 'Категории объектов',
      'op.sale': 'Продажа', 'op.rent': 'Аренда', 'op.business': 'Готовый бизнес', 'op.prep': 'В подготовке',
      'f.filters': 'Фильтры', 'f.reset': 'Сбросить всё', 'f.remove': 'Убрать фильтр',
      'f.location': 'Локация', 'f.use': 'Назначение', 'f.op': 'Операция', 'f.features': 'Особенности',
      'f.unknown': 'Не указана', 'use.res': 'Жилое', 'use.nonres': 'Нежилое',
      'empty.title': 'Ничего не найдено', 'empty.sub': 'Ни один объект не подходит под это сочетание фильтров.',
      'shown': 'Показано', 'of': 'из',
      'view.label': 'Вид', 'view.grid': 'Плитка', 'view.list': 'Список',
      'coll.filtered': 'Показано только:', 'coll.showall': 'показать все',
      'cat.villa': 'Виллы и дома', 'cat.land': 'Участки', 'cat.hospitality': 'Гостиничные', 'cat.commercial': 'Коммерция',

      'plate.title': 'ГЕОГРАФИЯ КОЛЛЕКЦИИ',
      'plate.key': 'КЛЮЧЕВОЙ ОБЪЕКТ', 'plate.loc': 'ЛОКАЦИЯ', 'plate.prep': 'В ПОДГОТОВКЕ',
      'plate.settle': 'НАСЕЛЁННЫЙ ПУНКТ', 'plate.contour': 'ГОРИЗОНТАЛИ, м',
      'plate.alt': 'Карта района Ханьи с объектами коллекции',
      'plate.cap': 'Побережье Апокоронаса — Плака и Альмирида. Береговая линия и рельеф построены по реальным данным; положение объектов приблизительное до геодезической привязки.',
      'plate.props': 'объекта', 'plate.mountains': 'Белые горы',

      'close.kick': 'Iron Invest', 'close.title': 'Ведём сделку от осмотра до ключей.',
      'close.lead': 'Работаем с покупателями из Польши и Скандинавии. Говорим по-русски, по-польски и по-английски, а на месте в Ханье находимся сами — без цепочки посредников.',
      'close.cta': 'Назначить разговор',
      'svc.1': 'Осмотр и отбор', 'svc.1d': 'Ездим на место и отклоняем больше, чем показываем.',
      'svc.2': 'Документы и право', 'svc.2d': 'Титул, обременения, разрешения — проверяем до разговора о цене.',
      'svc.3': 'После покупки', 'svc.3d': 'Ремонт, аренда, обслуживание объекта — если это нужно.',

      'foot.desc': 'Iron Invest Group — частная коллекция недвижимости в районе Ханьи — для покупателей из Польши и Скандинавии.',
      'foot.nav': 'Навигация', 'foot.contact': 'Контакты',
      'foot.tbdmail': 'E-mail уточняется — контакты появятся здесь', 'foot.tbdphone': 'телефон — уточняется',
      'foot.place': 'Ханья, Крит, Греция',
      'foot.note': 'Данные объектов в работе — сведения не являются офертой.',

      'dos.overview': 'Обзор', 'dos.details': 'Данные', 'dos.plan': 'Реализация',
      'dos.enquire': 'Запросить объект', 'dos.showmap': 'Показать на карте', 'dos.close': 'Закрыть',
      'dos.specs': 'Данные объекта', 'dos.legal': 'Правовой статус', 'dos.greece': 'Греция — существенное',
      'dos.planh': 'Дорога реализации',
      'dos.planstub': 'Путь реализации этого объекта прорабатывается. Расскажем при разговоре.',

      'f.kind': 'Тип', 'f.condition': 'Состояние', 'f.area': 'Площадь', 'f.land': 'Участок',
      'f.floors': 'Этажей', 'f.owner': 'Собственник', 'f.comm': 'Коммуникации',
      'f.price': 'Цена', 'f.rent': 'Аренда в месяц', 'f.market': 'Целевой рынок',
      'f.legalstatus': 'Титул', 'f.encumbr': 'Обременения', 'f.docs': 'Документы',
      'f.sea': 'Вид на море', 'f.tags': 'Особенности',
      'f.stars': 'Категория', 'f.units': 'Номеров', 'f.facilities': 'Инфраструктура',
      'f.beach': 'До пляжа', 'f.airport': 'До аэропорта Ханьи',
      'unit.minwalk': 'мин пешком', 'unit.km': 'км',
      'fa.pool': 'бассейн', 'fa.tennis': 'теннисный корт', 'fa.basketball': 'баскетбольная площадка',
      'fa.parking': 'парковка', 'fa.garden': 'сад', 'fa.shuttle': 'трансфер',
      'gal.prev': 'Предыдущее фото', 'gal.next': 'Следующее фото',
      'f.bedrooms': 'Спален', 'f.bathrooms': 'Санузлов', 'f.sleeps': 'Спальных мест', 'unit.m': 'м',
      'fa.poolPriv': 'частный бассейн', 'fa.terrace': 'терраса', 'fa.kitchen': 'кухня',
      'fa.fireplace': 'камин', 'fa.bbq': 'барбекю', 'fa.wifi': 'Wi-Fi', 'fa.ac': 'кондиционер',
      'fa.carhire': 'аренда авто', 't.stone': 'каменная постройка', 't.nextto': 'рядом с Eudora 1',

      'cond.ready': 'Готов', 'cond.renovation': 'Под ремонт', 'cond.shell': 'Черновое состояние', 'cond.land': 'Участок',
      'docs.ready': 'Полный комплект', 'docs.partial': 'Частично', 'docs.pending': 'В процессе',

      'greece.residency': 'ВНЖ (Golden Visa)', 'greece.residency.d': 'Порог покупки для вида на жительство',
      'greece.ota': 'Краткосрочная аренда', 'greece.ota.yes': 'Объект сдаётся', 'greece.ota.no': 'Не сдаётся',

      'price.request': 'Цена по запросу', 'per.month': '/ мес.', 'unit.ha': 'га', 'unit.m2': 'м²',
      'photo.soon': 'Фотографии готовятся', 'coord.draft': 'положение приблизительное',
      'tbd': 'уточняется', 'yes': 'Да', 'no': 'Нет', 'none': 'нет', 'draft': 'в работе',

      'k.house2': 'Двухэтажный дом', 'k.renov': 'Дом под полный ремонт', 'k.taverna': 'Таверна',
      'k.smallhouse': 'Малый дом', 'k.apartment': 'Квартира', 'k.shop': 'Торговое помещение',
      'k.house': 'Дом', 'k.villa': 'Вилла', 'k.plot': 'Участок под застройку',
      'k.partnerplot': 'Партнёрский участок', 'k.hotel': 'Гостиничный проект',

      't.twofloors': 'два этажа', 't.inprep': 'в подготовке', 't.fullrenov': 'полный ремонт',
      't.potential': 'инвестиционный потенциал', 't.horeca': 'HoReCa', 't.turnkey': 'готовый бизнес',
      't.compact': 'компактный', 't.town': 'город', 't.commercial': 'коммерческое', 't.rent': 'аренда',
      't.200m': '200 м²', 't.plot300': 'участок 3 сотки', 't.villa': 'вилла', 't.seaview': 'вид на море',
      't.plot': 'участок', 't.buildable': 'под застройку', 't.partner': 'партнёрский проект',
      't.build800': 'застройка ок. 800 м²', 't.hotel': 'отель', 't.twoplots': 'два участка',
      't.2ha': 'ок. 2 га', 't.ota': 'OTA',
      'm.plscan': 'Польша / Скандинавия'
    },

    pl: {
      'nav.collection': 'Obiekty', 'nav.map': 'Mapa', 'nav.about': 'O nas', 'nav.enquire': 'Zapytanie',

      'hero.kick': 'Kreta · Chania · Apokoronas',
      'hero.title': 'Nieruchomości greckie,<br>dobierane <em>pojedynczo</em>.',
      'hero.lead': 'Prywatna kolekcja obiektów w regionie Chania — od domów w kamieniu po projekty hotelowe. Każdy obiekt prowadzimy sami: od oglądu i dokumentów po przekazanie kluczy.',
      'hero.cta': 'Zobacz kolekcję', 'hero.cta2': 'Zapytanie prywatne',

      'fig.objects': 'Obiekty', 'fig.areas': 'Lokalizacje',
      'fig.sea': 'Widok na morze', 'fig.land': 'Grunt',

      'intro.kick': 'Iron Invest Group · kolekcja prywatna',
      'intro.title': '11 obiektów na Krecie',
      'intro.lead': 'Wille, domy, działki pod zabudowę, taverna, lokal handlowy i hotel — w regionie Chania. Geografia na mapie poniżej, pełna lista pod nią.',
      'intro.cta': 'Zobacz obiekty', 'intro.cta2': 'Zapytanie prywatne',
      'coll.title': 'Obiekty w regionie Chania',
      'coll.lead': 'Co jest obecnie w pracy: domy i wille, działki pod zabudowę, obiekty przychodowe. Kliknij obiekt, aby otworzyć kartę.',
      'coll.all': 'Wszystkie',
      'a11y.skip': 'Przejdź do treści', 'a11y.h1': 'Nieruchomości w regionie Chania — mapa i katalog obiektów',
      'a11y.menu': 'Menu', 'a11y.nav': 'Nawigacja główna', 'a11y.lang': 'Język interfejsu', 'a11y.map': 'Mapa obiektów', 'a11y.cats': 'Kategorie obiektów',
      'op.sale': 'Sprzedaż', 'op.rent': 'Najem', 'op.business': 'Gotowy biznes', 'op.prep': 'W przygotowaniu',
      'f.filters': 'Filtry', 'f.reset': 'Wyczyść wszystko', 'f.remove': 'Usuń filtr',
      'f.location': 'Lokalizacja', 'f.use': 'Przeznaczenie', 'f.op': 'Operacja', 'f.features': 'Cechy',
      'f.unknown': 'Nie podano', 'use.res': 'Mieszkalne', 'use.nonres': 'Niemieszkalne',
      'empty.title': 'Nic nie znaleziono', 'empty.sub': 'Żaden obiekt nie pasuje do tego zestawu filtrów.',
      'shown': 'Pokazano', 'of': 'z',
      'view.label': 'Widok', 'view.grid': 'Płytki', 'view.list': 'Lista',
      'coll.filtered': 'Pokazano tylko:', 'coll.showall': 'pokaż wszystkie',
      'cat.villa': 'Wille i domy', 'cat.land': 'Działki', 'cat.hospitality': 'Hospitality', 'cat.commercial': 'Komercyjne',

      'plate.title': 'GEOGRAFIA KOLEKCJI',
      'plate.key': 'OBIEKT KLUCZOWY', 'plate.loc': 'LOKALIZACJA', 'plate.prep': 'W PRZYGOTOWANIU',
      'plate.settle': 'MIEJSCOWOŚĆ', 'plate.contour': 'POZIOMICE, m',
      'plate.alt': 'Mapa regionu Chania z obiektami kolekcji',
      'plate.cap': 'Wybrzeże Apokoronas — Plaka i Almyrida. Linia brzegowa i rzeźba terenu z danych rzeczywistych; pozycje obiektów przybliżone do czasu pomiaru.',
      'plate.props': 'obiekty', 'plate.mountains': 'Białe Góry',

      'close.kick': 'Iron Invest', 'close.title': 'Prowadzimy transakcję od oglądu do kluczy.',
      'close.lead': 'Pracujemy z kupującymi z Polski i Skandynawii. Rozmawiamy po polsku i angielsku, a na miejscu w Chanii jesteśmy sami — bez łańcucha pośredników.',
      'close.cta': 'Umów rozmowę',
      'svc.1': 'Ogląd i selekcja', 'svc.1d': 'Jeździmy na miejsce i odrzucamy więcej, niż pokazujemy.',
      'svc.2': 'Dokumenty i prawo', 'svc.2d': 'Tytuł, obciążenia, pozwolenia — sprawdzane przed rozmową o cenie.',
      'svc.3': 'Po zakupie', 'svc.3d': 'Remont, najem, obsługa obiektu — jeśli tego potrzebujesz.',

      'foot.desc': 'Iron Invest Group — prywatna kolekcja nieruchomości w regionie Chania — dla kupujących z Polski i Skandynawii.',
      'foot.nav': 'Nawigacja', 'foot.contact': 'Kontakt',
      'foot.tbdmail': 'E-mail w przygotowaniu — kontakt pojawi się tutaj', 'foot.tbdphone': 'telefon — do uzupełnienia',
      'foot.place': 'Chania, Kreta, Grecja',
      'foot.note': 'Dane obiektów w opracowaniu — informacje nie stanowią oferty w rozumieniu prawa.',

      'dos.overview': 'Przegląd', 'dos.details': 'Dane', 'dos.plan': 'Realizacja',
      'dos.enquire': 'Zapytaj o obiekt', 'dos.showmap': 'Pokaż na mapie', 'dos.close': 'Zamknij',
      'dos.specs': 'Dane obiektu', 'dos.legal': 'Stan prawny', 'dos.greece': 'Grecja — istotne',
      'dos.planh': 'Droga realizacji',
      'dos.planstub': 'Ścieżka realizacji dla tego obiektu jest w opracowaniu. Opiszemy ją przy rozmowie.',

      'f.kind': 'Typ', 'f.condition': 'Stan', 'f.area': 'Powierzchnia', 'f.land': 'Działka',
      'f.floors': 'Kondygnacje', 'f.owner': 'Właściciel', 'f.comm': 'Media',
      'f.price': 'Cena', 'f.rent': 'Najem miesięczny', 'f.market': 'Rynek docelowy',
      'f.legalstatus': 'Tytuł prawny', 'f.encumbr': 'Obciążenia', 'f.docs': 'Dokumenty',
      'f.sea': 'Widok na morze', 'f.tags': 'Cechy',
      'f.stars': 'Kategoria', 'f.units': 'Pokoi', 'f.facilities': 'Infrastruktura',
      'f.beach': 'Do plaży', 'f.airport': 'Do lotniska Chania',
      'unit.minwalk': 'min pieszo', 'unit.km': 'km',
      'fa.pool': 'basen', 'fa.tennis': 'kort tenisowy', 'fa.basketball': 'boisko do koszykówki',
      'fa.parking': 'parking', 'fa.garden': 'ogród', 'fa.shuttle': 'transfer',
      'gal.prev': 'Poprzednie zdjęcie', 'gal.next': 'Następne zdjęcie',
      'f.bedrooms': 'Sypialnie', 'f.bathrooms': 'Łazienki', 'f.sleeps': 'Miejsc noclegowych', 'unit.m': 'm',
      'fa.poolPriv': 'basen prywatny', 'fa.terrace': 'taras', 'fa.kitchen': 'kuchnia',
      'fa.fireplace': 'kominek', 'fa.bbq': 'grill', 'fa.wifi': 'Wi-Fi', 'fa.ac': 'klimatyzacja',
      'fa.carhire': 'wynajem auta', 't.stone': 'budynek kamienny', 't.nextto': 'obok Eudora 1',

      'cond.ready': 'Gotowy', 'cond.renovation': 'Do remontu', 'cond.shell': 'Stan surowy', 'cond.land': 'Działka',
      'docs.ready': 'Komplet', 'docs.partial': 'Częściowo', 'docs.pending': 'W toku',

      'greece.residency': 'Pobyt (Golden Visa)', 'greece.residency.d': 'Próg zakupu dla pozwolenia na pobyt',
      'greece.ota': 'Najem krótkoterminowy', 'greece.ota.yes': 'Obiekt wynajmowany', 'greece.ota.no': 'Nie wynajmowany',

      'price.request': 'Cena na zapytanie', 'per.month': '/ mies.', 'unit.ha': 'ha', 'unit.m2': 'm²',
      'photo.soon': 'Fotografie wkrótce', 'coord.draft': 'lokalizacja przybliżona',
      'tbd': 'do ustalenia', 'yes': 'Tak', 'no': 'Nie', 'none': 'brak', 'draft': 'w opracowaniu',

      'k.house2': 'Dom dwupiętrowy', 'k.renov': 'Dom do pełnego remontu', 'k.taverna': 'Taverna',
      'k.smallhouse': 'Mały dom', 'k.apartment': 'Apartament', 'k.shop': 'Lokal handlowy',
      'k.house': 'Dom', 'k.villa': 'Willa', 'k.plot': 'Działka budowlana',
      'k.partnerplot': 'Działka partnerska', 'k.hotel': 'Projekt hotelowy',

      't.twofloors': 'dwie kondygnacje', 't.inprep': 'w opracowaniu', 't.fullrenov': 'pełny remont',
      't.potential': 'potencjał inwestycyjny', 't.horeca': 'HoReCa', 't.turnkey': 'gotowy biznes',
      't.compact': 'kompaktowy', 't.town': 'miasto', 't.commercial': 'komercyjny', 't.rent': 'najem',
      't.200m': '200 m²', 't.plot300': 'działka 3 ary', 't.villa': 'willa', 't.seaview': 'widok na morze',
      't.plot': 'działka', 't.buildable': 'pod zabudowę', 't.partner': 'projekt partnerski',
      't.build800': 'zabudowa ok. 800 m²', 't.hotel': 'hotel', 't.twoplots': 'dwie działki',
      't.2ha': 'ok. 2 ha', 't.ota': 'OTA',
      'm.plscan': 'Polska / Skandynawia'
    },

    en: {
      'nav.collection': 'Properties', 'nav.map': 'Map', 'nav.about': 'About', 'nav.enquire': 'Enquire',

      'hero.kick': 'Crete · Chania · Apokoronas',
      'hero.title': 'Greek property,<br>selected <em>one by one</em>.',
      'hero.lead': 'A private collection in the Chania region — from stone houses to hospitality projects. We handle each one ourselves: viewing, documents, and the handover of keys.',
      'hero.cta': 'View the collection', 'hero.cta2': 'Private enquiry',

      'fig.objects': 'Properties', 'fig.areas': 'Locations',
      'fig.sea': 'Sea view', 'fig.land': 'Land',

      'intro.kick': 'Iron Invest Group · private collection',
      'intro.title': '11 properties on Crete',
      'intro.lead': 'Villas, houses, building plots, a taverna, a retail unit and a hotel — in the Chania region. The geography is on the map below, the full list beneath it.',
      'intro.cta': 'View the properties', 'intro.cta2': 'Private enquiry',
      'coll.title': 'Properties in the Chania region',
      'coll.lead': 'What is currently in hand: houses and villas, building plots, income-producing assets. Select a property to open its record.',
      'coll.all': 'All',
      'a11y.skip': 'Skip to content', 'a11y.h1': 'Property in the Chania region — map and catalogue',
      'a11y.menu': 'Menu', 'a11y.nav': 'Main navigation', 'a11y.lang': 'Interface language', 'a11y.map': 'Map of properties', 'a11y.cats': 'Property categories',
      'op.sale': 'For sale', 'op.rent': 'To let', 'op.business': 'Turnkey business', 'op.prep': 'In preparation',
      'f.filters': 'Filters', 'f.reset': 'Clear all', 'f.remove': 'Remove filter',
      'f.location': 'Location', 'f.use': 'Use', 'f.op': 'Operation', 'f.features': 'Features',
      'f.unknown': 'Not stated', 'use.res': 'Residential', 'use.nonres': 'Non-residential',
      'empty.title': 'Nothing found', 'empty.sub': 'No property matches this combination of filters.',
      'shown': 'Showing', 'of': 'of',
      'view.label': 'View', 'view.grid': 'Grid', 'view.list': 'List',
      'coll.filtered': 'Showing only:', 'coll.showall': 'show all',
      'cat.villa': 'Villas & houses', 'cat.land': 'Land', 'cat.hospitality': 'Hospitality', 'cat.commercial': 'Commercial',

      'plate.title': 'GEOGRAPHY OF THE COLLECTION',
      'plate.key': 'KEY ASSET', 'plate.loc': 'LOCATION', 'plate.prep': 'IN PREPARATION',
      'plate.settle': 'SETTLEMENT', 'plate.contour': 'CONTOURS, m',
      'plate.alt': 'Map of the Chania region with the collection',
      'plate.cap': 'The Apokoronas coast — Plaka and Almyrida. Coastline and relief are drawn from real data; object positions approximate pending survey.',
      'plate.props': 'properties', 'plate.mountains': 'White Mountains',

      'close.kick': 'Iron Invest', 'close.title': 'We carry the transaction from viewing to keys.',
      'close.lead': 'We work with buyers from Poland and Scandinavia, in Polish and English, and we are on the ground in Chania ourselves — no chain of intermediaries.',
      'close.cta': 'Arrange a call',
      'svc.1': 'Viewing & selection', 'svc.1d': 'We go and look, and we reject more than we show.',
      'svc.2': 'Documents & law', 'svc.2d': 'Title, encumbrances, permits — checked before price is discussed.',
      'svc.3': 'After purchase', 'svc.3d': 'Renovation, letting, property management — if you need it.',

      'foot.desc': 'Iron Invest Group — a private collection of property in the Chania region — for buyers from Poland and Scandinavia.',
      'foot.nav': 'Navigation', 'foot.contact': 'Contact',
      'foot.tbdmail': 'E-mail to follow — contact details will appear here', 'foot.tbdphone': 'phone — to be added',
      'foot.place': 'Chania, Crete, Greece',
      'foot.note': 'Property data in preparation — this information does not constitute a legal offer.',

      'dos.overview': 'Overview', 'dos.details': 'Details', 'dos.plan': 'Realisation',
      'dos.enquire': 'Enquire about this', 'dos.showmap': 'Show on the map', 'dos.close': 'Close',
      'dos.specs': 'Property data', 'dos.legal': 'Legal standing', 'dos.greece': 'Greece — of note',
      'dos.planh': 'Route to realisation',
      'dos.planstub': 'The realisation route for this property is in preparation. We will walk you through it in conversation.',

      'f.kind': 'Type', 'f.condition': 'Condition', 'f.area': 'Floor area', 'f.land': 'Plot',
      'f.floors': 'Storeys', 'f.owner': 'Owner', 'f.comm': 'Utilities',
      'f.price': 'Price', 'f.rent': 'Monthly rent', 'f.market': 'Target market',
      'f.legalstatus': 'Title', 'f.encumbr': 'Encumbrances', 'f.docs': 'Documents',
      'f.sea': 'Sea view', 'f.tags': 'Features',
      'f.stars': 'Category', 'f.units': 'Rooms', 'f.facilities': 'Facilities',
      'f.beach': 'To the beach', 'f.airport': 'To Chania airport',
      'unit.minwalk': 'min walk', 'unit.km': 'km',
      'fa.pool': 'pool', 'fa.tennis': 'tennis court', 'fa.basketball': 'basketball court',
      'fa.parking': 'parking', 'fa.garden': 'garden', 'fa.shuttle': 'shuttle',
      'gal.prev': 'Previous photo', 'gal.next': 'Next photo',
      'f.bedrooms': 'Bedrooms', 'f.bathrooms': 'Bathrooms', 'f.sleeps': 'Sleeps', 'unit.m': 'm',
      'fa.poolPriv': 'private pool', 'fa.terrace': 'terrace', 'fa.kitchen': 'kitchen',
      'fa.fireplace': 'fireplace', 'fa.bbq': 'BBQ', 'fa.wifi': 'Wi-Fi', 'fa.ac': 'air conditioning',
      'fa.carhire': 'car hire', 't.stone': 'stone building', 't.nextto': 'adjacent to Eudora 1',

      'cond.ready': 'Ready', 'cond.renovation': 'Needs renovation', 'cond.shell': 'Shell condition', 'cond.land': 'Land',
      'docs.ready': 'Complete', 'docs.partial': 'Partial', 'docs.pending': 'Pending',

      'greece.residency': 'Residency (Golden Visa)', 'greece.residency.d': 'Purchase threshold for a residence permit',
      'greece.ota': 'Short-term letting', 'greece.ota.yes': 'Currently let', 'greece.ota.no': 'Not let',

      'price.request': 'Price on request', 'per.month': '/ mo', 'unit.ha': 'ha', 'unit.m2': 'm²',
      'photo.soon': 'Photography to follow', 'coord.draft': 'approximate location',
      'tbd': 'to be confirmed', 'yes': 'Yes', 'no': 'No', 'none': 'none', 'draft': 'in preparation',

      'k.house2': 'Two-storey house', 'k.renov': 'House for full renovation', 'k.taverna': 'Taverna',
      'k.smallhouse': 'Small house', 'k.apartment': 'Apartment', 'k.shop': 'Retail unit',
      'k.house': 'House', 'k.villa': 'Villa', 'k.plot': 'Building plot',
      'k.partnerplot': 'Partner plot', 'k.hotel': 'Hotel project',

      't.twofloors': 'two storeys', 't.inprep': 'in preparation', 't.fullrenov': 'full renovation',
      't.potential': 'investment potential', 't.horeca': 'HoReCa', 't.turnkey': 'turnkey business',
      't.compact': 'compact', 't.town': 'town', 't.commercial': 'commercial', 't.rent': 'to let',
      't.200m': '200 m²', 't.plot300': '300 m² plot', 't.villa': 'villa', 't.seaview': 'sea view',
      't.plot': 'plot', 't.buildable': 'buildable', 't.partner': 'partner project',
      't.build800': 'approx. 800 m² buildable', 't.hotel': 'hotel', 't.twoplots': 'two plots',
      't.2ha': 'approx. 2 ha', 't.ota': 'OTA',
      'm.plscan': 'Poland / Scandinavia'
    }
  };

  const HTML_LANG = { ru: 'ru', pl: 'pl', en: 'en' };

  /* Language choice, in order of authority:
       1. what the visitor explicitly picked before (remembered)
       2. their browser language — a Polish buyer lands on Polish, a Russian
          speaker (Alex) lands on Russian, everyone else gets English
       3. English as the neutral fallback for the international audience */
  const LS = 'iron_lang';
  function detect() {
    try { const saved = localStorage.getItem(LS); if (saved && DICT[saved]) return saved; } catch (e) {}
    const tags = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']);
    for (const tag of tags) {
      const base = String(tag).toLowerCase().split('-')[0];
      if (base === 'ru' || base === 'be' || base === 'uk') return 'ru'; // Cyrillic-reading visitors
      if (base === 'pl') return 'pl';
      if (DICT[base]) return base;
    }
    return 'en';
  }

  const I18N = {
    lang: 'ru',                       // replaced by detect() at start-up
    langs: ['ru', 'pl', 'en'],
    t(key) {
      const d = DICT[I18N.lang] || DICT.ru;
      if (d[key] != null) return d[key];
      return DICT.ru[key] != null ? DICT.ru[key] : key;
    },
    set(lang, remember) {
      if (!DICT[lang]) return;
      I18N.lang = lang;
      document.documentElement.lang = HTML_LANG[lang];
      if (remember !== false) { try { localStorage.setItem(LS, lang); } catch (e) {} }
      I18N.apply();
      document.dispatchEvent(new CustomEvent('iron:lang', { detail: { lang } }));
    },
    init() { I18N.lang = detect(); document.documentElement.lang = HTML_LANG[I18N.lang]; },
    apply() {
      document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = I18N.t(el.getAttribute('data-i18n')); });
      document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = I18N.t(el.getAttribute('data-i18n-html')); });
      document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', I18N.t(el.getAttribute('data-i18n-aria'))); });
    }
  };

  window.I18N = I18N;
})();
