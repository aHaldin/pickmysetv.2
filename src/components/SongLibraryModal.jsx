import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { createSong, insertSongsBatch } from "../lib/data";

const emptyForm = {
  title: "",
  original_artist: "",
  backing_track_url: "",
  lyrics: "",
};

export default function SongLibraryModal({
  isOpen,
  initialTab = "add",
  userId,
  onClose,
  onRefresh,
  onToast,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setError("");
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const previewRows = useMemo(() => parsedRows.slice(0, 15), [parsedRows]);
  const totalRows = parsedRows.length;
  const validRows = parsedRows.filter((row) => row.title);
  const skippedRows = totalRows - validRows.length;

  const handleSaveSong = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await createSong({
        user_id: userId,
        title: form.title.trim(),
        original_artist: form.original_artist.trim() || null,
        backing_track_url: form.backing_track_url.trim() || null,
        lyrics: form.lyrics.trim() || null,
      });
      setForm(emptyForm);
      onToast?.("Song saved");
      onRefresh?.();
    } catch (err) {
      setError(err?.message || "Unable to save song.");
    } finally {
      setSaving(false);
    }
  };

  const handleCsvFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError("");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) =>
        header.trim().toLowerCase().replace(/\s+/g, "_"),
      complete: (results) => {
        const rows = (results.data || []).map((row) => ({
          title: (row.title || "").trim(),
          original_artist: (row.original_artist || "").trim(),
          backing_track_url: (row.backing_track_url || "").trim(),
          lyrics: (row.lyrics || "").trim(),
        }));
        setParsedRows(rows);
      },
      error: (err) => {
        setError(err?.message || "Unable to parse CSV.");
      },
    });
  };

  const handleImport = async () => {
    if (!validRows.length || importing) return;
    setImporting(true);
    setError("");
    let imported = 0;
    try {
      for (let i = 0; i < validRows.length; i += 100) {
        const batch = validRows.slice(i, i + 100).map((row) => ({
          user_id: userId,
          title: row.title,
          original_artist: row.original_artist || null,
          backing_track_url: row.backing_track_url || null,
          lyrics: row.lyrics || null,
        }));
        await insertSongsBatch(batch);
        imported += batch.length;
      }
      onToast?.(`Imported ${imported} songs`);
      setParsedRows([]);
      setFileName("");
      onRefresh?.();
    } catch (err) {
      setError(err?.message || "Unable to import songs.");
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-midnight p-6 shadow-soft space-y-5">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-white">Add songs to your library</h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("add")}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeTab === "add"
                ? "bg-white/10 text-white"
                : "border border-white/15 bg-white/5 text-white/70 hover:text-white"
            }`}
          >
            Add one
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeTab === "import"
                ? "bg-white/10 text-white"
                : "border border-white/15 bg-white/5 text-white/70 hover:text-white"
            }`}
          >
            Import CSV
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-brandPink/40 bg-brandPink/10 px-4 py-3 text-sm text-white/80">
            {error}
          </div>
        )}

        {activeTab === "add" ? (
          <form onSubmit={handleSaveSong} className="space-y-4">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Song title *"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
              required
            />
            <input
              type="text"
              value={form.original_artist}
              onChange={(e) => setForm({ ...form, original_artist: e.target.value })}
              placeholder="Original artist (optional)"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
            />
            <input
              type="url"
              value={form.backing_track_url}
              onChange={(e) => setForm({ ...form, backing_track_url: e.target.value })}
              placeholder="Backing track URL (optional)"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
            />
            <textarea
              value={form.lyrics}
              onChange={(e) => setForm({ ...form, lyrics: e.target.value })}
              placeholder="Lyrics (optional)"
              rows={4}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="button-glow rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:opacity-95 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save song"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2 text-sm text-white/70">
              <p>Upload a CSV with headers:</p>
              <p className="text-xs text-white/60">title (required), original_artist, backing_track_url, lyrics</p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFile}
              className="block w-full text-sm text-white/80 file:mr-4 file:rounded-full file:border-0 file:bg-brandPurple/80 file:px-4 file:py-2 file:text-white file:font-semibold hover:file:bg-brandPink/80"
            />
            {fileName && <p className="text-xs text-white/60">Loaded: {fileName}</p>}
            {totalRows > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex flex-wrap gap-3 text-xs text-white/60">
                  <span>Total rows: {totalRows}</span>
                  <span>Valid rows: {validRows.length}</span>
                  <span>Skipped: {skippedRows}</span>
                </div>
                <div className="space-y-2 text-xs text-white/70 max-h-56 overflow-y-auto pr-1">
                  {previewRows.map((row, idx) => (
                    <div
                      key={`${row.title}-${idx}`}
                      className={`rounded-lg border px-3 py-2 ${
                        row.title ? "border-white/10 bg-white/5" : "border-brandPink/40 bg-brandPink/10"
                      }`}
                    >
                      <p className="text-white">{row.title || "(missing title)"}</p>
                      <p className="text-white/60">
                        {row.original_artist || "Artist N/A"} {row.backing_track_url ? "· Track" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!validRows.length || importing}
                onClick={handleImport}
                className="button-glow rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:opacity-95 disabled:opacity-60"
              >
                {importing ? "Importing..." : "Import songs"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
