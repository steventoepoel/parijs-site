
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

function uid() { return Math.random().toString(36).slice(2, 10); }

const DEFAULT_PHOTOS = {
  'arc de triomphe': '/assets/photos/arc.jpg',
  'disneyland': '/assets/photos/disney.jpg',
  'disneyland paris': '/assets/photos/disney.jpg',
  'louvre': '/assets/photos/louvre.jpg',
  'eiffeltoren': '/assets/photos/eiffel.jpg',
  'sacré-cœur': '/assets/photos/sacrecoeur.jpg',
  'sacre-coeur': '/assets/photos/sacrecoeur.jpg',
  'sacre coeur': '/assets/photos/sacrecoeur.jpg',
  'montmartre': '/assets/photos/montmartre.jpg'
};

const DEFAULT_COORDS = {
  'generator paris (hotel)': [48.8786, 2.3707],
  'the people paris marais (hotel)': [48.8517, 2.3652],
  'arc de triomphe': [48.8738, 2.2950],
  'seine boottocht': [48.8623, 2.2877],
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

function dayItem(title, text, image = '') {
  return { title, text, image: image || guessPhoto(title, text) };
}

function defaultSpots(hotelName) {
  return [
    { id: uid(), name: `${hotelName} (hotel)`, note: 'Hotel / uitvalsbasis', coords: DEFAULT_COORDS[`${hotelName.toLowerCase()} (hotel)`] || [48.8786, 2.3707] },
    { id: uid(), name: 'Arc de Triomphe', note: 'Maandag middag', coords: DEFAULT_COORDS['arc de triomphe'] },
    { id: uid(), name: 'Seine boottocht', note: 'Maandag avond', coords: DEFAULT_COORDS['seine boottocht'] },
    { id: uid(), name: 'Disneyland Paris', note: 'Dinsdag hele dag', coords: DEFAULT_COORDS['disneyland paris'] },
    { id: uid(), name: 'Louvre', note: 'Woensdag ochtend', coords: DEFAULT_COORDS['louvre'] },
    { id: uid(), name: 'Eiffeltoren', note: 'Woensdag middag', coords: DEFAULT_COORDS['eiffeltoren'] },
    { id: uid(), name: 'Montmartre', note: 'Donderdag ochtend', coords: DEFAULT_COORDS['montmartre'] },
    { id: uid(), name: 'Sacré-Cœur', note: 'Donderdag middag', coords: DEFAULT_COORDS['sacré-cœur'] }
  ];
}

function defaultProgramA() {
  return [
    {
      id: uid(), dayShort: 'Ma', dayLabel: 'Dag 1', title: 'Vertrek, aankomst Parijs, Arc de Triomphe en bootreis',
      items: [
        dayItem('Ochtend — vertrek & aankomst', 'Verzamelen, vertrek met school en aankomst in Parijs. Daarna naar het hotel.'),
        dayItem('Middag — Arc de Triomphe', 'Bezoek aan de Arc de Triomphe en omgeving.'),
        dayItem('Avond — vaartocht over de Seine', 'Boottocht langs de bekendste plekken van Parijs.')
      ]
    },
    { id: uid(), dayShort: 'Di', dayLabel: 'Dag 2', title: 'Disneyland Paris', items: [dayItem('Hele dag — Disney', 'Een volledige dag in Disneyland Paris.')] },
    {
      id: uid(), dayShort: 'Wo', dayLabel: 'Dag 3', title: 'Louvre, Eiffeltoren en vrije tijd',
      items: [
        dayItem('Ochtend — Louvre', 'Bezoek aan het museum.'),
        dayItem('Middag — Eiffeltoren', 'Bezoek aan de Eiffeltoren.'),
        dayItem('Later — vrije tijd', 'Vrije tijd volgens de groepsafspraken.')
      ]
    },
    {
      id: uid(), dayShort: 'Do', dayLabel: 'Dag 4', title: 'Montmartre, Sacré-Cœur en terugreis',
      items: [
        dayItem('Ochtend — Montmartre', 'Wandeling door Montmartre.'),
        dayItem('Middag — Sacré-Cœur', 'Bezoek aan de basiliek.'),
        dayItem('Later — terugreis', 'Vertrek uit Parijs en terugreis naar huis.')
      ]
    }
  ];
}

function defaultProgramB() {
  return [
    {
      id: uid(), dayShort: 'Ma', dayLabel: 'Dag 1', title: 'Vertrek, aankomst Parijs, Arc de Triomphe en bootreis',
      items: [
        dayItem('Ochtend — vertrek & aankomst', 'Verzamelen, vertrek en aankomst in Parijs. Daarna richting hotel.'),
        dayItem('Middag — Arc de Triomphe', 'Gezamenlijk bezoek met leiding.'),
        dayItem('Avond — vaartocht over de Seine', 'Boottocht met de groep.')
      ]
    },
    { id: uid(), dayShort: 'Di', dayLabel: 'Dag 2', title: 'Disneyland Paris', items: [dayItem('Hele dag — Disney', 'Volledige dag Disneyland Paris.')] },
    {
      id: uid(), dayShort: 'Wo', dayLabel: 'Dag 3', title: 'Louvre, Eiffeltoren en vrije tijd',
      items: [
        dayItem('Ochtend — Louvre', 'Cultureel bezoek aan het Louvre.'),
        dayItem('Middag — Eiffeltoren', 'Bezoek en fotomoment.'),
        dayItem('Later — vrije tijd', 'Vrije tijd volgens de afspraken van groep B.')
      ]
    },
    {
      id: uid(), dayShort: 'Do', dayLabel: 'Dag 4', title: 'Montmartre, Sacré-Cœur en terugreis',
      items: [
        dayItem('Ochtend — Montmartre', 'Wandeling door de wijk.'),
        dayItem('Middag — Sacré-Cœur', 'Bezoek aan de basiliek en uitzichtpunt.'),
        dayItem('Later — terugreis', 'Vertrek naar huis.')
      ]
    }
  ];
}

function defaultData() {
  return {
    shared: {
      departure: '2026-04-13T07:00',
      instagramProfile: 'https://www.instagram.com/develsteincollegezwijndrecht/',
      announcements: [
        { id: uid(), title: 'Controleer je ID of paspoort', text: 'Neem op de dag van vertrek een geldig identiteitsbewijs mee. Zonder ID kun je niet mee op reis.', type: 'urgent', link: '' }
      ],
      instagramLinks: [],
      practical: {
        travel: [
          'Bestemming: Parijs, Frankrijk',
          'Reisduur: maandag t/m donderdag',
          'Vervoer: bus of trein, volgens de afspraken van school'
        ],
        packing: [
          'Geldig paspoort of ID-kaart',
          'Kleding voor meerdere dagen',
          'Comfortabele schoenen',
          'Oplader en powerbank',
          'Blijf bereikbaar en kom op tijd bij verzamelpunten'
        ]
      }
    },
    groups: {
      A: {
        label: 'Groep A', hotel: 'Generator Paris', leiding: 'Mevr. Jansen, Dhr. Bakker',
        program: defaultProgramA(),
        rooms: [
          { id: uid(), name: 'Kamer 201', students: 'Emma, Noor, Mila', note: 'Dicht bij de trap' },
          { id: uid(), name: 'Kamer 202', students: 'Daan, Sem, Lucas', note: '' }
        ],
        spots: defaultSpots('Generator Paris')
      },
      B: {
        label: 'Groep B', hotel: 'The People Paris Marais', leiding: 'Mevr. De Vries, Dhr. Smit',
        program: defaultProgramB(),
        rooms: [
          { id: uid(), name: 'Kamer 301', students: 'Sara, Lotte, Yara', note: '' },
          { id: uid(), name: 'Kamer 302', students: 'Finn, Milan, Ties', note: 'Naast begeleiderskamer' }
        ],
        spots: defaultSpots('The People Paris Marais')
      }
    }
  };
}

function normalizeSpot(spot, hotelName) {
  if (!spot) return null;
  const name = spot.name || 'Locatie';
  const key = name.toLowerCase();
  let coords = Array.isArray(spot.coords) && spot.coords.length === 2 ? spot.coords : null;
  if (!coords) {
    if (key.includes('(hotel)')) coords = DEFAULT_COORDS[`${hotelName.toLowerCase()} (hotel)`] || [48.8786, 2.3707];
    else coords = DEFAULT_COORDS[key] || [48.8606, 2.3376];
  }
  return { id: spot.id || uid(), name, note: spot.note || '', coords: [Number(coords[0]), Number(coords[1])] };
}

function normalizeProgram(program, fallbackProgram) {
  const source = Array.isArray(program) && program.length ? program : fallbackProgram;
  return source.map((day, idx) => ({
    id: day.id || uid(),
    dayShort: day.dayShort || fallbackProgram[idx]?.dayShort || 'Dag',
    dayLabel: day.dayLabel || fallbackProgram[idx]?.dayLabel || `Dag ${idx + 1}`,
    title: day.title || fallbackProgram[idx]?.title || `Dag ${idx + 1}`,
    items: Array.isArray(day.items) ? day.items.map(item => ({
      title: item.title || 'Onderdeel',
      text: item.text || '',
      image: item.image || guessPhoto(item.title, item.text)
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
    group.label = group.label || `Groep ${groupKey}`;
    group.hotel = group.hotel || fallback.hotel;
    group.leiding = group.leiding || fallback.leiding;
    group.program = normalizeProgram(group.program, fallback.program);
    group.rooms = Array.isArray(group.rooms) ? group.rooms.map(room => ({
      id: room.id || uid(),
      name: room.name || 'Kamer',
      students: room.students || '',
      note: room.note || ''
    })) : fallback.rooms;
    group.spots = (Array.isArray(group.spots) && group.spots.length ? group.spots : fallback.spots)
      .map(spot => normalizeSpot(spot, group.hotel));
  });

  return {
    shared: {
      departure: shared.departure || defaults.shared.departure,
      instagramProfile: shared.instagramProfile || defaults.shared.instagramProfile,
      announcements: Array.isArray(shared.announcements) ? shared.announcements : defaults.shared.announcements,
      instagramLinks: Array.isArray(shared.instagramLinks) ? shared.instagramLinks : defaults.shared.instagramLinks,
      practical: {
        travel: Array.isArray(shared.practical?.travel) ? shared.practical.travel : defaults.shared.practical.travel,
        packing: Array.isArray(shared.practical?.packing) ? shared.practical.packing : defaults.shared.practical.packing
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
  await run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
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
app.use(express.json({ limit: '4mb' }));
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
  try { res.json(await readData()); }
  catch { res.status(500).json({ error: 'Kon data niet laden' }); }
});
app.get('/api/auth/status', (req, res) => res.json({ authenticated: !!(req.session && req.session.authenticated) }));
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Onjuiste inloggegevens' });
});
app.post('/api/auth/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));
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

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

initDb().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
