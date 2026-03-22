
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
const uid = () => Math.random().toString(36).slice(2, 10);

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
  'seine boottocht': [48.857462306372966, 2.341009422467063],
  'disneyland paris': [48.8706, 2.7797],
  'louvre': [48.8606, 2.3376],
  'eiffeltoren': [48.8584, 2.2945],
  'montmartre': [48.8867, 2.3431],
  'sacré-cœur': [48.8867, 2.3431],
  'sacre-coeur': [48.8867, 2.3431]
};
const dayItem = (title, text, image = '', more = '') => ({ title, text, image: image || guessPhoto(title, text), more });
function guessPhoto(title = '', text = '') {
  const value = `${title} ${text}`.toLowerCase();
  for (const [key, photo] of Object.entries(DEFAULT_PHOTOS)) if (value.includes(key)) return photo;
  return '';
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

const MORE = {
  eiffel: 'De Eiffeltoren is hét symbool van Parijs en het meest bezochte monument ter wereld. De toren is 300 meter hoog maar kan in de winter tot wel 8 centimeter krimpen door de kou. Mocht je voor de trap kiezen om naar boven te gaan op Eiffeltoren, dan moet je maar liefst 1600 treden beklimmen.',
  arc: 'Napoleon gaf opdracht tot de bouw van deze triomfboog maar hij maakte de voltooiing zelf niet meer mee. Van de top heb je een mooi en veilig zicht op het drukste plein van Parijs, maar bekijk ook de prachtige reliëfs in de boog zelf.',
  montmartre: 'De bekende wijk Montmartre is een van de leukste wijken in Parijs. Het wordt ook wel de kunstenaarswijk van Parijs genoemd en het is heel goed terug te zien waarom. Deze wijk is namelijk een en al kunst. Let goed op straatverkopers en zakkenrollers, zeker bij de Sacré-Cœur.',
  sacre: 'Deze sneeuwwitte kerk wordt wel oneerbiedig de suikertaart genoemd. De buitenkant is zeer omstreden, maar binnenin zie je prachtige beelden en mozaïeken. Ook dit is weer een mooi uitzichtpunt want de kerk ligt op de heuvel Montmartre, het hoogste punt van Parijs.',
  louvre: 'In het Louvre, het meest bezochte museum ter wereld, ga je een aantal topstukken bekijken uit de kunstgeschiedenis. Een voorbeeld daarvan is de Mona Lisa van Leonardo Da Vinci. Het Louvre was oorspronkelijk een kasteel en alle galerijen samen zijn meer dan 60.000 m² groot.',
};

function defaultProgramA() {
  return [
    { id: uid(), dayShort: 'Maandag', dayLabel: 'Dag 1', title: 'Vertrek, aankomst Parijs, Arc de Triomphe en bootreis', items: [
      dayItem('Ochtend — vertrek & aankomst', 'Verzamelen en vertrek in het Develpark en aankomst in Parijs. Daarna naar het hotel.'),
      dayItem('Middag — Arc de Triomphe', 'Bezoek aan de Arc de Triomphe en omgeving.', '', MORE.arc),
      dayItem('Avond — varen over de Seine', 'Boottocht langs de bekendste plekken van Parijs.')
    ]},
    { id: uid(), dayShort: 'Dinsdag', dayLabel: 'Dag 2', title: 'Disneyland Paris', items: [dayItem('Hele dag — Disney', 'Een volledige dag in Disneyland Paris met de nieuwe "World of Frozen". We sluiten deze dag uiteraard af met de sprookjesachtige en indrukwekkende vuurwerkshow!')] },
    { id: uid(), dayShort: 'Woensdag', dayLabel: 'Dag 3', title: 'Louvre, Eiffeltoren en vrije tijd', items: [
      dayItem('Ochtend — Louvre', 'Bezoek aan het museum.', '', MORE.louvre),
      dayItem('Middag — Eiffeltoren', 'Bezoek aan de Eiffeltoren.', '', MORE.eiffel),
      dayItem('Later — vrije tijd', 'Vrije tijd volgens de groepsafspraken.')
    ]},
    { id: uid(), dayShort: 'Donderdag', dayLabel: 'Dag 4', title: 'Montmartre, Sacré-Cœur en terugreis', items: [
      dayItem('Ochtend — Montmartre', 'Wandeling door Montmartre.', '', MORE.montmartre),
      dayItem('Middag — Sacré-Cœur', 'Bezoek aan de basiliek.', '', MORE.sacre),
      dayItem('Later — terugreis', 'Vertrek uit Parijs en terugreis naar huis.')
    ]}
  ];
}
function defaultProgramB() { return JSON.parse(JSON.stringify(defaultProgramA())); }

function defaultData() {
  return {
    shared: {
      departure: '2026-09-28T07:00',
      instagramProfile: 'https://www.instagram.com/develsteincollegezwijndrecht/',
      announcements: [{ id: uid(), title: 'Belangrijk voor vertrek', text: 'Neem op de dag van vertrek een geldig identiteitsbewijs en een envelop met daar in 20 euro borg mee. Zonder ID kun je niet mee op reis.', type: 'urgent', link: '' }],
      instagramLinks: [],
      practical: {
        info: [
          'Zakgeld: behalve de lunch op de heenreis, zijn alle maaltijden en excursies inbegrepen in de prijs. Richtprijs: 50 euro.',
          'Verzekering: er is een collectieve scholierenreisongevallenverzekering afgesloten. Voor details verwijzen we naar de schoolgids 2025 2026.',
          'Een eventuele annuleringsverzekering voor of tijdens de reis moet zelf afgesloten worden.'
        ],
        packing: [
          'Je goede humeur','Geldig paspoort of Europese identiteitskaart','Pinpas en zakgeld','Gegevens van je ziektekostenverzekering en reisverzekering','Regenkleding','Handdoek(en)','Kleding en nachtgoed','Toiletartikelen','Eventuele medicijnen','Wandelschoenen','Spelletjes (kaarten, e.d.)','Oplader en powerbank voor je telefoon'
        ],
        bus: [
          '20 euro borg in envelop met je naam er op !!','Paspoort of ID-kaart meenemen als handbagage, dus niet in je koffer!!','Lunchpakket heenreis','Kleingeld voor toiletten.','Pen','Doe een label met naam, adres en telefoonnummer op je handbagage en koffer.'
        ],
        rules: [
          'Er wordt niet gerookt (ook geen e-sigaret of vape)','Geen gebruik van alcohol of drugs.','Op roken en drinken in de hotelkamers staan hoge boetes. Bij constatering zal de leiding direct een van deze boetes innen. Dit geldt ook voor beschadigingen en vervuiling.','Zorg dat je hotelkamer netjes blijft, schade komt voor eigen rekening.','Laat geen kostbaarheden achter in de hotelkamer, dus ook niet je paspoort of ID-kaart.','Kom altijd op tijd op de vertrek- en verzamelpunten.','Na 23.00 uur is het rustig op de kamers. Bij overlast word je uit het hotel verwijderd.','Je mag het hotel nooit op eigen houtje verlaten.','Ga in de stad in je vrije tijd nooit alleen op stap, minimaal met 3 personen.','Let op zakkenrollers, neem eventueel een klein slotje mee of een paperclip om je rits dicht te maken.','Houd rekening met anderen.'
        ]
      }
    },
    groups: {
      A: { label: 'Groep A', hotel: 'Generator Paris', leiding: 'Mevr. Brandsma, Dhr. Franken, Mevr. Meeder, Dhr. Toepoel', program: defaultProgramA(), rooms: [], spots: defaultSpots('Generator Paris') },
      B: { label: 'Groep B', hotel: 'The People Paris Marais', leiding: 'Mevr. Jansen, Dhr. Meijer, Mevr. Pauw, Dhr. Scholtes', program: defaultProgramB(), rooms: [], spots: defaultSpots('The People Paris Marais') }
    }
  };
}
function normalizeSpot(spot, hotelName) {
  const name = spot?.name || 'Locatie';
  const key = name.toLowerCase();
  let coords = Array.isArray(spot?.coords) && spot.coords.length === 2 ? spot.coords : (key.includes('(hotel)') ? DEFAULT_COORDS[`${hotelName.toLowerCase()} (hotel)`] : DEFAULT_COORDS[key]);
  if (!coords) coords = [48.8606, 2.3376];
  return { id: spot?.id || uid(), name, note: spot?.note || '', coords: [Number(coords[0]), Number(coords[1])] };
}
function normalizeProgram(program, fallbackProgram) {
  const source = Array.isArray(program) && program.length ? program : fallbackProgram;
  return source.map((day, idx) => ({
    id: day.id || uid(),
    dayShort: day.dayShort || fallbackProgram[idx]?.dayShort || `Dag ${idx+1}`,
    dayLabel: day.dayLabel || fallbackProgram[idx]?.dayLabel || `Dag ${idx+1}`,
    title: day.title || fallbackProgram[idx]?.title || `Dag ${idx+1}`,
    items: Array.isArray(day.items) ? day.items.map(item => ({ title: item.title || 'Onderdeel', text: item.text || '', image: item.image || guessPhoto(item.title, item.text), more: item.more || '' })) : fallbackProgram[idx].items
  }));
}
function normalizeData(data) {
  const defaults = defaultData();
  const next = data && typeof data === 'object' ? data : defaults;
  const shared = next.shared || defaults.shared;
  const groups = next.groups || defaults.groups;
  ['A','B'].forEach(k => {
    const f = defaults.groups[k];
    const g = groups[k] || f;
    g.label = g.label || f.label; g.hotel = g.hotel || f.hotel; g.leiding = g.leiding || f.leiding;
    g.program = normalizeProgram(g.program, f.program);
    g.rooms = Array.isArray(g.rooms) ? g.rooms.map(r => ({ id: r.id || uid(), name: r.name || 'Kamer', students: r.students || '', note: r.note || '' })) : [];
    g.spots = (Array.isArray(g.spots) && g.spots.length ? g.spots : f.spots).map(s => normalizeSpot(s, g.hotel));
  });
  return {
    shared: {
      departure: shared.departure || defaults.shared.departure,
      instagramProfile: shared.instagramProfile || defaults.shared.instagramProfile,
      announcements: Array.isArray(shared.announcements) ? shared.announcements : defaults.shared.announcements,
      instagramLinks: Array.isArray(shared.instagramLinks) ? shared.instagramLinks : [],
      practical: {
        info: Array.isArray(shared.practical?.info) ? shared.practical.info : defaults.shared.practical.info,
        packing: Array.isArray(shared.practical?.packing) ? shared.practical.packing : defaults.shared.practical.packing,
        bus: Array.isArray(shared.practical?.bus) ? shared.practical.bus : defaults.shared.practical.bus,
        rules: Array.isArray(shared.practical?.rules) ? shared.practical.rules : defaults.shared.practical.rules,
      }
    }, groups
  };
}
function run(sql, params = []) { return new Promise((resolve, reject) => db.run(sql, params, function(err){ err ? reject(err) : resolve(this); })); }
function get(sql, params = []) { return new Promise((resolve, reject) => db.get(sql, params, (err,row) => err ? reject(err) : resolve(row))); }
async function initDb() { await run('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'); const row = await get('SELECT value FROM settings WHERE key=?',['siteData']); if (!row) await run('INSERT INTO settings(key,value) VALUES(?,?)',['siteData', JSON.stringify(defaultData())]); else await run('UPDATE settings SET value=? WHERE key=?', [JSON.stringify(normalizeData(JSON.parse(row.value))), 'siteData']); }
async function readData(){ const row = await get('SELECT value FROM settings WHERE key=?',['siteData']); return normalizeData(JSON.parse(row.value)); }
async function writeData(data){ await run('UPDATE settings SET value=? WHERE key=?', [JSON.stringify(normalizeData(data)), 'siteData']); }
function requireAuth(req,res,next){ if (req.session?.authenticated) return next(); res.status(401).json({error:'Niet ingelogd'}); }
app.set('trust proxy', 1);
app.use(express.json({limit:'4mb'}));
app.use(session({ store:new SQLiteStore({db:'app.db', dir:DATA_DIR}), secret:SESSION_SECRET, resave:false, saveUninitialized:false, cookie:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:1000*60*60*8} }));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/site-data', async (req,res)=>{ try{res.json(await readData());} catch {res.status(500).json({error:'Kon data niet laden'});} });
app.get('/api/auth/status', (req,res)=>res.json({authenticated: !!req.session?.authenticated}));
app.post('/api/auth/login', (req,res)=>{ const {username,password}=req.body||{}; if (username===ADMIN_USERNAME && password===ADMIN_PASSWORD){ req.session.authenticated=true; return res.json({ok:true}); } res.status(401).json({error:'Onjuiste inloggegevens'}); });
app.post('/api/auth/logout', (req,res)=> req.session.destroy(()=>res.json({ok:true})));
app.post('/api/site-data', requireAuth, async (req,res)=>{ try{ const nextData=req.body; if(!nextData?.shared||!nextData?.groups?.A||!nextData?.groups?.B) return res.status(400).json({error:'Ongeldige data'}); await writeData(nextData); res.json({ok:true}); } catch { res.status(500).json({error:'Kon data niet opslaan'});} });
app.get('*', (req,res)=> res.sendFile(path.join(__dirname, 'public/index.html')));
initDb().then(()=> app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`))).catch(err => { console.error(err); process.exit(1); });
