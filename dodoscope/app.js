/* DodoScope – suivi du sommeil par le son.
 * Écoute le micro pendant la nuit, détecte les sons qui dépassent le bruit de fond,
 * estime leur type (ronflement, parole, toux/choc, autre bruit), enregistre un extrait
 * et garde tout en local (IndexedDB).
 */
'use strict';

// ---------------------------------------------------------------- réglages
const DEFAULTS = { sens: 10, recordAudio: true, clipMax: 20, startDelay: 0 };
const settings = loadSettings();
function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('dodoscope-settings') || '{}') }; }
  catch { return { ...DEFAULTS }; }
}
function saveSettings() {
  try { localStorage.setItem('dodoscope-settings', JSON.stringify(settings)); } catch {}
}

const TYPES = {
  snore: { label: 'Ronflement', color: '#ff9f43' },
  talk:  { label: 'Parole',     color: '#54d38a' },
  cough: { label: 'Toux / choc', color: '#ff6b81' },
  noise: { label: 'Bruit',      color: '#8fa3ff' },
};

const FRAME_MS = 100;          // analyse 10 fois par seconde
const CALIBRATION_MS = 5000;   // mesure du bruit de fond au démarrage
const BUCKET_MS = 30000;       // un point du graphique de la nuit toutes les 30 s
const MAX_CLIPS = 300;         // limite d'extraits audio par nuit

// ---------------------------------------------------------------- base de données
const db = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      const r = indexedDB.open('dodoscope', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore('sessions', { keyPath: 'id' });
        const clips = d.createObjectStore('clips', { keyPath: 'id' });
        clips.createIndex('sessionId', 'sessionId');
      };
      r.onsuccess = () => { this._db = r.result; res(r.result); };
      r.onerror = () => rej(r.error);
    });
  },
  async tx(store, mode, fn) {
    const d = await this.open();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode);
      const s = t.objectStore(store);
      let out;
      Promise.resolve(fn(s)).then(v => { out = v; });
      t.oncomplete = () => res(out);
      t.onerror = () => rej(t.error);
    });
  },
  req(r) { return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  putSession(s) { return this.tx('sessions', 'readwrite', st => { st.put(s); }); },
  getSession(id) { return this.tx('sessions', 'readonly', st => this.req(st.get(id))); },
  allSessions() { return this.tx('sessions', 'readonly', st => this.req(st.getAll())); },
  putClip(c) { return this.tx('clips', 'readwrite', st => { st.put(c); }); },
  getClip(id) { return this.tx('clips', 'readonly', st => this.req(st.get(id))); },
  async deleteSession(id) {
    await this.tx('sessions', 'readwrite', st => { st.delete(id); });
    await this.tx('clips', 'readwrite', st => {
      const r = st.index('sessionId').openKeyCursor(IDBKeyRange.only(id));
      r.onsuccess = () => { const c = r.result; if (c) { st.delete(c.primaryKey); c.continue(); } };
    });
  },
  async wipe() {
    await this.tx('sessions', 'readwrite', st => { st.clear(); });
    await this.tx('clips', 'readwrite', st => { st.clear(); });
  },
};

