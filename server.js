const express = require('express');
const session = require('express-session');
const SQLiteStoreFactory = require('connect-sqlite3');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-this-password-now';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-session-secret-now';
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'app.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new sqlite3.Database(DB_FILE);
const SQLiteStore = SQLiteStoreFactory(session);

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const DEFAULT_PHOTOS = {
  'arc de triomphe': '/assets/photos/arc.jpg',
  'disneyland': '/assets/photos/disney.jpg',
  'disneyland paris': '/assets/photos/disney.jpg',
  'louvre': '/assets/photos/louvre.jpg',
  'eiffeltoren': '/assets/photos/eiffel.jpg',
  'eiffel': '/assets/photos/eiffel.jpg',
  'sacré-cœur': '/assets/photos/sacrecoeur.jpg',
  'sacre-coeur': '/assets/photos/sacrecoeur.jpg',
  'sacre coeur': '/assets/photos/sacrecoeur.jpg',
  'montmartre': '/assets/photos/montmartre.jpg'
};

const DEFAULT_COORDS = {
  'generator paris (hotel)': [48.8786, 2.3707],
  'the people paris marais (hotel)': [48.8517, 2.3652],
  'arc de triomphe': [48.8738, 2.2950],
  'seine boottocht': [48.857462306372966, 2.341009422467063],
  'disneyland paris': [48.8706, 2.7797],
  'louvre': [48.8606, 2.3376],
  'eiffeltoren': [48.8584, 2.2945],
  'montmartre': [48.8867, 2.3431],
  'sacré-cœur': [48.8867, 2.3431],
  'sacre-coeur': [48.8867, 2.3431]
};

function guessPhoto(title = '', text = '') {
  const value = `${title} ${text}`.toLowerCase();
  for (const [key, photo] of Object.entries(DEFAULT_PHOTOS)) {
    if (value.includes(key)) return photo;
  }
  return '';
}

function attractionInfo(title = '', text = '') {
  const value = `${title} ${text}`.toLowerCase();
  if (value.includes('eiffeltoren') || value.includes('eiffel')) {
    return 'De Eiffeltoren is hét symbool van Parijs en het meest bezochte monument ter wereld. De toren is 300 meter hoog maar kan in de winter tot wel 8 centimeter krimpen door de kou. Mocht je voor de trap kiezen om naar boven te gaan op de Eiffeltoren, dan moet je maar liefst 1600 treden beklimmen.';
  }
  if (value.includes('arc de triomphe')) {
    return 'Napoleon gaf opdracht tot de bouw van deze triomfboog maar hij maakte de voltooiing zelf niet meer mee. Van de top heb je een mooi en veilig zicht op het drukste plein van Parijs, maar bekijk ook de prachtige reliëfs in de boog zelf.';
  }
  if (value.includes('montmartre')) {
    return 'De bekende wijk Montmartre is een van de leukste wijken in Parijs. Het wordt ook wel de kunstenaarswijk van Parijs genoemd en dat zie je meteen terug. Leuke straatjes om doorheen te lopen zijn Rue Abbesses met schattige winkeltjes en Rue Chevalier de La Barre. Let op: in Montmartre en zeker bij de Sacré-Cœur lopen veel straatverkopers rond. Laat je hand niet pakken voor een armbandje, loop direct door en let goed op je spullen vanwege zakkenrollers.';
  }
  if (value.includes('sacré-cœur') || value.includes('sacre-coeur') || value.includes('sacre coeur')) {
    return 'Basilique du Sacré-Cœur, deze sneeuwwitte kerk wordt wel oneerbiedig de suikertaart genoemd. De buitenkant is omstreden, maar binnenin zie je prachtige beelden en mozaïeken. Ook dit is een mooi uitzichtpunt, want de kerk ligt op de heuvel Montmartre, het hoogste punt van Parijs.';
  }
  if (value.includes('louvre')) {
    return 'In het Louvre, het meest bezochte museum ter wereld, ga je een aantal topstukken bekijken uit de kunstgeschiedenis. Een voorbeeld daarvan is de Mona Lisa van Leonardo Da Vinci, het schilderij dat ooit in de slaapkamer van Napoleon heeft gehangen. Het Louvre was oorspronkelijk een kasteel uit de 12e en 13e eeuw onder koning Philip II. Toen Versailles klaar was, verhuisde de monarchie daarheen en bleef het Louvre achter als tentoonstellingsplek. Tijdens de Tweede Wereldoorlog gebruikten de nazi’s het Louvre om gestolen kunst op te slaan. Alle galerijen samen zijn meer dan 60.000 m² groot; je hebt ongeveer 100 dagen nodig om alles te bekijken.';
  }
  return '';
}

