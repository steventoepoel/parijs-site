
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStoreFactory = require('connect-sqlite3');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const webpush = require('web-push');
let PgClient = null;
try { PgClient = require('pg').Client; } catch (_) {}

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-this-password-now';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-session-secret-now';
const DATABASE_URL = process.env.DATABASE_URL || '';
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'app.db');
const UPLOAD_DIR = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(__dirname, 'public', 'uploads');
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 8);

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const SQLiteStore = SQLiteStoreFactory(session);
const sqliteDb = !DATABASE_URL ? new sqlite3.Database(DB_FILE) : null;
let pg = null;

const hasWebPushConfig = !!(process.env.VAPID_SUBJECT && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
if (hasWebPushConfig) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const DEFAULT_PHOTOS = {
  'arc de triomphe': '/assets/photos/arc.jpg',
  'disneyland': '/assets/photos/disney.jpg',
  'disneyland paris': '/assets/photos/disney.jpg',
  'louvre': '/assets/photos/louvre.jpg',
  'eiffeltoren': '/assets/photos/eiffel.jpg',
  'sacré-cœur': '/assets/photos/sacrecoeur.jpg',
  'sacre-coeur': '/assets/photos/sacrecoeur.jpg',
  'sacre coeur': '/assets/photos/sacrecoeur.jpg',
  'montmartre': '/assets/photos/montmartre.jpg',
  'parijs': '/assets/photos/arc.jpg'
};

const DEFAULT_COORDS = {
  'generator paris (hotel)': [48.8786, 2.3707],
  'the people paris marais (hotel)': [48.8517, 2.3652],
  'develpark': [51.8296, 4.6484],
  'parijs': [48.8566, 2.3522],
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
    { id: uid(), name: 'Arc de Triomphe', note: 'Programma dag 1', coords: DEFAULT_COORDS['arc de triomphe'] },
    { id: uid(), name: 'Seine boottocht', note: 'Avondactiviteit', coords: DEFAULT_COORDS['seine boottocht'] },
    { id: uid(), name: 'Disneyland Paris', note: 'Programma dag 2', coords: DEFAULT_COORDS['disneyland paris'] },
    { id: uid(), name: 'Louvre', note: 'Programma dag 3', coords: DEFAULT_COORDS['louvre'] },
    { id: uid(), name: 'Eiffeltoren', note: 'Programma dag 3', coords: DEFAULT_COORDS['eiffeltoren'] },
    { id: uid(), name: 'Montmartre', note: 'Programma dag 4', coords: DEFAULT_COORDS['montmartre'] },
    { id: uid(), name: 'Sacré-Cœur', note: 'Programma dag 4', coords: DEFAULT_COORDS['sacré-cœur'] }
  ];
}