// ---------------------------------------------------------------- utilitaires
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
const hm = t => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const hms = t => { const d = new Date(t); return `${hm(t)}:${pad(d.getSeconds())}`; };
function fmtDur(ms) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${pad(m % 60)}`;
}
function fmtSec(s) { return s < 60 ? `${s.toFixed(1)} s` : `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`; }
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function scoreColor(s) { return s >= 80 ? '#54d38a' : s >= 60 ? '#f5d77a' : s >= 40 ? '#ff9f43' : '#ff6b81'; }

// ---------------------------------------------------------------- enregistreur de nuit
const rec = {
  session: null, stream: null, ctx: null, analyser: null, timer: null,
  timeBuf: null, freqBuf: null, mime: '',
  floor: null, calib: [], detectFrom: 0,
  ev: null, aboveCount: 0, belowSince: null,
  bucket: null, live: [], liveAcc: [], wakeLock: null, clipCount: 0,
  lastSave: 0,
};

async function startNight() {
  let stream;
  try {
    // Pas de suppression de bruit : elle effacerait justement les ronflements.
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
  } catch (e) {
    alert("Impossible d'accéder au micro. Autorise le micro pour cette page puis réessaie.\n\n(" + e.message + ')');
    return;
  }
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  await ctx.resume();
  const src = ctx.createMediaStreamSource(stream);
  const an = ctx.createAnalyser();
  an.fftSize = 2048;
  an.smoothingTimeConstant = 0;
  src.connect(an);

  const now = Date.now();
  Object.assign(rec, {
    stream, ctx, analyser: an,
    timeBuf: new Float32Array(an.fftSize),
    freqBuf: new Float32Array(an.frequencyBinCount),
    floor: null, calib: [], ev: null, aboveCount: 0, belowSince: null,
    detectFrom: now + Math.max(CALIBRATION_MS, settings.startDelay * 60000),
    bucket: { t: now, sum: 0, n: 0, max: 0 }, live: [], liveAcc: [], clipCount: 0, lastSave: now,
    mime: pickMime(),
  });
  rec.session = {
    id: uid(), start: now, end: null, status: 'running',
    settings: { ...settings }, samples: [], events: [], floor: null,
  };
  await db.putSession(rec.session);

  rec.timer = setInterval(tick, FRAME_MS);
  await keepAwake();
  $('idle').hidden = true;
  $('running').hidden = false;
  $('liveEvents').innerHTML = '';
  updateCounters();
  if (window.Android) Android.nightStarted();
}

function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return '';
}

async function keepAwake() {
  try {
    if ('wakeLock' in navigator) rec.wakeLock = await navigator.wakeLock.request('screen');
  } catch {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && rec.session) keepAwake();
});

function tick() {
  const an = rec.analyser, now = Date.now();
  an.getFloatTimeDomainData(rec.timeBuf);
  let sum = 0;
  for (let i = 0; i < rec.timeBuf.length; i++) sum += rec.timeBuf[i] * rec.timeBuf[i];
  const rms = Math.sqrt(sum / rec.timeBuf.length);
  // Niveau relatif : 0 = silence numérique, ~100 = saturation du micro (non étalonné).
  const L = Math.max(0, 20 * Math.log10(rms || 1e-6) + 100);

  // Bruit de fond
  if (now - rec.session.start < CALIBRATION_MS) {
    rec.calib.push(L);
    const s = [...rec.calib].sort((a, b) => a - b);
    rec.floor = s[Math.floor(s.length / 2)];
  } else if (!rec.ev) {
    // descend vite quand la chambre devient plus calme, monte très lentement
    rec.floor += (L - rec.floor) * (L < rec.floor ? 0.05 : 0.002);
  }
  rec.floor = Math.max(5, rec.floor);

  // Données pour les graphiques
  const b = rec.bucket;
  b.sum += L; b.n++; b.max = Math.max(b.max, L);
  if (now - b.t >= BUCKET_MS) {
    rec.session.samples.push({ t: b.t, avg: +(b.sum / b.n).toFixed(1), max: +b.max.toFixed(1), floor: +rec.floor.toFixed(1) });
    rec.bucket = { t: now, sum: 0, n: 0, max: 0 };
  }
  rec.liveAcc.push(L);
  if (rec.liveAcc.length >= 5) {
    rec.live.push({ L: Math.max(...rec.liveAcc), floor: rec.floor });
    if (rec.live.length > 240) rec.live.shift(); // 2 dernières minutes
    rec.liveAcc = [];
  }

  // Détection
  if (now >= rec.detectFrom) detect(L, now);

  // Sauvegarde régulière (au cas où le téléphone s'éteint)
  if (now - rec.lastSave > 60000) {
    rec.lastSave = now;
    rec.session.lastSeen = now;
    rec.session.floor = rec.floor;
    db.putSession(rec.session);
  }

  renderLive(L, now);
}

function detect(L, now) {
  const thr = rec.floor + settings.sens;
  if (!rec.ev) {
    if (L > thr) {
      // 2 trames au-dessus du seuil, ou 1 seule si le son est très fort (choc, porte…)
      if (++rec.aboveCount >= 2 || L > thr + 12) { openEvent(now - FRAME_MS * rec.aboveCount); analyseFrame(rec.ev, L); }
    } else rec.aboveCount = 0;
    return;
  }
  const ev = rec.ev;
  if (L > thr - 3) {
    analyseFrame(ev, L);
    rec.belowSince = null;
  } else if (!rec.belowSince) {
    rec.belowSince = now;
  }
  if (rec.belowSince && now - rec.belowSince > 1200) closeEvent(rec.belowSince);
  else if (now - ev.start > settings.clipMax * 1000) closeEvent(now);
}

function openEvent(t) {
  rec.aboveCount = 0;
  rec.belowSince = null;
  rec.ev = { id: uid(), start: t, frames: 0, peak: 0, low: 0, mid: 0, high: 0, centroid: 0, floor: rec.floor, chunks: [], recorder: null };
  if (settings.recordAudio && rec.mime !== null && rec.clipCount < MAX_CLIPS) {
    try {
      const mr = new MediaRecorder(rec.stream, rec.mime ? { mimeType: rec.mime } : undefined);
      const ev = rec.ev;
      mr.ondataavailable = e => { if (e.data && e.data.size) ev.chunks.push(e.data); };
      mr.start();
      rec.ev.recorder = mr;
    } catch {}
  }
}

function analyseFrame(ev, L) {
  const an = rec.analyser;
  an.getFloatFrequencyData(rec.freqBuf);
  const hz = rec.ctx.sampleRate / an.fftSize;
  let low = 0, mid = 0, high = 0, wsum = 0;
  for (let i = 1; i < rec.freqBuf.length; i++) {
    const f = i * hz;
    if (f < 50 || f > 8000) continue;
    const p = Math.pow(10, rec.freqBuf[i] / 10);
    if (f < 400) low += p; else if (f < 2000) mid += p; else high += p;
    wsum += p * f;
  }
  const tot = low + mid + high || 1e-12;
  ev.frames++;
  ev.low += low / tot; ev.mid += mid / tot; ev.high += high / tot;
  ev.centroid += wsum / tot;
  ev.peak = Math.max(ev.peak, L);
}

function classify(e, prev) {
  const { dur, low, mid, high, centroid } = e;
  if (e.active <= 0.4 || (dur <= 0.9 && high > 0.2)) return 'cough';
  // Ronflement : énergie concentrée dans les graves (< 400 Hz), peu de médiums
  if (low >= 0.65 && mid < 0.3 && centroid < 400 && dur >= 0.3 && dur <= 5) return 'snore';
  // Les ronflements reviennent à chaque respiration (toutes les 2 à 10 s environ).
  const gap = prev ? (e.start - prev.end) / 1000 : Infinity;
  if (prev && prev.type === 'snore' && gap < 10 && low >= 0.55 && mid < 0.35 && centroid < 400 && dur <= 6) return 'snore';
  if (dur >= 0.8 && centroid >= 400 && centroid < 3000 && mid >= 0.2) return 'talk';
  return 'noise';
}

function closeEvent(endT) {
  const ev = rec.ev;
  rec.ev = null;
  rec.belowSince = null;
  const dur = (endT - ev.start) / 1000;
  const stopRec = () => { if (ev.recorder && ev.recorder.state !== 'inactive') ev.recorder.stop(); };
  const sharp = ev.frames >= 1 && ev.peak - ev.floor > settings.sens + 12;
  if (!sharp && (ev.frames < 3 || dur < 0.3)) { stopRec(); return; } // trop court : on ignore

  const n = Math.max(1, ev.frames);
  const out = {
    id: ev.id, start: ev.start, end: endT, dur: +dur.toFixed(2),
    peak: +ev.peak.toFixed(1), floor: +ev.floor.toFixed(1),
    low: +(ev.low / n).toFixed(3), mid: +(ev.mid / n).toFixed(3), high: +(ev.high / n).toFixed(3),
    centroid: Math.round(ev.centroid / n), active: +(n * FRAME_MS / 1000).toFixed(1), hasClip: false,
  };
  const events = rec.session.events;
  out.type = classify(out, events[events.length - 1]);
  events.push(out);

  if (ev.recorder) {
    const sessionId = rec.session.id;
    ev.recorder.onstop = async () => {
      if (!ev.chunks.length) return;
      const blob = new Blob(ev.chunks, { type: ev.recorder.mimeType || rec.mime || 'audio/webm' });
      try {
        await db.putClip({ id: out.id, sessionId, blob });
        out.hasClip = true;
        rec.clipCount++;
      } catch {}
    };
    stopRec();
  }
  addLiveEvent(out);
  updateCounters();
}

async function stopNight() {
  if (!rec.session) return;
  if (!confirm('Terminer la nuit et voir le résumé ?')) return;
  clearInterval(rec.timer);
  if (rec.ev) closeEvent(Date.now());
  const b = rec.bucket;
  if (b.n) rec.session.samples.push({ t: b.t, avg: +(b.sum / b.n).toFixed(1), max: +b.max.toFixed(1), floor: +rec.floor.toFixed(1) });
  await new Promise(r => setTimeout(r, 400)); // laisse le temps au dernier extrait d'être enregistré
  rec.stream.getTracks().forEach(t => t.stop());
  rec.ctx.close();
  try { rec.wakeLock && rec.wakeLock.release(); } catch {}
  if (window.Android) Android.nightStopped();
  const s = rec.session;
  s.end = Date.now();
  s.status = 'done';
  s.floor = rec.floor;
  s.summary = summarize(s);
  await db.putSession(s);
  rec.session = null;
  $('dimmer').hidden = true;
  $('running').hidden = true;
  $('idle').hidden = false;
  await renderHistory();
  showDetail(s.id);
}

// ---------------------------------------------------------------- bilan
function summarize(s) {
  const total = Math.max(1, (s.end || s.lastSeen || s.start) - s.start);
  const counts = { snore: 0, talk: 0, cough: 0, noise: 0 };
  const secs = { snore: 0, talk: 0, cough: 0, noise: 0 };
  let loud = 0, peak = 0;
  for (const e of s.events) {
    counts[e.type]++; secs[e.type] += e.dur;
    peak = Math.max(peak, e.peak);
    if (e.peak - e.floor > 30) loud++;
  }
  const hours = total / 3600000;
  const snorePct = secs.snore * 1000 / total * 100;
  const others = (counts.talk + counts.cough + counts.noise) / Math.max(hours, 0.5);
  let score = 100 - Math.min(45, snorePct * 3) - Math.min(25, others * 2) - Math.min(15, loud * 1.5);
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { total, counts, secs, snorePct: +snorePct.toFixed(1), loud, peak, score };
}
function scoreText(s) {
  return s >= 80 ? 'Nuit calme' : s >= 60 ? 'Nuit correcte' : s >= 40 ? 'Nuit agitée' : 'Nuit très bruyante';
}

// ---------------------------------------------------------------- affichage en direct
function renderLive(L, now) {
  $('clockRun').textContent = hm(now);
  $('dimClock').textContent = hm(now);
  $('elapsed').textContent = fmtDur(now - rec.session.start) + ' d\'enregistrement';
  $('meterFill').style.width = Math.min(100, L) + '%';
  $('meterFloor').style.left = Math.min(100, rec.floor) + '%';
  $('levelTxt').textContent = Math.round(L) + ' dB';
  $('floorTxt').textContent = Math.round(rec.floor);
  let st;
  if (now - rec.session.start < CALIBRATION_MS) st = 'Calibrage du bruit de fond…';
  else if (now < rec.detectFrom) st = `Détection dans ${Math.ceil((rec.detectFrom - now) / 60000)} min — endors-toi tranquillement`;
  else if (rec.ev) st = '🎙️ Son détecté…';
  else st = 'À l\'écoute · bonne nuit 😴';
  $('status').textContent = st;
  if (rec.live.length && (rec.live.length % 2 === 0 || rec.ev)) drawLive();
}

function drawLive() {
  const c = $('liveChart'), g = setupCanvas(c);
  const W = c.clientWidth, H = c.clientHeight;
  const pts = rec.live, n = 240;
  const y = v => H - 8 - (Math.min(100, v) / 100) * (H - 16);
  g.clearRect(0, 0, W, H);
  g.strokeStyle = '#ffffff33'; g.setLineDash([4, 4]);
  g.beginPath(); pts.forEach((p, i) => { const x = W - (pts.length - i) * W / n; i ? g.lineTo(x, y(p.floor + settings.sens)) : g.moveTo(x, y(p.floor + settings.sens)); }); g.stroke();
  g.setLineDash([]);
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#ff7a85'); grad.addColorStop(.5, '#f5d77a'); grad.addColorStop(1, '#8fd3ff');
  g.fillStyle = grad;
  const bw = W / n;
  pts.forEach((p, i) => { const x = W - (pts.length - i) * bw; const top = y(p.L); g.fillRect(x, top, Math.max(1, bw - 1), H - 8 - top); });
}

function addLiveEvent(e) {
  const li = document.createElement('li');
  li.innerHTML = `<span class="tag ${e.type}">${TYPES[e.type].label}</span><div class="ev-main">${hms(e.start)}<div class="ev-sub">${fmtSec(e.dur)} · pic ${Math.round(e.peak)} dB</div></div>`;
  const ul = $('liveEvents');
  ul.prepend(li);
  while (ul.children.length > 5) ul.lastChild.remove();
}
function updateCounters() {
  const c = { snore: 0, talk: 0, cough: 0, noise: 0 };
  (rec.session ? rec.session.events : []).forEach(e => c[e.type]++);
  $('cSnore').textContent = c.snore; $('cTalk').textContent = c.talk;
  $('cCough').textContent = c.cough; $('cNoise').textContent = c.noise;
}

function setupCanvas(c) {
  const dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth, h = c.clientHeight;
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return g;
}

// ---------------------------------------------------------------- historique
async function renderHistory() {
  const list = (await db.allSessions()).filter(s => s.status !== 'running' || !rec.session || s.id !== rec.session.id);
  list.sort((a, b) => b.start - a.start);
  const ul = $('sessionList');
  ul.innerHTML = '';
  $('noSessions').hidden = list.length > 0;
  for (const s of list) {
    const sum = s.summary || summarize(s);
    const li = document.createElement('li');
    const date = new Date(s.start).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    li.innerHTML = `<div class="mini-score" style="color:${scoreColor(sum.score)}">${sum.score}</div>
      <div class="info"><b>${date}</b><span class="muted">${hm(s.start)} → ${hm(s.end || s.lastSeen || s.start)} · ${fmtDur(sum.total)}</span><br>
      <span class="muted small">${sum.counts.snore} ronflements · ${sum.counts.talk + sum.counts.cough + sum.counts.noise} autres sons</span></div><span class="muted">›</span>`;
    li.onclick = () => showDetail(s.id);
    ul.appendChild(li);
  }
}

let current = null, filter = 'all', audio = null;
async function showDetail(id) {
  current = await db.getSession(id);
  if (!current) return;
  filter = 'all';
  show('detail');
  const s = current, sum = summarize(s);
  $('dTitle').textContent = new Date(s.start).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const sc = $('dScore');
  sc.textContent = sum.score; sc.style.color = scoreColor(sum.score);
  $('dScoreTxt').textContent = `${scoreText(sum.score)} · ${hm(s.start)} → ${hm(s.end || s.lastSeen || s.start)}`;
  $('dStats').innerHTML = [
    [fmtDur(sum.total), 'enregistrées'],
    [fmtSec(sum.secs.snore), `de ronflement (${sum.snorePct} %)`],
    [sum.counts.snore, 'ronflements'],
    [sum.counts.talk, 'fois où tu as parlé'],
    [sum.counts.cough, 'toux / chocs'],
    [sum.counts.noise, 'autres bruits'],
  ].map(([b, t]) => `<div><b>${b}</b><span>${t}</span></div>`).join('');
  renderFilters();
  renderEvents();
  requestAnimationFrame(drawNight);
}

function renderFilters() {
  const f = $('dFilters');
  f.innerHTML = '';
  for (const [k, lab] of [['all', 'Tous'], ...Object.entries(TYPES).map(([k, v]) => [k, v.label])]) {
    const b = document.createElement('button');
    b.textContent = lab; b.className = filter === k ? 'on' : '';
    b.onclick = () => { filter = k; renderFilters(); renderEvents(); };
    f.appendChild(b);
  }
}

function renderEvents() {
  const ul = $('dEvents');
  ul.innerHTML = '';
  const evs = current.events.filter(e => filter === 'all' || e.type === filter);
  if (!evs.length) { ul.innerHTML = '<li class="muted">Aucun son de ce type.</li>'; return; }
  for (const e of evs) {
    const li = document.createElement('li');
    const play = document.createElement('button');
    play.className = 'play'; play.textContent = '▶'; play.title = 'Écouter';
    play.onclick = () => playClip(e.id, play);
    const opts = Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${k === e.type ? 'selected' : ''}>${v.label}</option>`).join('');
    li.innerHTML = `<span class="tag ${e.type}">${TYPES[e.type].label}</span>
      <div class="ev-main">${hms(e.start)}<div class="ev-sub">${fmtSec(e.dur)} · pic ${Math.round(e.peak)} dB</div></div>
      <select class="relabel" title="Corriger le type">${opts}</select>`;
    li.prepend(play);
    li.querySelector('select').onchange = async ev => {
      e.type = ev.target.value;
      current.summary = summarize(current);
      await db.putSession(current);
      showDetail(current.id);
    };
    ul.appendChild(li);
  }
}

