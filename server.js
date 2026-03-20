const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-this-password-now';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-session-secret-now';
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'site-data.json');

function id() { return Math.random().toString(36).slice(2, 10); }
function defaultSpots(hotelName) {
  const hotel = hotelName === 'The People Paris Marais' ? [48.8517, 2.3652] : [48.8786, 2.3707];
  return [
    { name: `${hotelName} (hotel)`, coords: hotel, note: 'Hotel / uitvalsbasis', x: 58, y: 36 },
    { name: 'Arc de Triomphe', coords: [48.8738, 2.2950], note: 'Maandag middag', x: 28, y: 28 },
    { name: 'Seine boottocht', coords: [48.8623, 2.2877], note: 'Maandag avond', x: 36, y: 47 },
    { name: 'Disneyland Paris', coords: [48.8706, 2.7797], note: 'Dinsdag hele dag', x: 90, y: 40 },
    { name: 'Louvre', coords: [48.8606, 2.3376], note: 'Woensdag ochtend', x: 47, y: 42 },
    { name: 'Eiffeltoren', coords: [48.8584, 2.2945], note: 'Woensdag middag', x: 31, y: 52 },
    { name: 'Montmartre', coords: [48.8867, 2.3431], note: 'Donderdag ochtend', x: 48, y: 18 },
    { name: 'Sacré-Cœur', coords: [48.8867, 2.3431], note: 'Donderdag middag', x: 50, y: 15 }
  ];
}
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DATA_FILE)) return;
  const defaults = {
    shared: {
      departure: '2026-04-13T07:00',
      announcements: [
        { id: id(), title: 'Controleer je ID of paspoort', text: 'Neem op de dag van vertrek een geldig identiteitsbewijs mee. Zonder ID kun je niet mee op reis.', type: 'urgent', link: '' }
      ],
      instagram: [ { id: id(), title: 'School Instagram', url: 'https://www.instagram.com/' } ]
    },
    groups: {
      A: {
        label: 'Groep A', hotel: 'Generator Paris', leiding: 'Mevr. Jansen, Dhr. Bakker',
        program: [
          { id: id(), dayShort: 'Ma', dayLabel: 'Dag 1', title: 'Vertrek, aankomst Parijs, Arc de Triomphe en bootreis', items: [
            { title: 'Ochtend — vertrek & aankomst', text: 'Verzamelen, vertrek met school en aankomst in Parijs. Daarna naar het hotel.' },
            { title: 'Middag — Arc de Triomphe', text: 'Bezoek aan de Arc de Triomphe en omgeving.' },
            { title: 'Avond — vaartocht over de Seine', text: 'Boottocht langs de bekendste plekken van Parijs.' }
          ]},
          { id: id(), dayShort: 'Di', dayLabel: 'Dag 2', title: 'Disneyland Paris', items: [ { title: 'Hele dag — Disney', text: 'Een volledige dag in Disneyland Paris.' } ] },
          { id: id(), dayShort: 'Wo', dayLabel: 'Dag 3', title: 'Louvre, Eiffeltoren en vrije tijd', items: [
            { title: 'Ochtend — Louvre', text: 'Bezoek aan het museum.' },
            { title: 'Middag — Eiffeltoren', text: 'Bezoek aan de Eiffeltoren.' },
            { title: 'Later — vrije tijd', text: 'Vrije tijd volgens de groepsafspraken.' }
          ]},
          { id: id(), dayShort: 'Do', dayLabel: 'Dag 4', title: 'Montmartre, Sacré-Cœur en terugreis', items: [
            { title: 'Ochtend — Montmartre', text: 'Wandeling door Montmartre.' },
            { title: 'Middag — Sacré-Cœur', text: 'Bezoek aan de basiliek.' },
            { title: 'Later — terugreis', text: 'Vertrek uit Parijs en terugreis naar huis.' }
          ]}
        ],
        rooms: [ { id: id(), name: 'Kamer 201', students: 'Emma, Noor, Mila', note: 'Dicht bij de trap' }, { id: id(), name: 'Kamer 202', students: 'Daan, Sem, Lucas', note: '' } ],
        spots: defaultSpots('Generator Paris')
      },
      B: {
        label: 'Groep B', hotel: 'The People Paris Marais', leiding: 'Mevr. De Vries, Dhr. Smit',
        program: [
          { id: id(), dayShort: 'Ma', dayLabel: 'Dag 1', title: 'Vertrek, aankomst Parijs, Arc de Triomphe en bootreis', items: [
            { title: 'Ochtend — vertrek & aankomst', text: 'Verzamelen, vertrek en aankomst in Parijs. Daarna richting hotel.' },
            { title: 'Middag — Arc de Triomphe', text: 'Gezamenlijk bezoek met leiding.' },
            { title: 'Avond — vaartocht over de Seine', text: 'Boottocht met de groep.' }
          ]},
          { id: id(), dayShort: 'Di', dayLabel: 'Dag 2', title: 'Disneyland Paris', items: [ { title: 'Hele dag — Disney', text: 'Volledige dag Disneyland Paris.' } ] },
          { id: id(), dayShort: 'Wo', dayLabel: 'Dag 3', title: 'Louvre, Eiffeltoren en vrije tijd', items: [
            { title: 'Ochtend — Louvre', text: 'Cultureel bezoek aan het Louvre.' },
            { title: 'Middag — Eiffeltoren', text: 'Bezoek en fotomoment.' },
            { title: 'Later — vrije tijd', text: 'Vrije tijd volgens de afspraken van groep B.' }
          ]},
          { id: id(), dayShort: 'Do', dayLabel: 'Dag 4', title: 'Montmartre, Sacré-Cœur en terugreis', items: [
            { title: 'Ochtend — Montmartre', text: 'Wandeling door de wijk.' },
            { title: 'Middag — Sacré-Cœur', text: 'Bezoek aan de basiliek en uitzichtpunt.' },
            { title: 'Later — terugreis', text: 'Vertrek naar huis.' }
          ]}
        ],
        rooms: [ { id: id(), name: 'Kamer 301', students: 'Sara, Lotte, Yara', note: '' }, { id: id(), name: 'Kamer 302', students: 'Finn, Milan, Ties', note: 'Naast begeleiderskamer' } ],
        spots: defaultSpots('The People Paris Marais')
      }
    }
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaults, null, 2));
}
function readData() { ensureDataFile(); return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function writeData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
function requireAuth(req, res, next) { if (req.session && req.session.authenticated) return next(); res.status(401).json({ error: 'Niet ingelogd' }); }

ensureDataFile();
app.use(express.json({ limit: '1mb' }));
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 1000 * 60 * 60 * 8 } }));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/site-data', (req, res) => res.json(readData()));
app.get('/api/auth/status', (req, res) => res.json({ authenticated: !!(req.session && req.session.authenticated) }));
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) { req.session.authenticated = true; return res.json({ ok: true }); }
  res.status(401).json({ error: 'Onjuiste inloggegevens' });
});
app.post('/api/auth/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.post('/api/site-data', requireAuth, (req, res) => {
  const nextData = req.body;
  if (!nextData || !nextData.shared || !nextData.groups || !nextData.groups.A || !nextData.groups.B) return res.status(400).json({ error: 'Ongeldige data' });
  writeData(nextData); res.json({ ok: true });
});
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