function defaultProgram() {
  return [
    {
      id: uid(), dayShort: 'Ma', dayLabel: 'Dag 1', title: 'Verzamelen, vertrek en aankomst in Parijs',
      items: [
        dayItem('Vertrek', 'Verzamelen en vertrek in het Develpark en aankomst in Parijs. Daarna naar het hotel.'),
        dayItem('Inchecken hotel', 'Na aankomst gaan we naar het hotel en volgen de eerste groepsafspraken.'),
        dayItem('Avond', 'Rustig opstarten en voorbereiden op het programma van de volgende dag.')
      ]
    },
    {
      id: uid(), dayShort: 'Di', dayLabel: 'Dag 2', title: 'Disneyland Paris',
      items: [dayItem('Hele dag — Disney', 'Een volledige dag in Disneyland Paris met de eigen groep.')]
    },
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

function defaultData() {
  return {
    shared: {
      departure: '2026-04-13T07:00',
      instagramProfile: 'https://www.instagram.com/develsteincollegezwijndrecht/',
      announcements: [
        {
          id: uid(),
          title: 'Controleer je ID en borg',
          text: 'Neem op de dag van vertrek een geldig identiteitsbewijs en een envelop met daar in 20 euro borg mee. Zonder ID kun je niet mee op reis.',
          type: 'urgent',
          link: ''
        }
      ],
      practical: {
        travel: [
          'Bestemming: Parijs, Frankrijk',
          'Verzamelen en vertrek in het Develpark',
          'Reisduur: maandag t/m donderdag',
          'Volg tijdens de reis altijd de aanwijzingen van de leiding'
        ],
        packing: [
          'Geldig identiteitsbewijs',
          'Een envelop met 20 euro borg',
          'Kleding voor meerdere dagen',
          'Comfortabele schoenen',
          'Telefoon, oplader en eventueel een powerbank'
        ]
      }
    },
    groups: {
      A: {
        label: 'Groep A',
        hotel: 'Generator Paris',
        leiding: ['Mevr. Brandsma', 'Dhr. Franken', 'Mevr. Meeder', 'Dhr. Toepoel'],
        program: defaultProgram(),
        rooms: [
          { id: uid(), name: 'Kamer 201', students: 'Nog in te vullen', note: '' },
          { id: uid(), name: 'Kamer 202', students: 'Nog in te vullen', note: '' }
        ],
        spots: defaultSpots('Generator Paris')
      },
      B: {
        label: 'Groep B',
        hotel: 'The People Paris Marais',
        leiding: ['Mevr. Jansen', 'Dhr. Meijer', 'Mevr. Pauw', 'Dhr. Scholtes'],
        program: defaultProgram(),
        rooms: [
          { id: uid(), name: 'Kamer 301', students: 'Nog in te vullen', note: '' },
          { id: uid(), name: 'Kamer 302', students: 'Nog in te vullen', note: '' }
        ],
        spots: defaultSpots('The People Paris Marais')
      }
    }
  };
}

function defaultChecklist() {
  return {
    A: [
      { id: uid(), label: 'ID-kaart of paspoort mee', checked: false, position: 1 },
      { id: uid(), label: 'Envelop met 20 euro borg mee', checked: false, position: 2 },
      { id: uid(), label: 'Oplader en powerbank ingepakt', checked: false, position: 3 }
    ],
    B: [
      { id: uid(), label: 'ID-kaart of paspoort mee', checked: false, position: 1 },
      { id: uid(), label: 'Envelop met 20 euro borg mee', checked: false, position: 2 },
      { id: uid(), label: 'Oplader en powerbank ingepakt', checked: false, position: 3 }
    ]
  };
}

function defaultFeed() {
  return [
    { id: uid(), title: 'Welkom in de reisfeed', text: 'Docenten kunnen hier updates delen tijdens de reis, met maximaal 1 foto per update.', groupKey: 'ALL', imageUrl: '', author: 'Team reisleiding', createdAt: new Date().toISOString() }
  ];
}

function normalizeSpot(spot, hotelName) {
  if (!spot) return null;
  const name = spot.name || 'Locatie';
  const key = name.toLowerCase();
  let coords = Array.isArray(spot.coords) && spot.coords.length === 2 ? spot.coords : null;
  if (!coords) {
    if (key.includes('(hotel)')) coords = DEFAULT_COORDS[`${hotelName.toLowerCase()} (hotel)`] || [48.8786, 2.3707];
    else coords = DEFAULT_COORDS[key] || [48.8566, 2.3522];
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
    items: Array.isArray(day.items) && day.items.length ? day.items.map(item => ({
      title: item.title || 'Onderdeel',
      text: item.text || '',
      image: item.image || guessPhoto(item.title, item.text)
    })) : fallbackProgram[idx]?.items || []
  }));
}

function normalizeLeiding(leiding) {
  if (Array.isArray(leiding)) return leiding.filter(Boolean);
  if (!leiding) return [];
  return String(leiding).split(/\n|,/).map(v => v.trim()).filter(Boolean);
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
    group.leiding = normalizeLeiding(group.leiding).length ? normalizeLeiding(group.leiding) : fallback.leiding;
    group.program = normalizeProgram(group.program, fallback.program);
    group.rooms = Array.isArray(group.rooms) && group.rooms.length ? group.rooms.map(room => ({
      id: room.id || uid(),
      name: room.name || 'Kamer',
      students: room.students || '',
      note: room.note || ''
    })) : fallback.rooms;
    group.spots = (Array.isArray(group.spots) && group.spots.length ? group.spots : fallback.spots)
      .map(spot => normalizeSpot(spot, group.hotel))
      .filter(Boolean);
    groups[groupKey] = group;
  });

  return {
    shared: {
      departure: shared.departure || defaults.shared.departure,
      instagramProfile: shared.instagramProfile || defaults.shared.instagramProfile,
      announcements: Array.isArray(shared.announcements) && shared.announcements.length ? shared.announcements.map(item => ({
        id: item.id || uid(),
        title: item.title || 'Mededeling',
        text: item.text || '',
        type: item.type || 'info',
        link: item.link || ''
      })) : defaults.shared.announcements,
      practical: {
        travel: Array.isArray(shared.practical?.travel) && shared.practical.travel.length ? shared.practical.travel : defaults.shared.practical.travel,
        packing: Array.isArray(shared.practical?.packing) && shared.practical.packing.length ? shared.practical.packing : defaults.shared.practical.packing
      }
    },
    groups
  };
}