async function playClip(id, btn) {
  if (audio) { audio.pause(); URL.revokeObjectURL(audio.src); const was = audio.btn; audio = null; was.textContent = '▶'; if (was === btn) return; }
  const clip = await db.getClip(id);
  if (!clip) { btn.textContent = '–'; btn.title = 'Pas d\'extrait audio'; return; }
  audio = new Audio(URL.createObjectURL(clip.blob));
  audio.btn = btn;
  btn.textContent = '■';
  audio.onended = () => { btn.textContent = '▶'; URL.revokeObjectURL(audio.src); audio = null; };
  audio.play().catch(() => { btn.textContent = '▶'; });
}

function drawNight() {
  const c = $('nightChart'), g = setupCanvas(c), s = current;
  const W = c.clientWidth, H = c.clientHeight;
  const padL = 30, padB = 22, lane = 16;
  const t0 = s.start, t1 = Math.max(s.end || s.lastSeen || s.start, t0 + 60000);
  const x = t => padL + (t - t0) / (t1 - t0) * (W - padL - 8);
  const vals = s.samples.flatMap(p => [p.max, p.floor]);
  const vmin = Math.max(0, Math.floor((Math.min(...vals, 30) - 5) / 10) * 10);
  const vmax = Math.min(100, Math.ceil((Math.max(...vals, 50) + 5) / 10) * 10);
  const top = 8, bottom = H - padB - lane - 6;
  const y = v => bottom - (v - vmin) / (vmax - vmin) * (bottom - top);
  g.clearRect(0, 0, W, H);
  g.font = '11px system-ui'; g.fillStyle = '#9aa1d6'; g.strokeStyle = '#ffffff14';
  for (let v = vmin; v <= vmax; v += 10) {
    g.beginPath(); g.moveTo(padL, y(v)); g.lineTo(W - 8, y(v)); g.stroke();
    g.fillText(v, 4, y(v) + 4);
  }
  // heures
  const d = new Date(t0); d.setMinutes(0, 0, 0);
  const step = (t1 - t0) > 5 * 3600000 ? 2 : 1;
  for (let t = d.getTime() + 3600000; t < t1; t += 3600000) {
    if (new Date(t).getHours() % step) continue;
    g.fillText(pad(new Date(t).getHours()) + 'h', x(t) - 8, H - 6);
  }
  if (s.samples.length) {
    const pts = s.samples;
    const grad = g.createLinearGradient(0, top, 0, bottom);
    grad.addColorStop(0, '#8fd3ffaa'); grad.addColorStop(1, '#8fd3ff11');
    g.fillStyle = grad;
    g.beginPath(); g.moveTo(x(pts[0].t), bottom);
    pts.forEach(p => g.lineTo(x(p.t), y(p.max)));
    g.lineTo(x(pts[pts.length - 1].t), bottom); g.closePath(); g.fill();
    g.strokeStyle = '#f5d77a'; g.lineWidth = 1.5;
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(x(p.t), y(p.avg)) : g.moveTo(x(p.t), y(p.avg))); g.stroke();
    g.lineWidth = 1;
  }
  // bande des événements
  const ly = H - padB - lane;
  g.fillStyle = '#ffffff0c'; g.fillRect(padL, ly, W - padL - 8, lane);
  for (const e of s.events) {
    g.fillStyle = TYPES[e.type].color;
    g.fillRect(x(e.start), ly, Math.max(2, x(e.end) - x(e.start)), lane);
  }
}

