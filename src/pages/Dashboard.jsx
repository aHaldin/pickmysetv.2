import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import { createSession, setSessionSongs } from "../hooks/useSessionStore";
import { useSetlistsStore } from "../hooks/useSetlistsStore";

const emptySong = {
  id: null,
  title: "",
  artist: "",
  backingTrackUrl: "",
  lyrics: "",
  pdfName: "",
  pdfUrl: "",
};

export default function Dashboard() {
  const seoDescription =
    "Manage your PickMySet setlists, lyrics, and backing tracks in the performer dashboard.";
  const navigate = useNavigate();
  const {
    setlists,
    selectedId,
    currentSetlist,
    createSetlist,
    deleteSetlist,
    selectSetlist,
    addOrUpdateSong,
    removeSong,
    moveSong,
  } = useSetlistsStore();

  const [form, setForm] = useState(emptySong);
  const [editingId, setEditingId] = useState(null);
  const [sessionCode, setSessionCode] = useState("");
  const [viewLyricsSong, setViewLyricsSong] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [toast, setToast] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importFileName, setImportFileName] = useState("");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const titleRef = React.useRef(null);

  const hasSetlist = Boolean(currentSetlist);
  const audienceLink = sessionCode ? `${window.location.origin}/vote/${sessionCode}` : "";
  const performerLink = sessionCode ? `${window.location.origin}/performer/${sessionCode}` : "";

  const songs = currentSetlist?.songs || [];
  const stats = useMemo(() => {
    const total = songs.length;
    const withLyrics = songs.filter((s) => s.lyrics && s.lyrics.trim()).length;
    const withTracks = songs.filter((s) => s.backingTrackUrl && s.backingTrackUrl.trim()).length;
    const withPdfs = songs.filter((s) => s.pdfUrl && s.pdfUrl.trim()).length;
    return { total, withLyrics, withTracks, withPdfs };
  }, [songs]);
  const templateCsv = "setlist_name,song_title,artist,backing_track_url,lyrics\nMy Set,Song A,Artist A,http://...,Verse 1\\nVerse 2\n";

  const handleCreateSetlist = () => {
    const name = prompt("Setlist name");
    if (!name) return;
    createSetlist(name);
  };

  const handleDeleteSetlist = (id) => {
    if (!window.confirm("Delete this setlist?")) return;
    deleteSetlist(id);
  };

  const handleSubmitSong = (e) => {
    e.preventDefault();
    if (!currentSetlist) return;
    if (!form.title.trim()) return;
    const songId = editingId || `song-${Date.now()}`;
    addOrUpdateSong(currentSetlist.id, {
      ...form,
      id: songId,
    });
    setForm(emptySong);
    setEditingId(null);
    setTimeout(() => titleRef.current?.focus(), 0);
  };

  const handleEdit = (song) => {
    setForm(song);
    setEditingId(song.id);
  };

  const handlePdfChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, pdfName: file.name, pdfUrl: url }));
    setPdfPreviewUrl(url);
  };

  const handleCreateSession = () => {
    const listSongs = currentSetlist?.songs || [];
    const sessionSongs = listSongs.map((s, idx) => ({
      id: s.id || `song-${idx}`,
      title: s.title,
      artist: s.artist || "",
      backingTrackUrl: s.backingTrackUrl || "",
      lyrics: s.lyrics || "",
      pdfName: s.pdfName || "",
      pdfUrl: s.pdfUrl || "",
      votes: s.votes ?? 0,
    }));
    const code = createSession(sessionSongs);
    setSessionSongs(code, sessionSongs);
    setSessionCode(code);
  };

  const handleCopy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setToast("Copied");
      setTimeout(() => setToast(""), 1500);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const openPerformer = () => {
    if (sessionCode) navigate(`/performer/${sessionCode}`);
  };

  const openPdf = (song) => {
    if (song.pdfUrl) window.open(song.pdfUrl, "_blank", "noopener,noreferrer");
  };

  const getTemplateHref = () => {
    const content = "setlist_name,song_title,artist,backing_track_url,lyrics\nMy Set,Song A,Artist A,http://example.com,Verse 1\\nVerse 2\n";
    return `data:text/csv;charset=utf-8,${encodeURIComponent(content)}`;
  };

  const parseCsv = (text) => {
    const rows = [];
    const errors = [];
    const parsed = simpleCsvParse(text);
    parsed.forEach((cols, idx) => {
      if (!cols.length || cols.every((c) => !c.trim())) return;
      const [
        setlist_name = "",
        song_title = "",
        artist = "",
        backing_track_url = "",
        lyrics = "",
      ] = cols;

      const isHeader =
        idx === 0 &&
        setlist_name.trim().toLowerCase() === "setlist_name" &&
        song_title.trim().toLowerCase() === "song_title";
      if (isHeader) return;
      if (!song_title.trim()) {
        errors.push({ row: idx + 1, message: "Missing song_title" });
        rows.push({ setlist_name, song_title, artist, backing_track_url, lyrics, error: "Missing song_title" });
        return;
      }
      rows.push({
        setlist_name: setlist_name.trim(),
        song_title: song_title.trim(),
        artist: artist.trim(),
        backing_track_url: backing_track_url.trim(),
        lyrics,
      });
    });
    return { rows, errors };
  };

  const handleCsvFile = (e, setters) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== "string") return;
      const { rows, errors } = parseCsv(text);
      setters.setImportFileName(file.name);
      setters.setImportRows(rows);
      setters.setImportErrors(errors);
    };
    reader.readAsText(file);
  };

  const setlistSidebar = (
    <div className="glass-card rounded-3xl p-5 soft-border space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/60">Setlists</p>
          <h3 className="text-lg font-semibold text-white">Playlists</h3>
        </div>
        <button
          type="button"
          onClick={handleCreateSetlist}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
        >
          New
        </button>
      </div>
      <div className="space-y-2">
        {setlists.map((list) => (
          <div
            key={list.id}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
              list.id === selectedId ? "border-brandPink/60 bg-white/10" : "border-white/10 bg-white/5"
            }`}
          >
            <button
              type="button"
              onClick={() => selectSetlist(list.id)}
              className="text-left text-sm font-semibold text-white flex-1"
            >
              {list.name}
            </button>
            <button
              type="button"
              onClick={() => handleDeleteSetlist(list.id)}
              className="text-xs text-white/60 hover:text-white"
            >
              Delete
            </button>
          </div>
        ))}
        {!setlists.length && <p className="text-sm text-white/60">No setlists yet.</p>}
      </div>
    </div>
  );

  const songsPanel = (
    <div className="glass-card rounded-3xl p-5 soft-border space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/60">Songs</p>
          <h3 className="text-lg font-semibold text-white">{currentSetlist?.name || "Select a setlist"}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreateSession}
            disabled={!hasSetlist}
            className="button-glow rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 disabled:opacity-50"
          >
            Create session from setlist
          </button>
          {sessionCode && (
            <button
              type="button"
              onClick={openPerformer}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
            >
              Open performer
            </button>
          )}
        </div>
      </div>

      {sessionCode && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2 text-sm text-white/70">
          <LinkRow label="Session code" value={sessionCode} onCopy={() => handleCopy(sessionCode)} />
          <LinkRow label="Audience link" value={audienceLink} onCopy={() => handleCopy(audienceLink)} />
          <LinkRow label="Performer link" value={performerLink} onCopy={() => handleCopy(performerLink)} />
        </div>
      )}

      <form onSubmit={handleSubmitSong} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Song title *"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none focus:ring-2 focus:ring-brandPink/30 disabled:opacity-50"
            disabled={!hasSetlist}
            required
            ref={titleRef}
          />
          <input
            type="text"
            value={form.artist}
            onChange={(e) => setForm({ ...form, artist: e.target.value })}
            placeholder="Artist (optional)"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none focus:ring-2 focus:ring-brandPink/30 disabled:opacity-50"
            disabled={!hasSetlist}
          />
        </div>
        <input
          type="url"
          value={form.backingTrackUrl}
          onChange={(e) => setForm({ ...form, backingTrackUrl: e.target.value })}
          placeholder="Backing track URL (optional)"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none focus:ring-2 focus:ring-brandPink/30 disabled:opacity-50"
          disabled={!hasSetlist}
        />
        <textarea
          value={form.lyrics}
          onChange={(e) => setForm({ ...form, lyrics: e.target.value })}
          placeholder="Lyrics / notes (optional)"
          rows={3}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none focus:ring-2 focus:ring-brandPink/30 disabled:opacity-50"
          disabled={!hasSetlist}
        />
        <div className="flex flex-col gap-2">
          <label className="text-xs text-white/60">Attach PDF (optional)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfChange}
            disabled={!hasSetlist}
            className="block w-full text-sm text-white/80 file:mr-4 file:rounded-full file:border-0 file:bg-brandPurple/80 file:px-4 file:py-2 file:text-white file:font-semibold hover:file:bg-brandPink/80 disabled:opacity-50"
          />
          {form.pdfName && (
            <div className="space-y-2">
              <p className="text-xs text-white/60">Attached: {form.pdfName}</p>
              {form.pdfUrl && (
                <div
                  className="rounded-xl border border-white/10 bg-black/40 overflow-hidden cursor-pointer"
                  onClick={() => setPdfPreviewUrl(form.pdfUrl)}
                  title="Click to enlarge"
                >
                  <iframe title="PDF preview" src={form.pdfUrl} className="w-full h-40" />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!hasSetlist}
            className="button-glow inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 disabled:opacity-50"
          >
            {editingId ? "Save changes" : "Add song"}
          </button>
          <button
            type="button"
            disabled={!hasSetlist}
            onClick={() => setBulkOpen(true)}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-brandPink hover:bg-white/10 disabled:opacity-50"
          >
            Bulk add
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
          >
            Import from Google Sheets / CSV
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setForm(emptySong);
                setEditingId(null);
              }}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {songs.length === 0 && <p className="text-sm text-white/60">No songs yet.</p>}
        {songs.map((song, idx) => (
          <div
            key={song.id}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 space-y-2"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-white">{song.title}</p>
                <p className="text-xs text-white/60">{song.artist || "Artist N/A"}</p>
                <p className="text-xs text-white/60">Votes: —</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveSong(currentSetlist.id, song.id, -1)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveSong(currentSetlist.id, song.id, 1)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                >
                  ↓
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {song.lyrics && (
                <button
                  type="button"
                  onClick={() => setViewLyricsSong(song)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                >
                  View lyrics
                </button>
              )}
              {song.backingTrackUrl && (
                <a
                  href={song.backingTrackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                >
                  Track link
                </a>
              )}
              {song.pdfUrl && (
                <button
                  type="button"
                  onClick={() => openPdf(song)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                >
                  Open PDF
                </button>
              )}
              <button
                type="button"
                onClick={() => handleEdit(song)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => removeSong(currentSetlist.id, song.id)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {toast && (
        <div className="text-xs text-green-300">{toast}</div>
      )}
    </div>
  );

  return (
    <>
      <SEO
        title="Performer Dashboard | PickMySet"
        description={seoDescription}
        robots="noindex, nofollow"
      />
      <main className="py-10 space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Performer Dashboard</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold">Setlists & live sessions</h1>
        <p className="text-sm text-white/65">
          Build setlists, attach lyrics/PDFs, then launch live audience and performer screens.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card rounded-3xl p-5 soft-border space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Ready to go live?</p>
              <h3 className="text-lg font-semibold text-white">Pre-gig checklist</h3>
            </div>
          </div>
          <div className="space-y-2 text-sm text-white/80">
            <ChecklistItem label="Setlist selected" done={hasSetlist} />
            <ChecklistItem label="At least 1 song added" done={stats.total > 0} />
            <ChecklistItem label="Lyrics or PDF added" done={stats.withLyrics > 0 || stats.withPdfs > 0} />
            <ChecklistItem label="Session created" done={Boolean(sessionCode)} />
          </div>
        </div>
        <div className="glass-card rounded-3xl p-5 soft-border space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Setlist stats</p>
              <h3 className="text-lg font-semibold text-white">{currentSetlist?.name || "Select a setlist"}</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
            <StatTile label="Total songs" value={stats.total} />
            <StatTile label="With lyrics" value={stats.withLyrics} />
            <StatTile label="With tracks" value={stats.withTracks} />
            <StatTile label="With PDFs" value={stats.withPdfs} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">{setlistSidebar}</div>
        <div className="lg:col-span-2 space-y-6">{songsPanel}</div>
      </div>
    </main>

      {viewLyricsSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-midnight p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/60">Lyrics</p>
                <h4 className="text-xl font-semibold text-white">{viewLyricsSong.title}</h4>
                {viewLyricsSong.artist && <p className="text-sm text-white/60">{viewLyricsSong.artist}</p>}
              </div>
              <button
                type="button"
                onClick={() => setViewLyricsSong(null)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 whitespace-pre-wrap">
              {viewLyricsSong.lyrics}
            </div>
          </div>
        </div>
      )}

      {bulkOpen && (
        <Modal title="Bulk add songs" onClose={() => setBulkOpen(false)}>
          <div className="space-y-3 text-sm text-white/70">
            <p>Format: Title — Artist (artist optional). One song per line.</p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none focus:ring-2 focus:ring-brandPink/30"
              placeholder="Song A — Artist A\nSong B - Artist B\nSong C"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBulkOpen(false)}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!currentSetlist) return;
                  const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
                  let added = 0;
                  lines.forEach((line) => {
                    let title = line;
                    let artist = "";
                    if (line.includes("—")) {
                      const [t, a] = line.split("—");
                      title = t.trim();
                      artist = (a || "").trim();
                    } else if (line.includes(" - ")) {
                      const [t, a] = line.split(" - ");
                      title = t.trim();
                      artist = (a || "").trim();
                    }
                    if (!title) return;
                    addOrUpdateSong(currentSetlist.id, {
                      id: `song-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
                      title,
                      artist,
                      backingTrackUrl: "",
                      lyrics: "",
                      pdfName: "",
                      pdfUrl: "",
                    });
                    added += 1;
                  });
                  setBulkText("");
                  setBulkOpen(false);
                  setToast(added ? `Added ${added} songs` : "No songs added");
                  setTimeout(() => setToast(""), 2000);
                  setTimeout(() => titleRef.current?.focus(), 0);
                }}
                className="button-glow rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:opacity-95"
              >
                Add songs
              </button>
            </div>
          </div>
        </Modal>
      )}

      {importOpen && (
        <Modal title="Import from Google Sheets / CSV" onClose={() => setImportOpen(false)}>
          <div className="space-y-3 text-sm text-white/70">
      <div className="flex items-center justify-between gap-2">
        <p>Upload CSV (columns: setlist_name, song_title, artist, backing_track_url, lyrics)</p>
        <a
          className="text-xs text-brandPink hover:text-white underline"
          href={getTemplateHref()}
          download="pickmyset-template.csv"
        >
          Download CSV template
        </a>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleCsvFile(e, {
                setImportFileName,
                setImportRows,
                setImportErrors,
              })}
              className="block w-full text-sm text-white/80 file:mr-4 file:rounded-full file:border-0 file:bg-brandPurple/80 file:px-4 file:py-2 file:text-white file:font-semibold hover:file:bg-brandPink/80"
            />
            {importFileName && <p className="text-xs text-white/60">Loaded: {importFileName}</p>}
            {importRows.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                <p className="text-xs uppercase tracking-wide text-white/60">Preview (first 5)</p>
                <div className="space-y-1 text-xs text-white/70">
                  {importRows.slice(0, 5).map((row, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border px-2 py-1 ${row.error ? "border-brandPink/70 bg-brandPink/10" : "border-white/10 bg-white/5"}`}
                    >
                      <p className="text-white">{row.song_title || "(missing title)"}{row.artist ? ` — ${row.artist}` : ""}</p>
                      <p className="text-white/60">
                        Setlist: {row.setlist_name || currentSetlist?.name || "Current"} {row.error ? ` · ${row.error}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {importErrors.length > 0 && (
              <div className="rounded-xl border border-brandPink/50 bg-brandPink/10 p-3 text-xs text-white/80">
                {importErrors.map((err, idx) => (
                  <p key={idx}>Row {err.row}: {err.message}</p>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!importRows.length}
                onClick={() => {
                  if (!currentSetlist && !importRows.some((r) => r.setlist_name)) return;
                  let added = 0;
                  let lastSetlistId = currentSetlist?.id || null;
                  const ensureSetlistId = (name) => {
                    if (name) {
                      const existing = setlists.find((s) => s.name.toLowerCase() === name.toLowerCase());
                      if (existing) return existing.id;
                      const newId = createSetlist(name);
                      return newId;
                    }
                    return lastSetlistId;
                  };
                  importRows.forEach((row) => {
                    if (row.error || !row.song_title) return;
                    const targetId = ensureSetlistId(row.setlist_name);
                    if (!targetId) return;
                    lastSetlistId = targetId;
                    addOrUpdateSong(targetId, {
                      id: `song-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
                      title: row.song_title,
                      artist: row.artist || "",
                      backingTrackUrl: row.backing_track_url || "",
                      lyrics: row.lyrics || "",
                      pdfName: "",
                      pdfUrl: "",
                    });
                    added += 1;
                  });
                  setToast(added ? `Imported ${added} songs` : "No songs imported");
                  setImportOpen(false);
                  setImportRows([]);
                  setImportErrors([]);
                  setImportFileName("");
                  setBulkText("");
                  setTimeout(() => setToast(""), 2500);
                  setTimeout(() => titleRef.current?.focus(), 0);
                }}
                className="button-glow rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:opacity-95 disabled:opacity-50"
              >
                Import songs
              </button>
            </div>
          </div>
        </Modal>
      )}

      {pdfPreviewUrl && (
        <Modal title="PDF preview" onClose={() => setPdfPreviewUrl("")}>
          <div className="rounded-xl border border-white/10 bg-black/50 overflow-hidden">
            <iframe title="PDF preview" src={pdfPreviewUrl} className="w-full h-[70vh]" />
          </div>
        </Modal>
      )}
    </>
  );
}

function LinkRow({ label, value, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/70">
      <div className="truncate">
        <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
        <p className="truncate text-white">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
      >
        Copy
      </button>
    </div>
  );
}

function ChecklistItem({ label, done }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
          done ? "bg-green-500 text-white" : "bg-white/10 text-white/50"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <span className="text-sm text-white/80">{label}</span>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-midnight p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-white">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Lightweight CSV parser with quoted field and newline support
function simpleCsvParse(text) {
  const rows = [];
  let current = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    current.push(field);
    field = "";
  };
  const pushRow = () => {
    rows.push(current);
    current = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        pushField();
      } else if (char === "\n") {
        pushField();
        pushRow();
      } else if (char === "\r") {
        // ignore
      } else {
        field += char;
      }
    }
  }
  pushField();
  pushRow();
  return rows;
}
