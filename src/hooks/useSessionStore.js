const STORAGE_KEY = 'pms_sessions';
const KEY_PREFIX = "pickmyset:session:";

export const sessionKey = (code) => `${KEY_PREFIX}${code}`;

export function subscribeToSession(code, onChange) {
  const key = sessionKey(code);
  const handler = (e) => {
    if (e.key === key) onChange();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

const INITIAL_SONGS = [
  {
    id: 1,
    title: 'Midnight Pulse',
    artist: 'Solea',
    votes: 182,
    backingTrackUrl: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    lyrics: `Neon clocks on the corner say the night is ours
Heartbeat in the kick drum, city in the stars
Hold the line, hold the light, keep the fire close
When the chorus lifts, let the midnight pulse

Verse two, we ride the rhythm through the haze
Shadows dance in silver, tracing out the phase
Hands up, slow burn, feel the echo grow
Every step in time with the undertow

Pre-chorus, we breathe, we rise, we fall
Counting every spark against the wall
If the lights go out, we carry the glow
Midnight pulse, take us home`,
  },
  {
    id: 2,
    title: 'Neon Echoes',
    artist: 'Aero',
    votes: 164,
    backingTrackUrl: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
    lyrics: `Streetlights draw the melody
Echoes rise, then fall
Every voice in harmony
We hear it all

Side streets hum a quiet tune
Footsteps in the rain
We sing it back to every room
Like medicine for pain

Hold the note, let it glow
Neon echoes in the smoke
Call it out, call it home
Every heartbeat finds the road`,
  },
  {
    id: 3,
    title: 'City Lights',
    artist: 'Nova',
    votes: 143,
    backingTrackUrl: 'https://open.spotify.com/track/6habFhsOp2NvshLv26DqMb',
    lyrics: `Rooftop breeze, the skyline sings
City lights on silver strings
We lift our hands, we lift our eyes
Chasing sparks across the night

Sirens fade to distant drums
Every block a steady hum
We are waves, we are the sound
Rolling through this sleepless town

Bridge:
Let the windows glow
Let the radios know
We are here, we are now
Under city lights we bow`,
  },
  {
    id: 4,
    title: 'Velvet Sky',
    artist: 'Lumen',
    votes: 118,
    backingTrackUrl: 'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3',
    lyrics: `Velvet sky, hold me close
Soft as sound, a gentle dose
Every note a falling tide
Every heart an open wide

We drift in slow electric blue
All the silence breaking through
If the night could sing a line
It would rhyme with you

Take the chorus, take the air
Let it settle everywhere
Velvet sky, we fade to gold
In the hush, in the hold`,
  },
];

const cloneSongs = (songs) => songs.map((s) => ({ ...s }));

const withDefaults = (songs) => {
  const byId = new Map(INITIAL_SONGS.map((song) => [song.id, song]));
  return songs.map((song) => {
    const defaults = byId.get(song.id);
    if (!defaults) return { ...song };
    return {
      ...defaults,
      ...song,
      backingTrackUrl: song.backingTrackUrl ?? defaults.backingTrackUrl,
      lyrics: song.lyrics ?? defaults.lyrics,
      pdfUrl: song.pdfUrl ?? defaults.pdfUrl,
    };
  });
};

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.error('Failed to load sessions', e);
    return {};
  }
}

function saveSessions(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions', e);
  }
}

function touchSession(code) {
  try {
    localStorage.setItem(sessionKey(code), Date.now().toString());
  } catch (e) {
    console.error('Failed to touch session key', e);
  }
}

function generateCode(existing) {
  let code = '';
  do {
    const num = Math.floor(1000 + Math.random() * 9000);
    code = `PMS-${num}`;
  } while (existing[code]);
  return code;
}

function normalizeRecord(record) {
  if (Array.isArray(record)) {
    return { songs: withDefaults(record), baseSongs: cloneSongs(INITIAL_SONGS), pdfInfo: null };
  }
  const songs = record?.songs ? withDefaults(record.songs) : cloneSongs(INITIAL_SONGS);
  const baseSongs = record?.baseSongs ? withDefaults(record.baseSongs) : cloneSongs(songs);
  return { songs, baseSongs, pdfInfo: record?.pdfInfo ?? null };
}

function ensureSession(code, sessions, initialSongs = INITIAL_SONGS) {
  const upper = code.toUpperCase();
  if (!sessions[upper]) {
    sessions[upper] = { songs: cloneSongs(initialSongs), baseSongs: cloneSongs(initialSongs), pdfInfo: null };
    saveSessions(sessions);
    touchSession(upper);
  } else if (Array.isArray(sessions[upper])) {
    sessions[upper] = normalizeRecord(sessions[upper]);
    saveSessions(sessions);
  }
  const normalized = normalizeRecord(sessions[upper]);
  sessions[upper] = normalized;
  return { code: upper, ...normalizeRecord(sessions[upper]) };
}

export function createSession(initialSongs = INITIAL_SONGS) {
  const sessions = loadSessions();
  const code = generateCode(sessions);
  sessions[code] = { songs: cloneSongs(initialSongs), baseSongs: cloneSongs(initialSongs), pdfInfo: null };
  saveSessions(sessions);
  touchSession(code);
  return code;
}

export function getSession(code) {
  const sessions = loadSessions();
  if (!code) return { code: null, songs: cloneSongs(INITIAL_SONGS), baseSongs: cloneSongs(INITIAL_SONGS), pdfInfo: null };
  return ensureSession(code, sessions);
}

export function setSessionSongs(code, songs) {
  if (!code) return;
  const sessions = loadSessions();
  const { code: normalized } = ensureSession(code, sessions, songs);
  sessions[normalized] = {
    songs: cloneSongs(songs),
    baseSongs: cloneSongs(songs),
    pdfInfo: sessions[normalized]?.pdfInfo ?? null,
  };
  saveSessions(sessions);
  touchSession(normalized);
}

export function vote(code, songId) {
  if (!code) return [];
  const sessions = loadSessions();
  const { code: normalized } = ensureSession(code, sessions);
  const record = normalizeRecord(sessions[normalized]);
  const updated = record.songs.map((song) =>
    song.id === songId ? { ...song, votes: song.votes + 1 } : song
  );
  sessions[normalized] = { ...record, songs: updated };
  saveSessions(sessions);
  touchSession(normalized);
  return cloneSongs(updated);
}

export function reset(code) {
  if (!code) return [];
  const sessions = loadSessions();
  const { code: normalized } = ensureSession(code, sessions);
  const record = normalizeRecord(sessions[normalized]);
  const resetSongs = cloneSongs(record.baseSongs ?? INITIAL_SONGS);
  sessions[normalized] = { ...record, songs: resetSongs };
  saveSessions(sessions);
  touchSession(normalized);
  return cloneSongs(resetSongs);
}

export function setPdfInfo(code, info) {
  if (!code) return;
  const sessions = loadSessions();
  const { code: normalized } = ensureSession(code, sessions);
  const record = normalizeRecord(sessions[normalized]);
  sessions[normalized] = { ...record, pdfInfo: info };
  saveSessions(sessions);
  touchSession(normalized);
}