// ---------------------------------------------------------------- navigation & réglages
function setDim(on) {
  $('dimmer').hidden = !on;
  if (window.Android) Android.setDim(on);
}

function show(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  const tab = view === 'detail' ? 'history' : view;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === tab));
  window.scrollTo(0, 0);
  if (view === 'history') renderHistory();
  if (view === 'settings') updateStorage();
}

async function updateStorage() {
  try {
    const e = await navigator.storage.estimate();
    $('storageTxt').textContent = (e.usage / 1048576).toFixed(1) + ' Mo';
  } catch { $('storageTxt').textContent = 'inconnu'; }
}

function bindSettings() {
  const bindRange = (id, txt, key, fmt = v => v) => {
    const el = $(id); el.value = settings[key];
    const upd = () => { settings[key] = +el.value; $(txt).textContent = fmt(+el.value); saveSettings(); };
    el.oninput = upd; upd();
  };
  bindRange('sens', 'sensTxt', 'sens', v => v <= 7 ? 'très sensible' : v <= 11 ? 'normale' : v <= 15 ? 'faible' : 'sons forts seulement');
  bindRange('clipMax', 'clipTxt', 'clipMax');
  bindRange('startDelay', 'delayTxt', 'startDelay');
  const ra = $('recordAudio');
  ra.checked = settings.recordAudio;
  ra.onchange = () => { settings.recordAudio = ra.checked; saveSettings(); };
}