function dayItem(title, text, image = '', moreInfo = '') {
  return {
    title,
    text,
    image: image || guessPhoto(title, text),
    moreInfo: moreInfo || attractionInfo(title, text)
  };
}

function defaultSpots(hotelName, groupKey = 'A') {
  const isGroupB = groupKey === 'B';
  return [
    { id: uid(), name: 'Arc de Triomphe', note: 'Maandag middag', coords: DEFAULT_COORDS['arc de triomphe'] },
    { id: uid(), name: 'Seine boottocht', note: 'Maandag avond', coords: DEFAULT_COORDS['seine boottocht'] },
    { id: uid(), name: 'Disneyland Paris', note: 'Dinsdag hele dag (groepen samen)', coords: DEFAULT_COORDS['disneyland paris'] },
    { id: uid(), name: isGroupB ? 'Eiffeltoren' : 'Louvre', note: 'Woensdag ochtend', coords: DEFAULT_COORDS[isGroupB ? 'eiffeltoren' : 'louvre'] },
    { id: uid(), name: isGroupB ? 'Louvre' : 'Eiffeltoren', note: 'Woensdag middag', coords: DEFAULT_COORDS[isGroupB ? 'louvre' : 'eiffeltoren'] },
    { id: uid(), name: 'Montmartre', note: 'Donderdag ochtend', coords: DEFAULT_COORDS['montmartre'] },
    { id: uid(), name: 'Sacré-Cœur', note: 'Donderdag ochtend', coords: DEFAULT_COORDS['sacré-cœur'] }
  ];
}

function defaultProgramBase(groupLabel, groupKey = 'A') {
  const isGroupB = groupKey === 'B';
  return [
    {
      id: uid(), dayShort: 'Maandag', dayLabel: 'Dag 1', title: 'Vertrek, aankomst Parijs, Arc de Triomphe en bootreis',
      items: [
        dayItem('Ochtend — vertrek & aankomst', 'Verzamelen en vertrek in het Develpark en aankomst in Parijs. Daarna naar het hotel.'),
        dayItem('Middag — Arc de Triomphe', 'Bezoek aan de Arc de Triomphe en omgeving.'),
        dayItem('Avond — vaartocht over de Seine', 'Boottocht langs de bekendste plekken van Parijs.')
      ]
    },
    {
      id: uid(), dayShort: 'Dinsdag', dayLabel: 'Dag 2', title: 'Disneyland Paris (groepen samen)',
      items: [dayItem('Hele dag — Disneyland Paris', 'Groep A en Groep B bezoeken samen Disneyland Paris met de nieuwe "World of Frozen". We sluiten deze dag uiteraard af met de sprookjesachtige en indrukwekkende vuurwerkshow!')]
    },
    {
      id: uid(), dayShort: 'Woensdag', dayLabel: 'Dag 3', title: isGroupB ? 'Eiffeltoren, Louvre en vrije tijd' : 'Louvre, Eiffeltoren en vrije tijd',
      items: [
        dayItem(isGroupB ? 'Ochtend — Eiffeltoren' : 'Ochtend — Musée du Louvre', isGroupB ? 'Bezoek aan de Eiffeltoren en omgeving.' : 'Bezoek aan het museum en verschillende topstukken uit de kunstgeschiedenis.'),
        dayItem(isGroupB ? 'Middag — Musée du Louvre' : 'Middag — Eiffeltoren', isGroupB ? 'Bezoek aan het museum en verschillende topstukken uit de kunstgeschiedenis.' : 'Bezoek aan de Eiffeltoren en omgeving.'),
        dayItem('Later — vrije tijd', `Vrije tijd volgens de groepsafspraken van ${groupLabel}.`)
      ]
    },
    {
      id: uid(), dayShort: 'Donderdag', dayLabel: 'Dag 4', title: 'Montmartre, Sacré-Cœur en terugreis',
      items: [
        dayItem('Ochtend — Montmartre en Sacré-Cœur', 'Groep A en Groep B bezoeken in de ochtend Montmartre en de Basilique du Sacré-Cœur.'),
        dayItem('Later — terugreis', 'Vertrek uit Parijs en terugreis naar huis.')
      ]
    }
  ];
}

