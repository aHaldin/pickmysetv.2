import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  addSetlistItem,
  fetchSetlistItems,
  fetchSongsPage,
  removeSetlistItem,
  updateSetlist,
  updateSetlistItemPositions,
} from "../lib/data";

const PAGE_SIZE = 8;

export default function EditSetlistModal({
  isOpen,
  setlist,
  onClose,
  onToast,
  onRefreshSetlists,
  onRefreshSetlistItems,
}) {
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [librarySongs, setLibrarySongs] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryHasMore, setLibraryHasMore] = useState(true);
  const [librarySearch, setLibrarySearch] = useState("");
  const [setlistItems, setSetlistItems] = useState([]);
  const [setlistLoading, setSetlistLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setName(setlist?.name || "");
  }, [isOpen, setlist]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const loadSetlistItems = useCallback(async () => {
    if (!setlist?.id) return;
    setSetlistLoading(true);
    try {
      const items = await fetchSetlistItems(setlist.id);
      setSetlistItems(items);
    } catch (err) {
      setError(err?.message || "Unable to load setlist songs.");
    } finally {
      setSetlistLoading(false);
    }
  }, [setlist]);

  const loadLibrarySongs = useCallback(
    async ({ reset = true } = {}) => {
      setLibraryLoading(true);
      try {
        const from = reset ? 0 : librarySongs.length;
        const to = from + PAGE_SIZE - 1;
        const data = await fetchSongsPage({ search: librarySearch, from, to });
        setLibrarySongs((prev) => (reset ? data : [...prev, ...data]));
        setLibraryHasMore(data.length === PAGE_SIZE);
      } catch (err) {
        setError(err?.message || "Unable to load song library.");
      } finally {
        setLibraryLoading(false);
      }
    },
    [librarySearch, librarySongs.length]
  );

  useEffect(() => {
    if (!isOpen) return;
    loadSetlistItems();
  }, [isOpen, loadSetlistItems]);

  useEffect(() => {
    if (!isOpen) return;
    loadLibrarySongs({ reset: true });
  }, [isOpen, librarySearch, loadLibrarySongs]);

  const addedSongIds = useMemo(
    () => new Set(setlistItems.map((item) => item.song?.id)),
    [setlistItems]
  );

  const handleLoadMore = async () => {
    if (libraryLoading || !libraryHasMore) return;
    await loadLibrarySongs({ reset: false });
  };

  const handleRename = async () => {
    if (!setlist?.id || !name.trim()) return;
    if (name.trim() === setlist.name) return;
    setSavingName(true);
    try {
      await updateSetlist(setlist.id, { name: name.trim() });
      onToast?.("Setlist renamed");
      await onRefreshSetlists?.();
    } catch (err) {
      setError(err?.message || "Unable to rename setlist.");
    } finally {
      setSavingName(false);
    }
  };

  const handleAddSong = async (song) => {
    if (!setlist?.id) return;
    if (addedSongIds.has(song.id)) {
      onToast?.("Already in setlist");
      return;
    }
    try {
      const nextPosition = setlistItems.length + 1;
      const created = await addSetlistItem({
        setlist_id: setlist.id,
        song_id: song.id,
        position: nextPosition,
      });
      const nextItems = [...setlistItems, created].sort(
        (a, b) => a.position - b.position
      );
      setSetlistItems(nextItems);
      await onRefreshSetlistItems?.();
    } catch (err) {
      const message = err?.message || "";
      if (err?.code === "23505" || message.toLowerCase().includes("duplicate")) {
        onToast?.("Already in setlist");
      } else {
        setError(message || "Unable to add song to setlist.");
      }
    }
  };

  const reindexPositions = async (items) => {
    const reindexed = items.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));
    setSetlistItems(reindexed);
    if (reindexed.length) {
      await updateSetlistItemPositions(
        reindexed.map((item) => ({ id: item.id, position: item.position }))
      );
    }
    await onRefreshSetlistItems?.();
  };

  const handleRemove = async (itemId) => {
    try {
      await removeSetlistItem(itemId);
      const nextItems = setlistItems.filter((item) => item.id !== itemId);
      await reindexPositions(nextItems);
    } catch (err) {
      setError(err?.message || "Unable to remove song.");
    }
  };

  const handleMove = async (itemId, direction) => {
    const idx = setlistItems.findIndex((item) => item.id === itemId);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= setlistItems.length) return;
    const nextItems = [...setlistItems];
    const [moved] = nextItems.splice(idx, 1);
    nextItems.splice(target, 0, moved);
    try {
      await reindexPositions(nextItems);
    } catch (err) {
      setError(err?.message || "Unable to reorder setlist.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-2xl border border-white/15 bg-midnight p-6 shadow-soft space-y-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-lg font-semibold text-white">Edit setlist: {setlist?.name || ""}</h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-brandPink/40 bg-brandPink/10 px-4 py-3 text-sm text-white/80">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Rename setlist</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
              placeholder="Setlist name"
            />
            <button
              type="button"
              onClick={handleRename}
              disabled={savingName || !name.trim()}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10 disabled:opacity-60"
            >
              {savingName ? "Saving..." : "Save name"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-card rounded-2xl p-4 soft-border space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/60">Song library</p>
                <h3 className="text-lg font-semibold text-white">Add songs</h3>
              </div>
              <input
                type="text"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Search"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
              />
            </div>
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {libraryLoading && librarySongs.length === 0 && (
                <p className="text-sm text-white/60">Loading songs...</p>
              )}
              {!libraryLoading && librarySongs.length === 0 && (
                <p className="text-sm text-white/60">No songs found.</p>
              )}
              {librarySongs.map((song) => {
                const isAdded = addedSongIds.has(song.id);
                return (
                  <div
                    key={song.id}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{song.title}</p>
                      <p className="text-xs text-white/60">{song.original_artist || "Artist N/A"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSong(song)}
                      disabled={isAdded}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10 disabled:opacity-60"
                    >
                      {isAdded ? "Added" : "Add"}
                    </button>
                  </div>
                );
              })}
              {libraryHasMore && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={libraryLoading}
                  className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10 disabled:opacity-60"
                >
                  {libraryLoading ? "Loading..." : "Load more"}
                </button>
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 soft-border space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">This setlist</p>
              <h3 className="text-lg font-semibold text-white">Order songs</h3>
            </div>
            {setlistLoading && (
              <p className="text-sm text-white/60">Loading setlist songs...</p>
            )}
            {!setlistLoading && setlistItems.length === 0 && (
              <p className="text-sm text-white/60">Add songs from the library.</p>
            )}
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {setlistItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{idx + 1}. {item.song?.title}</p>
                      <p className="text-xs text-white/60">{item.song?.original_artist || "Artist N/A"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMove(item.id, -1)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(item.id, 1)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