function normalizeChecklist(items) {
  const defaults = defaultChecklist();
  const grouped = { A: [], B: [] };
  if (items && typeof items === 'object') {
    for (const key of ['A', 'B']) {
      const src = Array.isArray(items[key]) && items[key].length ? items[key] : defaults[key];
      grouped[key] = src.map((item, idx) => ({ id: item.id || uid(), label: item.label || 'Checklist-item', checked: !!item.checked, position: Number(item.position || idx + 1) }));
    }
  } else {
    return defaults;
  }
  return grouped;
}

function normalizeFeed(items) {
  const src = Array.isArray(items) && items.length ? items : defaultFeed();
  return src.map(item => ({
    id: item.id || uid(),
    title: item.title || 'Update',
    text: item.text || '',
    imageUrl: item.imageUrl || '',
    author: item.author || 'Reisleiding',
    groupKey: ['A', 'B', 'ALL'].includes(item.groupKey) ? item.groupKey : 'ALL',
    createdAt: item.createdAt || new Date().toISOString()
  })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function dbRun(sql, params = []) {
  if (pg) {
    return pg.query(sql, params);
  }
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function dbGet(sql, params = []) {
  if (pg) {
    const result = await pg.query(sql, params);
    return result.rows[0] || null;
  }
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => err ? reject(err) : resolve(row || null));
  });
}

async function dbAll(sql, params = []) {
  if (pg) {
    const result = await pg.query(sql, params);
    return result.rows;
  }
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []));
  });
}

async function ensureSetting(key, value) {
  if (pg) {
    await dbRun('INSERT INTO settings(key, value) VALUES($1, $2) ON CONFLICT (key) DO NOTHING', [key, value]);
  } else {
    await dbRun('INSERT OR IGNORE INTO settings(key, value) VALUES(?, ?)', [key, value]);
  }
}

async function initDb() {
  if (DATABASE_URL) {
    if (!PgClient) throw new Error('pg dependency ontbreekt maar DATABASE_URL is ingesteld.');
    pg = new PgClient({ connectionString: DATABASE_URL, ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false } });
    await pg.connect();
    await dbRun('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  } else {
    await dbRun('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  }
  await ensureSetting('siteData', JSON.stringify(defaultData()));
  await ensureSetting('checklistData', JSON.stringify(defaultChecklist()));
  await ensureSetting('feedData', JSON.stringify(defaultFeed()));
  await ensureSetting('pushSubscriptions', JSON.stringify([]));

  const siteRow = await dbGet(pg ? 'SELECT value FROM settings WHERE key = $1' : 'SELECT value FROM settings WHERE key = ?', ['siteData']);
  await dbRun(pg ? 'UPDATE settings SET value = $1 WHERE key = $2' : 'UPDATE settings SET value = ? WHERE key = ?', [JSON.stringify(normalizeData(JSON.parse(siteRow.value))), 'siteData']);

  const checklistRow = await dbGet(pg ? 'SELECT value FROM settings WHERE key = $1' : 'SELECT value FROM settings WHERE key = ?', ['checklistData']);
  await dbRun(pg ? 'UPDATE settings SET value = $1 WHERE key = $2' : 'UPDATE settings SET value = ? WHERE key = ?', [JSON.stringify(normalizeChecklist(JSON.parse(checklistRow.value))), 'checklistData']);

  const feedRow = await dbGet(pg ? 'SELECT value FROM settings WHERE key = $1' : 'SELECT value FROM settings WHERE key = ?', ['feedData']);
  await dbRun(pg ? 'UPDATE settings SET value = $1 WHERE key = $2' : 'UPDATE settings SET value = ? WHERE key = ?', [JSON.stringify(normalizeFeed(JSON.parse(feedRow.value))), 'feedData']);
}

async function readSetting(key) {
  const row = await dbGet(pg ? 'SELECT value FROM settings WHERE key = $1' : 'SELECT value FROM settings WHERE key = ?', [key]);
  return row ? JSON.parse(row.value) : null;
}

async function writeSetting(key, value) {
  if (pg) {
    await dbRun('UPDATE settings SET value = $1 WHERE key = $2', [JSON.stringify(value), key]);
  } else {
    await dbRun('UPDATE settings SET value = ? WHERE key = ?', [JSON.stringify(value), key]);
  }
}

async function readData() { return normalizeData(await readSetting('siteData')); }
async function writeData(data) { await writeSetting('siteData', normalizeData(data)); }
async function readChecklist() { return normalizeChecklist(await readSetting('checklistData')); }
async function writeChecklist(data) { await writeSetting('checklistData', normalizeChecklist(data)); }
async function readFeed() { return normalizeFeed(await readSetting('feedData')); }
async function writeFeed(data) { await writeSetting('feedData', normalizeFeed(data)); }
async function readPushSubscriptions() { return await readSetting('pushSubscriptions') || []; }
async function writePushSubscriptions(data) { await writeSetting('pushSubscriptions', data); }

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'Niet ingelogd' });
}

const uploadStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${uid()}${ext}`);
  }
});
const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) return cb(new Error('Alleen afbeeldingen zijn toegestaan'));
    cb(null, true);
  }
});

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));
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

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Te veel loginpogingen. Probeer het later opnieuw.' } });
const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false, message: { error: 'Te veel verzoeken. Probeer het zo opnieuw.' } });

app.use('/api/auth', authLimiter);
app.use('/api', adminLimiter);
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/bootstrap', async (req, res) => {
  try {
    const [siteData, checklist, feed] = await Promise.all([readData(), readChecklist(), readFeed()]);
    res.json({ siteData, checklist, feed, auth: !!(req.session && req.session.authenticated), pushConfigured: hasWebPushConfig, vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kon data niet laden' });
  }
});

app.get('/api/site-data', async (req, res) => {
  try { res.json(await readData()); }
  catch { res.status(500).json({ error: 'Kon data niet laden' }); }
});

app.get('/api/checklist', async (req, res) => {
  try { res.json(await readChecklist()); }
  catch { res.status(500).json({ error: 'Kon checklist niet laden' }); }
});

app.post('/api/checklist', async (req, res) => {
  try {
    const data = normalizeChecklist(req.body || {});
    await writeChecklist(data);
    res.json({ ok: true, checklist: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kon checklist niet opslaan' });
  }
});

app.get('/api/feed', async (req, res) => {
  try { res.json(await readFeed()); }
  catch { res.status(500).json({ error: 'Kon updates niet laden' }); }
});

app.post('/api/feed', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const current = await readFeed();
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const item = {
      id: uid(),
      title: (req.body.title || 'Update').slice(0, 120),
      text: (req.body.text || '').slice(0, 2000),
      author: (req.body.author || 'Reisleiding').slice(0, 80),
      groupKey: ['A', 'B', 'ALL'].includes(req.body.groupKey) ? req.body.groupKey : 'ALL',
      imageUrl,
      createdAt: new Date().toISOString()
    };
    current.unshift(item);
    await writeFeed(current);
    const notifications = await readPushSubscriptions();
    if (hasWebPushConfig && notifications.length) {
      const payload = JSON.stringify({ title: item.title, body: item.text || 'Nieuwe update geplaatst', url: '/', image: item.imageUrl || undefined });
      const survivors = [];
      for (const subscription of notifications) {
        try {
          await webpush.sendNotification(subscription, payload);
          survivors.push(subscription);
        } catch (error) {
          if (![404, 410].includes(error.statusCode)) survivors.push(subscription);
        }
      }
      await writePushSubscriptions(survivors);
    }
    res.json({ ok: true, item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Kon update niet plaatsen' });
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kon data niet opslaan' });
  }
});

app.use((err, _req, res, next) => {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? `Foto is te groot (max ${MAX_UPLOAD_MB} MB)` : 'Upload mislukt' });
  }
  if (err && err.message) return res.status(400).json({ error: err.message });
  return res.status(500).json({ error: 'Onbekende fout bij uploaden' });
});

app.post('/api/push/subscribe', async (req, res) => {
  try {
    if (!req.body || !req.body.endpoint) return res.status(400).json({ error: 'Ongeldige subscription' });
    const current = await readPushSubscriptions();
    if (!current.some(item => item.endpoint === req.body.endpoint)) current.push(req.body);
    await writePushSubscriptions(current);
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kon push-subscription niet opslaan' });
  }
});

app.post('/api/push/test', requireAuth, async (req, res) => {
  try {
    if (!hasWebPushConfig) return res.status(400).json({ error: 'VAPID-configuratie ontbreekt' });
    const current = await readPushSubscriptions();
    const payload = JSON.stringify({ title: req.body?.title || 'Testmelding', body: req.body?.text || 'Dit is een testmelding vanuit het admin-paneel.', url: '/' });
    let sent = 0;
    const survivors = [];
    for (const subscription of current) {
      try {
        await webpush.sendNotification(subscription, payload);
        sent += 1;
        survivors.push(subscription);
      } catch (error) {
        if (![404, 410].includes(error.statusCode)) survivors.push(subscription);
      }
    }
    await writePushSubscriptions(survivors);
    res.json({ ok: true, sent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kon testmelding niet versturen' });
  }
});

app.get('/api/health', async (_, res) => {
  res.json({ ok: true, version: '0.11.0', database: DATABASE_URL ? 'postgres' : 'sqlite', uploads: UPLOAD_DIR, feedUploadMode: 'single-image', pushConfigured: hasWebPushConfig });
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