function defaultData() {
  return {
    shared: {
      departure: '2026-09-28T07:00',
      instagramProfile: 'https://www.instagram.com/develsteincollegezwijndrecht/',
      announcements: [
        {
          id: uid(),
          title: 'Verplicht meenemen bij vertrek',
          text: 'Neem op de dag van vertrek een geldig identiteitsbewijs en een envelop met daar in 20 euro borg mee. Zonder ID kun je niet mee op reis.',
          type: 'urgent',
          link: ''
        }
      ],
      instagramLinks: [
        { id: uid(), title: '2025 dag 1', url: 'https://www.instagram.com/reel/DPNoZkjirNl/?igsh=OWVoZW9jZjB3Ym1y&wa_status_inline=true' },
        { id: uid(), title: '2025 dag 2', url: 'https://www.instagram.com/reel/DPQLpZQig86/?igsh=MWZ6Y2dkMHlrMzBxdg%3D%3D&wa_status_inline=true' },
        { id: uid(), title: '2025 dag 3A', url: 'https://www.instagram.com/reel/DPRFMWCCjXl/?igsh=cWsyNTUwMDEyNW05&wa_status_inline=true' },
        { id: uid(), title: '2025 dag 3B', url: 'https://www.instagram.com/reel/DPRr9ZcCs61/?igsh=eTJydjF3ZmRyd3pw&wa_status_inline=true' },
        { id: uid(), title: '2025 dag 4', url: 'https://www.instagram.com/reel/DPTjJerilcc/?igsh=MW5rYW9yYzRqZGxvaA%3D%3D&wa_status_inline=true' }
      ],
      practical: {
        travel: [],
        moneyInsurance: [
          'Zakgeld: behalve de lunch op de heenreis zijn alle maaltijden en excursies inbegrepen in de prijs.',
          'Je zakgeld is dus voor als je een souvenir wilt kopen of bijvoorbeeld een keer zin hebt in een ijsje of een macaron.',
          'Richtprijs: 50 euro.',
          'Verzekering: er is een collectieve scholierenreisongevallenverzekering afgesloten.',
          'Voor de details verwijzen we naar de schoolgids 2025 2026.',
          'Een eventuele annuleringsverzekering voor of tijdens de reis moet zelf afgesloten worden.'
        ],
        packing: [
          'Je goede humeur',
          'Geldig paspoort of Europese identiteitskaart',
          'Pinpas en zakgeld',
          'Gegevens van je ziektekostenverzekering en reisverzekering',
          'Regenkleding',
          'Handdoek(en)',
          'Kleding en nachtgoed',
          'Toiletartikelen',
          'Eventuele medicijnen',
          'Wandelschoenen',
          'Spelletjes (kaarten, e.d.)',
          'Oplader en powerbank voor je telefoon'
        ],
        bus: [
          '20 euro borg in envelop met je naam erop',
          'Paspoort of ID-kaart meenemen als handbagage, dus niet in je koffer',
          'Lunchpakket heenreis',
          'Kleingeld voor toiletten',
          'Pen',
          'Doe een label met naam, adres en telefoonnummer op je handbagage en koffer'
        ],
        agreements: [
          'Er wordt niet gerookt, ook geen e-sigaret of vape.',
          'Geen gebruik van alcohol of drugs.',
          'Op roken en drinken in de hotelkamers staan hoge boetes. Bij constatering zal de leiding direct een van deze boetes innen. Dit geldt ook voor beschadigingen en vervuiling.',
          'Zorg dat je hotelkamer netjes blijft, schade komt voor eigen rekening.',
          'Laat geen kostbaarheden achter in de hotelkamer, dus ook niet je paspoort of ID-kaart.',
          'Kom altijd op tijd op de vertrek- en verzamelpunten.',
          'Na 23.00 uur is het rustig op de kamers. Denk aan de overige gasten. Bij overlast word je uit het hotel verwijderd.',
          'Je mag het hotel nooit op eigen houtje verlaten.',
          'Ga in de stad in je vrije tijd nooit alleen op stap, maar minimaal met 3 personen.',
          'Let op zakkenrollers. Neem eventueel een klein slotje mee of een paperclip om je rits van je tas dicht te maken.',
          'Houd rekening met anderen.',
          'Geluidsboxen zijn niet toegestaan.'
        ]
      }
    },
    groups: {
      A: {
        label: 'Groep A',
        hotel: 'Generator Paris',
        leiding: 'Mevr. Brandsma, Dhr. Franken, Mevr. Meeder, Dhr. Toepoel',
        program: defaultProgramBase('Groep A', 'A'),
        rooms: [
          { id: uid(), name: 'Kamer 201', students: 'Emma, Noor, Mila', note: 'Dicht bij de trap' },
          { id: uid(), name: 'Kamer 202', students: 'Daan, Sem, Lucas', note: '' }
        ],
        spots: defaultSpots('Generator Paris', 'A')
      },
      B: {
        label: 'Groep B',
        hotel: 'The People Paris Marais',
        leiding: 'Mevr. Jansen, Dhr. Meijer, Mevr. Pauw, Dhr. Scholtes',
        program: defaultProgramBase('Groep B', 'B'),
        rooms: [
          { id: uid(), name: 'Kamer 301', students: 'Sara, Lotte, Yara', note: '' },
          { id: uid(), name: 'Kamer 302', students: 'Finn, Milan, Ties', note: 'Naast begeleiderskamer' }
        ],
        spots: defaultSpots('The People Paris Marais', 'B')
      }
    }
  };
}