// Récupère une nuit interrompue (onglet fermé, téléphone éteint…)
async function recoverSessions() {
  for (const s of await db.allSessions()) {
    if (s.status === 'running') {
      s.status = 'done';
      s.end = s.lastSeen || (s.samples.length ? s.samples[s.samples.length - 1].t : s.start);
      s.interrupted = true;
      s.summary = summarize(s);
      await db.putSession(s);
    }
  }
}

function init() {
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => show(b.dataset.view));
  $('btnStart').onclick = startNight;
  $('btnStop').onclick = stopNight;
  $('btnBack').onclick = () => show('history');
  $('btnDim').onclick = () => setDim(true);
  $('dimmer').ondblclick = () => setDim(false);
  let lastTap = 0;
  $('dimmer').addEventListener('touchend', e => {
    const n = Date.now();
    if (n - lastTap < 400) { setDim(false); e.preventDefault(); }
    lastTap = n;
  });
  // Bouton « retour » d'Android (appli APK)
  window.appBack = () => {
    if (!$('dimmer').hidden) setDim(false);
    else if ($('view-detail').classList.contains('active')) show('history');
    else if (!$('view-night').classList.contains('active')) show('night');
    else if (window.Android) Android.moveToBack();
  };
  $('btnDelete').onclick = async () => {
    if (!current || !confirm('Supprimer cette nuit et ses enregistrements ?')) return;
    await db.deleteSession(current.id);
    show('history');
  };
  $('btnExport').onclick = () => {
    if (!current) return;
    const json = JSON.stringify({ ...current, summary: summarize(current) }, null, 2);
    const name = `dodoscope-${new Date(current.start).toISOString().slice(0, 10)}.json`;
    if (window.Android) {
      const where = Android.saveFile(name, json);
      alert(where ? 'Fichier enregistré dans ' + where : "Impossible d'enregistrer le fichier.");
      return;
    }
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('btnWipe').onclick = async () => {
    if (!confirm('Effacer toutes les nuits et tous les enregistrements ?')) return;
    await db.wipe(); updateStorage();
  };
  window.addEventListener('beforeunload', e => { if (rec.session) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('resize', () => { if (current && $('view-detail').classList.contains('active')) drawNight(); });

  bindSettings();
  const clk = () => { $('clockIdle').textContent = hm(Date.now()); };
  clk(); setInterval(clk, 10000);

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    $('btnStart').disabled = true;
    $('btnStart').textContent = 'Micro indisponible (ouvre la page en https)';
  }
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch {}
  if (!window.Android && 'serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  recoverSessions().catch(() => {});
}

init();
