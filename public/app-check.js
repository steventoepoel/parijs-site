    const state = {
      site: null,
      currentGroup: localStorage.getItem('selectedGroup') || '',
      adminGroup: 'A',
      map: null,
      markers: []
    };

    const countdownEls = document.querySelectorAll('#countdownGrid .count strong');
    const groupModal = document.getElementById('groupModal');
    const loginModal = document.getElementById('loginModal');
    const adminModal = document.getElementById('adminModal');

    let deferredInstallPrompt = null;

    function updateInstallButton() {
      const btn = document.getElementById('installAppBtn');
      if (!btn) return;
      btn.classList.remove('hidden');
      btn.textContent = deferredInstallPrompt ? '📱 Installeer app' : '📱 Installeer app';
    }


    function escapeHtml(str = '') {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    async function api(url, options = {}) {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        ...options
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Er ging iets mis');
      return data;
    }

    function formatDate(value) {
      const dt = new Date(value);
      if (Number.isNaN(dt.getTime())) return '-';
      return dt.toLocaleString('nl-NL', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }).replace(',', ' om');
    }

    function currentGroupData() {
      return state.site.groups[state.currentGroup];
    }

    function tripState() {
      const departure = new Date(state.site?.shared?.departure);
      if (Number.isNaN(departure.getTime())) return { started: false, finished: false, day: 0 };
      const now = new Date();
      const diff = now - departure;
      if (diff < 0) return { started: false, finished: false, day: 0 };
      const day = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
      const length = currentGroupData()?.program?.length || 4;
      return { started: true, finished: day > length, day: Math.min(day, length) };
    }

    function setTheme(theme) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
      document.getElementById('themeBtn').textContent = theme === 'dark' ? 'Lichte modus' : 'Donkere modus';
    }

    function ensureTheme() {
      setTheme(localStorage.getItem('theme') || 'light');
    }

    function ensureGroupChoice() {
      if (!state.currentGroup || !state.site.groups[state.currentGroup]) groupModal.classList.add('show');
      else groupModal.classList.remove('show');
    }

    function setGroup(group) {
      state.currentGroup = group;
      localStorage.setItem('selectedGroup', group);
      document.getElementById('groupBtn').textContent = group;
      groupModal.classList.remove('show');
      renderAll();
    }

    function announcementBadge(type) {
      const klass = type === 'info' ? 'info' : type === 'form' ? 'form' : 'urgent';
      const label = type === 'info' ? 'Info' : type === 'form' ? 'Formulier' : 'Urgent';
      return `<span class="tag ${klass}">${label}</span>`;
    }

    function renderHero() {
      const group = currentGroupData();
      const t = tripState();
      const liveDayBadge = document.getElementById('liveDayBadge');
      document.getElementById('groupBtn').textContent = state.currentGroup;
      document.getElementById('heroGroupLabel').textContent = group.label || `Groep ${state.currentGroup}`;
      document.getElementById('heroLeiding').textContent = group.leiding;
      document.getElementById('departLabel').textContent = formatDate(state.site.shared.departure);
      document.getElementById('instagramProfileBtn').href = state.site.shared.instagramProfile || '#';
      document.getElementById('mapCaption').textContent = `Alle bezienswaardigheden en locaties van ${group.label}`;
      if (t.started && !t.finished) {
        liveDayBadge.textContent = `Vandaag: Dag ${t.day}`;
        liveDayBadge.classList.remove('hidden');
      } else {
        liveDayBadge.classList.add('hidden');
      }
      document.getElementById('aftellen').classList.toggle('hidden', t.started);
      document.getElementById('countdownNav').classList.toggle('hidden', t.started);
    }

    function renderAnnouncements() {
      const root = document.getElementById('announcementsList');
      const items = state.site.shared.announcements || [];
      if (!items.length) {
        root.innerHTML = '<div class="insta-empty">Nog geen mededelingen geplaatst.</div>';
        return;
      }
      root.innerHTML = items.map(item => `
        <article class="notice">
          <div class="notice-top">
            <h3 class="${item.type === 'urgent' ? 'notice-title-urgent' : ''}" style="margin:0;">${escapeHtml(item.title)}</h3>
            ${announcementBadge(item.type)}
          </div>
          <p>${escapeHtml(item.text)}</p>
          ${item.link ? `<div class="btn-row"><a class="btn btn-secondary" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Open link</a></div>` : ''}
        </article>
      `).join('');
    }

    function renderSchedule() {
      const root = document.getElementById('scheduleList');
      const days = currentGroupData().program || [];
      const trip = tripState();
      root.innerHTML = days.map((day, index) => {
        const shouldOpen = trip.started && !trip.finished && trip.day === index + 1;
        return `
        <article class="timeline-day ${shouldOpen ? 'open' : ''}">
          <button class="timeline-toggle" type="button">
            <div class="timeline-day-label"><strong>${escapeHtml(day.dayShort)}</strong><span>${escapeHtml(day.dayLabel)}</span></div>
            <div>
              <h3 style="margin:0 0 6px;">${escapeHtml(day.dayLabel || `Dag ${index + 1}`)} • ${escapeHtml(day.title)}</h3>
              <p class="muted">Tik om deze dag ${shouldOpen ? 'in te klappen' : 'uit te klappen'}.</p>
            </div>
            <div class="timeline-chevron">⌄</div>
          </button>
          <div class="timeline-content">
            <div class="timeline-items">
              ${day.items.map(item => `
                <div class="timeline-item">
                  <div class="timeline-grid">
                    ${item.image ? `<img class="item-photo" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">` : ''}
                    <div>
                      <strong>${escapeHtml(item.title)}</strong>
                      <p>${escapeHtml(item.text)}</p>
                      ${item.moreInfo ? `<details class="more-info"><summary>Meer info over deze plek</summary><p>${escapeHtml(item.moreInfo)}</p></details>` : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </article>
        `;
      }).join('');
      root.querySelectorAll('.timeline-day').forEach(dayEl => {
        dayEl.querySelector('.timeline-toggle').addEventListener('click', () => {
          dayEl.classList.toggle('open');
        });
      });
    }

    function renderRooms() {
      const root = document.getElementById('roomsList');
      const rooms = currentGroupData().rooms || [];
      if (!rooms.length) {
        root.innerHTML = '<div class="insta-empty">Nog geen kamerverdeling ingevuld.</div>';
        return;
      }
      root.innerHTML = rooms.map(room => `
        <article class="room">
          <h3 style="margin:0 0 8px;">${escapeHtml(room.name)}</h3>
          <p><strong>Bewoners:</strong> ${escapeHtml(room.students)}</p>
          ${room.note ? `<p style="margin-top:8px;">${escapeHtml(room.note)}</p>` : ''}
        </article>
      `).join('');
    }

    function renderChecklist(rootId, items, storagePrefix) {
      const root = document.getElementById(rootId);
      root.innerHTML = items.map((line, index) => {
        const key = `${storagePrefix}-${index}`;
        const checked = localStorage.getItem(key) === '1' ? 'checked' : '';
        return `<li><label><input type="checkbox" data-key="${key}" ${checked}> <span>${escapeHtml(line)}</span></label></li>`;
      }).join('');
      root.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
          localStorage.setItem(input.dataset.key, input.checked ? '1' : '0');
        });
      });
    }

    function renderPractical() {
      const practical = state.site.shared.practical || {};
      document.getElementById('moneyInsuranceList').innerHTML = (practical.moneyInsurance || []).map(line => `<li>${escapeHtml(line)}</li>`).join('');
      document.getElementById('agreementsList').innerHTML = (practical.agreements || []).map(line => `<li>${escapeHtml(line)}</li>`).join('');
      renderChecklist('packingList', practical.packing || [], `packing-${state.currentGroup}`);
      renderChecklist('busList', practical.bus || [], `bus-${state.currentGroup}`);
    }

    function spotCoords(spot) {
      return Array.isArray(spot.coords) && spot.coords.length === 2 ? [Number(spot.coords[0]), Number(spot.coords[1])] : [48.858, 2.34];
    }

    function renderMap() {
      const spots = currentGroupData().spots || [];
      if (!state.map) {
        state.map = L.map('map', { scrollWheelZoom: false }).setView([48.858, 2.34], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap-bijdragers',
          maxZoom: 19
        }).addTo(state.map);
      }
      state.markers.forEach(marker => marker.remove());
      state.markers = [];
      const bounds = [];
      spots.forEach((spot, index) => {
        const coords = spotCoords(spot);
        bounds.push(coords);
        const marker = L.marker(coords).addTo(state.map).bindPopup(`<strong>${escapeHtml(spot.name)}</strong><br>${escapeHtml(spot.note || '')}`);
        marker.on('click', () => selectSpot(index));
        state.markers.push(marker);
      });
      if (bounds.length) state.map.fitBounds(bounds, { padding: [28, 28] });
      setTimeout(() => state.map.invalidateSize(), 120);
      selectSpot(0);
      document.getElementById('spotsList').innerHTML = spots.map((spot, index) => `
        <div class="spot-row">
          <div>
            <h3>${escapeHtml(spot.name)}</h3>
            <p class="muted">${escapeHtml(spot.note || '')}</p>
          </div>
          <div class="btn-row"><button class="btn btn-secondary" type="button" data-spot-index="${index}">Toon op kaart</button></div>
        </div>
      `).join('');
      document.querySelectorAll('[data-spot-index]').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = Number(btn.dataset.spotIndex);
          selectSpot(index);
          const coords = spotCoords(spots[index]);
          state.map.setView(coords, 13);
          state.markers[index]?.openPopup();
          document.getElementById('kaart').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }

    function selectSpot(index) {
      const spot = currentGroupData().spots[index];
      if (!spot) return;
      document.getElementById('mapSelectedNote').textContent = `${spot.name}${spot.note ? ' — ' + spot.note : ''}`;
    }

    function toInstagramEmbedUrl(url = '') {
      try {
        const u = new URL(url);
        if (!u.hostname.includes('instagram.com')) return '';
        const parts = u.pathname.split('/').filter(Boolean);
        if (['reel', 'p', 'tv'].includes(parts[0]) && parts[1]) return `https://www.instagram.com/${parts[0]}/${parts[1]}/embed/captioned/`;
      } catch {}
      return '';
    }

    function renderInstagram() {
      const root = document.getElementById('instagramList');
      const links = state.site.shared.instagramLinks || [];
      if (!links.length) {
        root.innerHTML = '<div class="insta-empty">Nog geen Instagram previews toegevoegd.</div>';
        return;
      }
      root.innerHTML = links.map(item => {
        const embed = toInstagramEmbedUrl(item.url);
        return `
          <article class="insta">
            <h3 style="margin:0 0 8px;">${escapeHtml(item.title)}</h3>
            ${embed ? `<iframe title="Instagram preview" src="${escapeHtml(embed)}" style="width:100%;min-height:420px;border:1px solid var(--line);border-radius:18px;background:white;" loading="lazy"></iframe>` : '<div class="insta-empty">Deze link kan niet als preview worden getoond.</div>'}
            <div class="btn-row"><a class="btn btn-secondary" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Open op Instagram</a></div>
          </article>
        `;
      }).join('');
    }

    function updateCountdown() {
      if (!state.site) return;
      const departureDate = new Date(state.site.shared.departure);
      const now = new Date();
      const diff = departureDate - now;
      if (Number.isNaN(departureDate.getTime()) || diff <= 0) {
        countdownEls.forEach(el => el.textContent = '0');
        return;
      }
      countdownEls[0].textContent = Math.floor(diff / (1000 * 60 * 60 * 24));
      countdownEls[1].textContent = Math.floor((diff / (1000 * 60 * 60)) % 24);
      countdownEls[2].textContent = Math.floor((diff / (1000 * 60)) % 60);
      countdownEls[3].textContent = Math.floor((diff / 1000) % 60);
    }

    function formatInstagramLinksForAdmin(items = []) {
      return items.map(item => item.title ? `${item.title} | ${item.url}` : item.url).join('\n');
    }

    function formatSpotsForAdmin(spots = []) {
      return spots.map(spot => `${spot.name} | ${spot.note || ''} | ${(spot.coords || []).join(', ')}`).join('\n');
    }

    function renderAdminProgram() {
      const root = document.getElementById('adminProgramList');
      const group = state.site.groups[state.adminGroup];
      root.innerHTML = (group.program || []).map((day, index) => `
        <div class="admin-repeat-item">
          <div class="admin-inline">
            <div class="field"><label>${escapeHtml(day.dayLabel || `Dag ${index + 1}`)} titel</label><input type="text" data-program-title="${index}" value="${escapeHtml(day.title || '')}"></div>
            <div class="field"><label>Korte dagnaam</label><input type="text" data-program-day-short="${index}" value="${escapeHtml(day.dayShort || '')}"></div>
          </div>
          <div class="field" style="margin-top:12px;">
            <label>Onderdelen per regel (Titel | Tekst)</label>
            <textarea data-program-items="${index}" style="min-height:140px;">${escapeHtml((day.items || []).map(item => `${item.title} | ${item.text}`).join('\n'))}</textarea>
          </div>
        </div>
      `).join('');
    }

    function fillAdmin() {
      const group = state.site.groups[state.adminGroup];
      document.getElementById('departureInput').value = state.site.shared.departure || '';
      document.getElementById('instagramProfileInput').value = state.site.shared.instagramProfile || '';
      document.getElementById('instagramLinksInput').value = formatInstagramLinksForAdmin(state.site.shared.instagramLinks || []);
      document.getElementById('adminGroupSelect').value = state.adminGroup;
      document.getElementById('leadersInput').value = group.leiding || '';
      document.getElementById('spotsInput').value = formatSpotsForAdmin(group.spots || []);
      renderAdminProgram();
    }

    function buildAdminListsFromForm() {
      const group = state.site.groups[state.adminGroup];
      group.leiding = document.getElementById('leadersInput').value.trim() || group.leiding;

      group.program = (group.program || []).map((day, index) => {
        const title = document.querySelector(`[data-program-title="${index}"]`)?.value.trim() || day.title;
        const dayShort = document.querySelector(`[data-program-day-short="${index}"]`)?.value.trim() || day.dayShort;
        const rawItems = document.querySelector(`[data-program-items="${index}"]`)?.value || '';
        const items = rawItems.split(/\n+/).map(line => line.trim()).filter(Boolean).map(line => {
          const [titlePart, ...rest] = line.split('|');
          const itemTitle = (titlePart || '').trim() || 'Onderdeel';
          const itemText = rest.join('|').trim();
          return {
            title: itemTitle,
            text: itemText,
            image: day.items?.find(existing => existing.title === itemTitle)?.image || '',
            moreInfo: day.items?.find(existing => existing.title === itemTitle)?.moreInfo || ''
          };
        });
        return { ...day, title, dayShort, items: items.length ? items : day.items };
      });

      state.site.shared.instagramLinks = (document.getElementById('instagramLinksInput').value || '')
        .split(/\n+/)
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
          const [titlePart, ...rest] = line.split('|');
          const maybeUrl = (rest.length ? rest.join('|') : titlePart).trim();
          const title = rest.length ? titlePart.trim() : '';
          return { title: title || 'Instagram update', url: maybeUrl };
        });

      group.spots = (document.getElementById('spotsInput').value || '')
        .split(/\n+/)
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
          const [namePart = '', notePart = '', coordsPart = ''] = line.split('|');
          const coordMatch = coordsPart.split(',').map(v => Number(v.trim())).filter(v => !Number.isNaN(v));
          return {
            id: crypto.randomUUID ? crypto.randomUUID() : `spot-${Date.now()}-${Math.random()}`,
            name: namePart.trim() || 'Locatie',
            note: notePart.trim(),
            coords: coordMatch.length === 2 ? coordMatch : [48.858, 2.34]
          };
        });
    }

    async function saveSite() {
      await api('/api/site-data', { method: 'POST', body: JSON.stringify(state.site) });
      fillAdmin();
      renderAll();
    }

    function renderAll() {
      if (!state.site || !state.currentGroup || !state.site.groups[state.currentGroup]) return;
      renderHero();
      renderAnnouncements();
      renderSchedule();
      renderRooms();
      renderPractical();
      renderMap();
      renderInstagram();
      fillAdmin();
      updateCountdown();
    }

    async function init() {
      ensureTheme();
      updateInstallButton();
      state.site = await api('/api/site-data');
      if (!state.currentGroup || !state.site.groups[state.currentGroup]) state.currentGroup = '';
      ensureGroupChoice();
      if (state.currentGroup) renderAll();
    }

    document.querySelectorAll('[data-group]').forEach(button => button.addEventListener('click', () => setGroup(button.dataset.group)));
    document.getElementById('groupBtn').addEventListener('click', () => groupModal.classList.add('show'));
    document.getElementById('themeBtn').addEventListener('click', () => {
      const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      setTheme(next);
    });

    document.getElementById('openAdminBtn').addEventListener('click', () => loginModal.classList.add('show'));
    document.getElementById('closeLoginBtn').addEventListener('click', () => loginModal.classList.remove('show'));
    document.getElementById('closeAdminBtn').addEventListener('click', () => adminModal.classList.remove('show'));
    document.getElementById('adminGroupSelect').addEventListener('change', event => {
      state.adminGroup = event.target.value;
      fillAdmin();
    });
    document.getElementById('loginBtn').addEventListener('click', async () => {
      try {
        await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            username: document.getElementById('adminUsername').value.trim(),
            password: document.getElementById('adminPassword').value
          })
        });
        document.getElementById('loginFeedback').textContent = '';
        loginModal.classList.remove('show');
        adminModal.classList.add('show');
        fillAdmin();
      } catch (error) {
        document.getElementById('loginFeedback').textContent = error.message;
      }
    });
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await api('/api/auth/logout', { method: 'POST', body: '{}' });
      adminModal.classList.remove('show');
    });
    document.getElementById('saveBasicsBtn').addEventListener('click', async () => {
      state.site.shared.departure = document.getElementById('departureInput').value || state.site.shared.departure;
      state.site.shared.instagramProfile = document.getElementById('instagramProfileInput').value.trim() || state.site.shared.instagramProfile;
      buildAdminListsFromForm();
      await saveSite();
      alert('Wijzigingen opgeslagen.');
    });

    loginModal.addEventListener('click', event => { if (event.target === loginModal) loginModal.classList.remove('show'); });
    adminModal.addEventListener('click', event => { if (event.target === adminModal) adminModal.classList.remove('show'); });
    groupModal.addEventListener('click', event => { if (event.target === groupModal && state.currentGroup) groupModal.classList.remove('show'); });

    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      deferredInstallPrompt = event;
      updateInstallButton();
    });

    document.getElementById('installAppBtn').addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice.catch(() => null);
        deferredInstallPrompt = null;
        updateInstallButton();
        return;
      }
      alert('Je kunt deze app installeren via het browsermenu: kies bijvoorbeeld "Toevoegen aan beginscherm" of "App installeren".');
    });

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
    }

    setInterval(updateCountdown, 1000);
    init();