function normalizeSpot(spot, hotelName) {
  if (!spot) return null;
  const name = spot.name || 'Locatie';
  const key = name.toLowerCase();
  let coords = Array.isArray(spot.coords) && spot.coords.length === 2 ? spot.coords : null;
  if (key === 'seine boottocht') coords = DEFAULT_COORDS['seine boottocht'];
  else if (!coords) {
    if (key.includes('(hotel)')) coords = DEFAULT_COORDS[`${hotelName.toLowerCase()} (hotel)`] || [48.8786, 2.3707];
    else coords = DEFAULT_COORDS[key] || [48.8606, 2.3376];
  }
  return { id: spot.id || uid(), name, note: spot.note || '', coords: [Number(coords[0]), Number(coords[1])] };
}

function normalizeProgram(program, fallbackProgram) {
  const source = Array.isArray(program) && program.length ? program : fallbackProgram;
  return source.map((day, idx) => ({
    id: day.id || uid(),
    dayShort: day.dayShort || fallbackProgram[idx]?.dayShort || `Dag ${idx + 1}`,
    dayLabel: day.dayLabel || fallbackProgram[idx]?.dayLabel || `Dag ${idx + 1}`,
    title: day.title || fallbackProgram[idx]?.title || `Dag ${idx + 1}`,
    items: Array.isArray(day.items) && day.items.length ? day.items.map(item => ({
      title: item.title || 'Onderdeel',
      text: (item.text === 'Een volledige dag in Disneyland Paris.' ? 'Een volledige dag in Disneyland Paris met de nieuwe "World of Frozen". We sluiten deze dag uiteraard af met de sprookjesachtige en indrukwekkende vuurwerkshow!' : (item.text || '')),
      image: item.image || guessPhoto(item.title, item.text),
      moreInfo: item.moreInfo || attractionInfo(item.title, item.text)
    })) : fallbackProgram[idx].items
  }));
}

