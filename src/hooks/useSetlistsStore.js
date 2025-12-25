import { useCallback, useState } from "react";

const STORAGE_KEY = "pickmyset:setlists:v1";

const DEFAULT_SONGS = [
  { id: "midnight-pulse", title: "Midnight Pulse", artist: "Solea", backingTrackUrl: "", lyrics: "", pdfName: "", pdfUrl: "" },
  { id: "neon-echoes", title: "Neon Echoes", artist: "Aero", backingTrackUrl: "", lyrics: "", pdfName: "", pdfUrl: "" },
  { id: "city-lights", title: "City Lights", artist: "Nova", backingTrackUrl: "", lyrics: "", pdfName: "", pdfUrl: "" },
  { id: "velvet-sky", title: "Velvet Sky", artist: "Lumen", backingTrackUrl: "", lyrics: "", pdfName: "", pdfUrl: "" },
];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = {
        setlists: [
          { id: "default", name: "Default Set", songs: DEFAULT_SONGS },
        ],
        selectedId: "default",
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load setlists", e);
    return { setlists: [], selectedId: null };
  }
}

function save(payload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error("Failed to save setlists", e);
  }
}

export function useSetlistsStore() {
  const [{ setlists, selectedId }, setState] = useState(() => load());

  const updateState = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      save(next);
      return next;
    });
  }, []);

  const createSetlist = useCallback((name) => {
    if (!name.trim()) return null;
    const id = `set-${Date.now()}`;
    updateState(({ setlists }) => ({
      setlists: [...setlists, { id, name: name.trim(), songs: [] }],
      selectedId: id,
    }));
    return id;
  }, [updateState]);

  const deleteSetlist = useCallback((id) => {
    updateState(({ setlists, selectedId }) => {
      const filtered = setlists.filter((s) => s.id !== id);
      const nextSelected = selectedId === id ? (filtered[0]?.id ?? null) : selectedId;
      return { setlists: filtered, selectedId: nextSelected };
    });
  }, [updateState]);

  const selectSetlist = useCallback((id) => {
    updateState((state) => ({ ...state, selectedId: id }));
  }, [updateState]);

  const addOrUpdateSong = useCallback((setlistId, song) => {
    updateState(({ setlists, selectedId }) => {
      const next = setlists.map((list) => {
        if (list.id !== setlistId) return list;
        const existingIdx = list.songs.findIndex((s) => s.id === song.id);
        if (existingIdx >= 0) {
          const copy = [...list.songs];
          copy[existingIdx] = song;
          return { ...list, songs: copy };
        }
        return { ...list, songs: [...list.songs, song] };
      });
      return { setlists: next, selectedId };
    });
  }, [updateState]);

  const removeSong = useCallback((setlistId, songId) => {
    updateState(({ setlists, selectedId }) => ({
      setlists: setlists.map((list) =>
        list.id === setlistId ? { ...list, songs: list.songs.filter((s) => s.id !== songId) } : list
      ),
      selectedId,
    }));
  }, [updateState]);

  const moveSong = useCallback((setlistId, songId, direction) => {
    updateState(({ setlists, selectedId }) => {
      const updated = setlists.map((list) => {
        if (list.id !== setlistId) return list;
        const idx = list.songs.findIndex((s) => s.id === songId);
        if (idx === -1) return list;
        const target = idx + direction;
        if (target < 0 || target >= list.songs.length) return list;
        const copy = [...list.songs];
        [copy[idx], copy[target]] = [copy[target], copy[idx]];
        return { ...list, songs: copy };
      });
      return { setlists: updated, selectedId };
    });
  }, [updateState]);

  const currentSetlist = setlists.find((s) => s.id === selectedId) || null;

  return {
    setlists,
    selectedId,
    currentSetlist,
    createSetlist,
    deleteSetlist,
    selectSetlist,
    addOrUpdateSong,
    removeSong,
    moveSong,
  };
}