function normalizeData(data) {
  const defaults = defaultData();
  const next = data && typeof data === 'object' ? data : defaults;
  const shared = next.shared || defaults.shared;
  const groups = next.groups || defaults.groups;

  ['A', 'B'].forEach(groupKey => {
    const fallback = defaults.groups[groupKey];
    const group = groups[groupKey] || fallback;
    group.label = group.label || fallback.label;
    group.hotel = group.hotel || fallback.hotel;
    group.leiding = group.leiding || fallback.leiding;
    group.program = normalizeProgram(group.program, fallback.program);
    if (groupKey === 'B' && group.program[2]?.items?.length >= 2) {
      group.program[2].title = 'Eiffeltoren, Louvre en vrije tijd';
      group.program[2].items[0] = { ...group.program[2].items[0], title: 'Ochtend — Eiffeltoren', text: 'Bezoek aan de Eiffeltoren en omgeving.', image: guessPhoto('Eiffeltoren', 'Bezoek aan de Eiffeltoren en omgeving.'), moreInfo: attractionInfo('Eiffeltoren', 'Bezoek aan de Eiffeltoren en omgeving.') };
      group.program[2].items[1] = { ...group.program[2].items[1], title: 'Middag — Musée du Louvre', text: 'Bezoek aan het museum en verschillende topstukken uit de kunstgeschiedenis.', image: guessPhoto('Louvre', 'Bezoek aan het museum en verschillende topstukken uit de kunstgeschiedenis.'), moreInfo: attractionInfo('Louvre', 'Bezoek aan het museum en verschillende topstukken uit de kunstgeschiedenis.') };
    }
    if (group.program[1]?.items?.length) {
      group.program[1].title = 'Disneyland Paris (groepen samen)';
      group.program[1].items[0] = { ...group.program[1].items[0], title: 'Hele dag — Disneyland Paris', text: 'Groep A en Groep B bezoeken samen Disneyland Paris met de nieuwe "World of Frozen". We sluiten deze dag uiteraard af met de sprookjesachtige en indrukwekkende vuurwerkshow!' };
    }
    if (group.program[3]) {
      group.program[3].title = 'Montmartre, Sacré-Cœur en terugreis';
      group.program[3].items = [
        { title: 'Ochtend — Montmartre en Sacré-Cœur', text: 'Groep A en Groep B bezoeken in de ochtend Montmartre en de Basilique du Sacré-Cœur.', image: guessPhoto('Montmartre', 'Montmartre en Sacré-Cœur'), moreInfo: attractionInfo('Montmartre', 'Montmartre en Sacré-Cœur') },
        { title: 'Later — terugreis', text: 'Vertrek uit Parijs en terugreis naar huis.', image: '', moreInfo: '' }
      ];
    }
    group.rooms = Array.isArray(group.rooms) ? group.rooms.map(room => ({
      id: room.id || uid(),
      name: room.name || 'Kamer',
      students: room.students || '',
      note: room.note || ''
    })) : fallback.rooms;
    group.spots = (Array.isArray(group.spots) && group.spots.length ? group.spots : fallback.spots)
      .filter(spot => {
        const name = String(spot?.name || '').toLowerCase();
        const note = String(spot?.note || '').toLowerCase();
        return !name.includes('(hotel)') && note !== 'hotel / uitvalsbasis';
      })
      .map(spot => {
        const normalizedSpot = normalizeSpot(spot, group.hotel);
        const lowerName = String(normalizedSpot.name || '').toLowerCase();
        if (lowerName.includes('disney')) normalizedSpot.note = 'Dinsdag hele dag (groepen samen)';
        if (groupKey === 'B' && lowerName.includes('eiffel')) normalizedSpot.note = 'Woensdag ochtend';
        if (groupKey === 'B' && lowerName.includes('louvre')) normalizedSpot.note = 'Woensdag middag';
        if (groupKey === 'A' && lowerName.includes('eiffel')) normalizedSpot.note = 'Woensdag middag';
        if (groupKey === 'A' && lowerName.includes('louvre')) normalizedSpot.note = 'Woensdag ochtend';
        if (lowerName.includes('montmartre')) normalizedSpot.note = 'Donderdag ochtend';
        if (lowerName.includes('sacré-cœur') || lowerName.includes('sacre')) normalizedSpot.note = 'Donderdag ochtend';
        return normalizedSpot;
      });
    groups[groupKey] = group;
  });

  return {
    shared: {
      departure: (!shared.departure || shared.departure === '2026-04-13T07:00') ? defaults.shared.departure : shared.departure,
      instagramProfile: shared.instagramProfile || defaults.shared.instagramProfile,
      announcements: Array.isArray(shared.announcements) ? shared.announcements.map(item => ({
        id: item.id || uid(),
        title: item.title || 'Mededeling',
        text: item.text || '',
        type: item.type === 'urgent' ? 'urgent' : 'info',
        link: item.link || ''
      })) : defaults.shared.announcements,
      instagramLinks: Array.isArray(shared.instagramLinks) && shared.instagramLinks.length ? shared.instagramLinks.map(item => ({
        id: item.id || uid(),
        title: item.title || 'Instagram update',
        url: item.url || ''
      })) : defaults.shared.instagramLinks,
      practical: {
        travel: Array.isArray(shared.practical?.travel) ? shared.practical.travel : defaults.shared.practical.travel,
        moneyInsurance: Array.isArray(shared.practical?.moneyInsurance) ? shared.practical.moneyInsurance : defaults.shared.practical.moneyInsurance,
        packing: Array.isArray(shared.practical?.packing) ? shared.practical.packing : defaults.shared.practical.packing,
        bus: Array.isArray(shared.practical?.bus) ? shared.practical.bus : defaults.shared.practical.bus,
        agreements: Array.isArray(shared.practical?.agreements) ? (shared.practical.agreements.includes('Geluidsboxen zijn niet toegestaan.') ? shared.practical.agreements : [...shared.practical.agreements, 'Geluidsboxen zijn niet toegestaan.']) : defaults.shared.practical.agreements
      }
    },
    groups
  };
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function initDb() {
  await run('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  const row = await get('SELECT value FROM settings WHERE key = ?', ['siteData']);
  if (!row) {
    await run('INSERT INTO settings(key, value) VALUES(?, ?)', ['siteData', JSON.stringify(defaultData())]);
  } else {
    const normalized = normalizeData(JSON.parse(row.value));
    await run('UPDATE settings SET value = ? WHERE key = ?', [JSON.stringify(normalized), 'siteData']);
  }
}

async function readData() {
  const row = await get('SELECT value FROM settings WHERE key = ?', ['siteData']);
  return normalizeData(JSON.parse(row.value));
}

async function writeData(data) {
  await run('UPDATE settings SET value = ? WHERE key = ?', [JSON.stringify(normalizeData(data)), 'siteData']);
}

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'Niet ingelogd' });
}

app.set('trust proxy', 1);
app.use(express.json({ limit: '8mb' }));
app.use(session({
  store: new SQLiteStore({ db: 'app.db', dir: DATA_DIR }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8
  }
}));

app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/site-data', async (req, res) => {
  try {
    res.json(await readData());
  } catch {
    res.status(500).json({ error: 'Kon data niet laden' });
  }
});

app.get('/api/auth/status', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Onjuiste inloggegevens' });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.post('/api/site-data', requireAuth, async (req, res) => {
  try {
    const nextData = req.body;
    if (!nextData || !nextData.shared || !nextData.groups || !nextData.groups.A || !nextData.groups.B) {
      return res.status(400).json({ error: 'Ongeldige data' });
    }
    await writeData(nextData);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Kon data niet opslaan' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

initDb().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch(error => {
  console.error(error);
  process.exit(1);
});
