import React, { useCallback, useEffect, useMemo, useState } from "react";
import SEO from "../components/SEO";
import { getUser, onAuthStateChange } from "../lib/auth";
import EditSetlistModal from "../components/EditSetlistModal";
import SongLibraryModal from "../components/SongLibraryModal";
import { getSupabaseClient } from "../lib/supabaseClient";
import {
  addSetlistItem,
  createGig,
  createSetlist,
  createSong,
  createShareToken,
  deleteSetlistItemsBySong,
  deleteSong,
  deleteSetlist,
  deleteGig,
  fetchGigSubmissions,
  fetchGigs,
  fetchSetlistItems,
  fetchSetlists,
  fetchSubmissionItems,
  fetchSongs,
  fetchSongsPage,
  updateSong,
  upsertSetlistItems,
} from "../lib/data";

const STORAGE_KEY = "pickmyset:selectedSetlist";
const LEGACY_STORAGE_KEY = "pickmyset:setlists:v1";
const PAGE_SIZE = 8;

export default function Dashboard() {
  const seoDescription =
    "Manage your PickMySet song library, setlists, and client requests in the performer dashboard.";

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [songsHasMore, setSongsHasMore] = useState(true);
  const [songSearch, setSongSearch] = useState("");
  const [setlists, setSetlists] = useState([]);
  const [selectedSetlistId, setSelectedSetlistId] = useState(() =>
    localStorage.getItem(STORAGE_KEY)
  );
  const [setlistItems, setSetlistItems] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [songModalOpen, setSongModalOpen] = useState(false);
  const [songModalTab, setSongModalTab] = useState("add");
  const [editSetlistOpen, setEditSetlistOpen] = useState(false);
  const [editSetlistId, setEditSetlistId] = useState(null);
  const [creatingFromSubmissionId, setCreatingFromSubmissionId] = useState(null);
  const [importingLegacy, setImportingLegacy] = useState(false);
  const [hasLegacySetlists, setHasLegacySetlists] = useState(false);
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [submissionsGig, setSubmissionsGig] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [deleteGigTarget, setDeleteGigTarget] = useState(null);
  const [editSong, setEditSong] = useState(null);
  const [editSongForm, setEditSongForm] = useState({
    title: "",
    original_artist: "",
    backing_track_url: "",
    lyrics: "",
  });
  const [editSongSaving, setEditSongSaving] = useState(false);
  const [deleteSongTarget, setDeleteSongTarget] = useState(null);
  const [uploadingTrack, setUploadingTrack] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const [gigModalOpen, setGigModalOpen] = useState(false);
  const [gigForm, setGigForm] = useState({
    title: "",
    clientName: "",
    eventDate: "",
    baseSetlistId: "",
  });
  const [lastLink, setLastLink] = useState("");

  useEffect(() => {
    let unsubscribe;
    getUser()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    unsubscribe = onAuthStateChange((_evt, u) => setUser(u));
    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setHasLegacySetlists(Array.isArray(parsed?.setlists) && parsed.setlists.length > 0);
    } catch (err) {
      setHasLegacySetlists(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [setlistsData, gigsData] = await Promise.all([
          fetchSetlists(),
          fetchGigs(),
        ]);
        setSetlists(setlistsData);
        setGigs(gigsData);
        setError("");
        const hasStored = selectedSetlistId && setlistsData.some((s) => s.id === selectedSetlistId);
        if ((!selectedSetlistId || !hasStored) && setlistsData.length) {
          setSelectedSetlistId(setlistsData[0].id);
        }
      } catch (err) {
        setError(err?.message || "Unable to load your dashboard data.");
      }
    };
    load();
  }, [user, selectedSetlistId]);

  const loadSetlistItems = useCallback(async () => {
    if (!selectedSetlistId) return;
    try {
      const items = await fetchSetlistItems(selectedSetlistId);
      setSetlistItems(items);
    } catch (err) {
      setError(err?.message || "Unable to load setlist items.");
    }
  }, [selectedSetlistId]);

  useEffect(() => {
    if (!selectedSetlistId) return;
    localStorage.setItem(STORAGE_KEY, selectedSetlistId);
    loadSetlistItems();
  }, [selectedSetlistId, loadSetlistItems]);

  const loadSongs = useCallback(
    async ({ reset = true } = {}) => {
      if (!user) return;
      setSongsLoading(true);
      try {
        const from = reset ? 0 : songs.length;
        const to = from + PAGE_SIZE - 1;
        const data = await fetchSongsPage({ search: songSearch, from, to });
        setSongs((prev) => (reset ? data : [...prev, ...data]));
        setSongsHasMore(data.length === PAGE_SIZE);
        setError("");
      } catch (err) {
        setError(err?.message || "Unable to load songs.");
      } finally {
        setSongsLoading(false);
      }
    },
    [songSearch, songs.length, user]
  );

  useEffect(() => {
    loadSongs({ reset: true });
  }, [loadSongs]);

  const currentSetlist = useMemo(
    () => setlists.find((list) => list.id === selectedSetlistId) || null,
    [setlists, selectedSetlistId]
  );
  const editSetlist = useMemo(
    () => setlists.find((list) => list.id === editSetlistId) || currentSetlist,
    [setlists, editSetlistId, currentSetlist]
  );

  const setlistSongs = useMemo(
    () =>
      setlistItems.map((item) => ({
        ...item.song,
        itemId: item.id,
        position: item.position,
      })),
    [setlistItems]
  );

  const stats = useMemo(() => {
    const total = setlistSongs.length;
    const withLyrics = setlistSongs.filter((s) => s.lyrics?.trim()).length;
    const withTracks = setlistSongs.filter((s) => s.backing_track_url?.trim()).length;
    return { total, withLyrics, withTracks };
  }, [setlistSongs]);

  const checklist = {
    setlistSelected: Boolean(currentSetlist),
    songAdded: setlistSongs.length > 0,
    clientLinkCreated: gigs.length > 0,
    clientRequestReceived: gigs.some((gig) => (gig.client_submissions || []).length > 0),
  };

  const handleCreateSetlist = async () => {
    const name = prompt("Setlist name");
    if (!name) return;
    try {
      const created = await createSetlist({ name: name.trim(), user_id: user.id });
      setSetlists((prev) => [...prev, created]);
      setSelectedSetlistId(created.id);
      showToast("Setlist created");
    } catch (err) {
      setError(err?.message || "Unable to create setlist.");
    }
  };

  const handleDeleteSetlist = async (id) => {
    if (!window.confirm("Delete this setlist?")) return;
    try {
      await deleteSetlist(id);
      setSetlists((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (selectedSetlistId === id) {
          setSelectedSetlistId(next[0]?.id || "");
        }
        return next;
      });
      setSetlistItems([]);
    } catch (err) {
      setError(err?.message || "Unable to delete setlist.");
    }
  };



  const handleCreateGig = async (event) => {
    event.preventDefault();
    if (!gigForm.title.trim()) return;
    try {
      const shareToken = createShareToken();
      const created = await createGig({
        user_id: user.id,
        title: gigForm.title.trim(),
        client_name: gigForm.clientName?.trim() || null,
        event_date: gigForm.eventDate || null,
        share_token: shareToken,
        base_setlist_id: gigForm.baseSetlistId || null,
      });
      setGigs((prev) => [created, ...prev]);
      const link = `${window.location.origin}/c/${shareToken}`;
      setLastLink(link);
      setGigModalOpen(false);
      setGigForm({ title: "", clientName: "", eventDate: "", baseSetlistId: "" });
    } catch (err) {
      setError(err?.message || "Unable to create client link.");
    }
  };

  const handleOpenSubmissions = async (gig) => {
    setSubmissionsGig(gig);
    setSubmissionsModalOpen(true);
    setSubmissionsLoading(true);
    try {
      const data = await fetchGigSubmissions(gig.id);
      setSubmissions(data);
    } catch (err) {
      setError(err?.message || "Unable to load submissions.");
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleDeleteGig = async () => {
    if (!deleteGigTarget) return;
    try {
      await deleteGig(deleteGigTarget.id);
      setGigs((prev) => prev.filter((gig) => gig.id !== deleteGigTarget.id));
      showToast("Client link deleted");
    } catch (err) {
      setError(err?.message || "Unable to delete client link.");
    } finally {
      setDeleteGigTarget(null);
    }
  };

  const handleEditSong = (song) => {
    setEditSong(song);
    setEditSongForm({
      title: song.title || "",
      original_artist: song.original_artist || "",
      backing_track_url: song.backing_track_url || "",
      lyrics: song.lyrics || "",
    });
    setUploadMessage("");
  };

  const handleSaveSong = async (event) => {
    event.preventDefault();
    if (!editSong) return;
    if (!editSongForm.title.trim()) return;
    setEditSongSaving(true);
    try {
      await updateSong(editSong.id, {
        title: editSongForm.title.trim(),
        original_artist: editSongForm.original_artist.trim() || null,
        backing_track_url: editSongForm.backing_track_url.trim() || null,
        lyrics: editSongForm.lyrics.trim() || null,
      });
      await loadSongs({ reset: true });
      await loadSetlistItems();
      setEditSong(null);
      showToast("Song updated");
    } catch (err) {
      setError(err?.message || "Unable to update song.");
    } finally {
      setEditSongSaving(false);
    }
  };

  const handleUploadTrack = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !editSong || !user?.id) return;
    if (file.type !== "audio/mpeg" && !file.name.toLowerCase().endsWith(".mp3")) {
      setUploadMessage("Please select an MP3 file.");
      return;
    }
    setUploadingTrack(true);
    setUploadMessage("");
    try {
      const client = getSupabaseClient();
      if (!client) throw new Error("Supabase env missing.");
      const path = `user-${user.id}/${editSong.id}-${Date.now()}.mp3`;
      const { error: uploadError } = await client.storage
        .from("backing-tracks")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = client.storage.from("backing-tracks").getPublicUrl(path);
      const publicUrl = data?.publicUrl;
      if (!publicUrl) throw new Error("Unable to get public URL.");
      await updateSong(editSong.id, { backing_track_url: publicUrl });
      setEditSongForm((prev) => ({ ...prev, backing_track_url: publicUrl }));
      await loadSongs({ reset: true });
      showToast("MP3 uploaded");
      setUploadMessage("MP3 uploaded");
    } catch (err) {
      const message = err?.message || "Unable to upload MP3.";
      setUploadMessage(message);
      showToast(message);
    } finally {
      setUploadingTrack(false);
      event.target.value = "";
    }
  };

  const handleDeleteSong = async () => {
    if (!deleteSongTarget) return;
    try {
      await deleteSetlistItemsBySong(deleteSongTarget.id);
      await deleteSong(deleteSongTarget.id);
      await loadSongs({ reset: true });
      await loadSetlistItems();
      showToast("Song deleted");
    } catch (err) {
      setError(err?.message || "Unable to delete song.");
    } finally {
      setDeleteSongTarget(null);
    }
  };

  const handleCreateSetlistFromSubmission = async (gig, submission) => {
    if (!user?.id || !submission?.id) return;
    setCreatingFromSubmissionId(submission.id);
    try {
      const submittedDate = submission.submitted_at
        ? new Date(submission.submitted_at).toLocaleDateString()
        : new Date().toLocaleDateString();
      const name = `${gig.title} (Client Request ${submittedDate})`;
      const created = await createSetlist({ name, user_id: user.id });

      const items = await fetchSubmissionItems(submission.id);
      const payloads = items
        .filter((item) => item.song_id)
        .map((item) => ({
          setlist_id: created.id,
          song_id: item.song_id,
          position: item.position,
        }));
      await upsertSetlistItems(payloads);

      const data = await fetchSetlists();
      setSetlists(data);
      setSelectedSetlistId(created.id);
      showToast("Setlist created from client request");
    } catch (err) {
      setError(err?.message || "Unable to create setlist from submission.");
    } finally {
      setCreatingFromSubmissionId(null);
    }
  };

  const importLegacySetlists = async () => {
    if (!user?.id) return;
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      showToast("No local setlists found");
      return;
    }
    setImportingLegacy(true);
    try {
      const parsed = JSON.parse(raw);
      const legacyLists = Array.isArray(parsed?.setlists) ? parsed.setlists : [];
      if (!legacyLists.length) {
        showToast("No local setlists found");
        return;
      }

      const existingSongs = await fetchSongs();
      const songMap = new Map(
        existingSongs.map((song) => [
          `${song.title || ""}::${song.original_artist || ""}`.toLowerCase(),
          song.id,
        ])
      );

      for (const legacy of legacyLists) {
        if (!legacy?.name) continue;
        const createdSetlist = await createSetlist({ name: legacy.name, user_id: user.id });
        const legacySongs = Array.isArray(legacy.songs) ? legacy.songs : [];
        const itemsPayload = [];
        for (let i = 0; i < legacySongs.length; i += 1) {
          const legacySong = legacySongs[i];
          const title = legacySong?.title?.trim();
          if (!title) continue;
          const originalArtist = legacySong?.artist?.trim() || "";
          const key = `${title}::${originalArtist}`.toLowerCase();
          let songId = songMap.get(key);
          if (!songId) {
            const createdSong = await createSong({
              user_id: user.id,
              title,
              original_artist: originalArtist || null,
              backing_track_url: legacySong?.backingTrackUrl || null,
              lyrics: legacySong?.lyrics || null,
            });
            songId = createdSong.id;
            songMap.set(key, songId);
          }
          itemsPayload.push({
            setlist_id: createdSetlist.id,
            song_id: songId,
            position: i + 1,
          });
        }
        await upsertSetlistItems(itemsPayload);
      }

      const setlistsData = await fetchSetlists();
      setSetlists(setlistsData);
      await loadSongs({ reset: true });
      setHasLegacySetlists(false);
      showToast("Imported local setlists");
    } catch (err) {
      setError(err?.message || "Unable to import local setlists.");
    } finally {
      setImportingLegacy(false);
    }
  };

  const handleAddToSetlist = async (song) => {
    if (!currentSetlist) {
      showToast("Select a setlist first");
      return;
    }
    if (setlistItems.some((item) => item.song?.id === song.id)) {
      showToast("Already in setlist");
      return;
    }
    try {
      const nextPosition = setlistItems.length + 1;
      const created = await addSetlistItem({
        setlist_id: currentSetlist.id,
        song_id: song.id,
        position: nextPosition,
      });
      const nextItems = [...setlistItems, created].sort(
        (a, b) => a.position - b.position
      );
      setSetlistItems(nextItems);
    } catch (err) {
      const message = err?.message || "";
      if (err?.code === "23505" || message.toLowerCase().includes("duplicate")) {
        showToast("Already in setlist");
      } else {
        setError(message || "Unable to add song to setlist.");
      }
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 1500);
  };

  const handleCopy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied");
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const handleLoadMoreSongs = async () => {
    if (songsLoading || !songsHasMore) return;
    await loadSongs({ reset: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight text-white flex items-center justify-center">
        <p className="text-sm text-white/70">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <SEO title="Performer Dashboard | PickMySet" description={seoDescription} robots="noindex, nofollow" />
      <main className="py-10 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Performer Dashboard</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold">Setlists & client requests</h1>
            <p className="text-sm text-white/65">
              Build your song library, craft setlists, and collect client song requests for gigs.
            </p>
          </div>
          <a
            href="/perform"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
          >
            Open gig mode
          </a>
        </div>

        {error && (
          <div className="rounded-2xl border border-brandPink/40 bg-brandPink/10 px-4 py-3 text-sm text-white/80">
            {error}
          </div>
        )}

        <div className="glass-card rounded-3xl p-5 soft-border space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Status</p>
              <h3 className="text-lg font-semibold text-white">{currentSetlist?.name || "Select a setlist"}</h3>
            </div>
            <button
              type="button"
              onClick={() => setGigModalOpen(true)}
              className="button-glow rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
            >
              Create client link
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-white/80 sm:grid-cols-4">
            <StatTile label="Total songs" value={stats.total} />
            <StatTile label="With lyrics" value={stats.withLyrics} />
            <StatTile label="With tracks" value={stats.withTracks} />
            <StatTile label="Loaded songs" value={songs.length} />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-white/80">
            <ChecklistPill label="Setlist selected" done={checklist.setlistSelected} />
            <ChecklistPill label="At least 1 song added" done={checklist.songAdded} />
            <ChecklistPill label="Client link created" done={checklist.clientLinkCreated} />
            <ChecklistPill label="Client request received" done={checklist.clientRequestReceived} />
          </div>
          {lastLink && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
              <LinkRow label="Latest client link" value={lastLink} onCopy={() => handleCopy(lastLink)} />
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-5 soft-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60">Setlists</p>
                  <h3 className="text-lg font-semibold text-white">Build order</h3>
                </div>
                <button
                  type="button"
                  onClick={handleCreateSetlist}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                >
                  New
                </button>
              </div>
              {hasLegacySetlists && (
                <div className="rounded-2xl border border-brandPink/40 bg-brandPink/10 px-3 py-2 text-xs text-white/80 flex flex-wrap items-center justify-between gap-2">
                  <span>Local setlists found on this device.</span>
                  <button
                    type="button"
                    onClick={importLegacySetlists}
                    disabled={importingLegacy}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10 disabled:opacity-60"
                  >
                    {importingLegacy ? "Importing..." : "Import local setlists"}
                  </button>
                </div>
              )}
              <div className="space-y-2">
                {setlists.map((list) => (
                  <div
                    key={list.id}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                      list.id === selectedSetlistId
                        ? "border-brandPink/60 bg-white/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedSetlistId(list.id)}
                      className="text-left text-sm font-semibold text-white flex-1"
                    >
                      {list.name}
                    </button>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSetlistId(list.id);
                          setEditSetlistId(list.id);
                          setEditSetlistOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDeleteSetlist(list.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {!setlists.length && <p className="text-sm text-white/60">No setlists yet.</p>}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-5 soft-border space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/60">Selected setlist</p>
                <h3 className="text-lg font-semibold text-white">{currentSetlist?.name || "Select a setlist"}</h3>
              </div>
              <div className="text-sm text-white/70 space-y-2">
                <p>{setlistSongs.length} songs in this setlist.</p>
                <p className="text-xs text-white/60">Edit to add, reorder, or remove songs.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!currentSetlist) return;
                  setEditSetlistId(currentSetlist.id);
                  setEditSetlistOpen(true);
                }}
                disabled={!currentSetlist}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10 disabled:opacity-60"
              >
                Edit setlist
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-5 soft-border space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60">Song library</p>
                  <h3 className="text-lg font-semibold text-white">Your songs</h3>
                </div>
                <input
                  type="text"
                  value={songSearch}
                  onChange={(e) => setSongSearch(e.target.value)}
                  placeholder="Search"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSongModalTab("add");
                    setSongModalOpen(true);
                  }}
                  className="button-glow rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:opacity-95"
                >
                  + Add songs
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSongModalTab("import");
                    setSongModalOpen(true);
                  }}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                >
                  Import CSV
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {songsLoading && songs.length === 0 && (
                <p className="text-sm text-white/60">Loading songs...</p>
              )}
              {!songsLoading && songs.length === 0 && (
                <p className="text-sm text-white/60">No songs yet.</p>
              )}
              {songs.map((song) => (
                <div
                  key={song.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">{song.title}</p>
                      <p className="text-xs text-white/60">{song.original_artist || "Artist N/A"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddToSetlist(song)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditSong(song)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70 transition hover:border-brandPink hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteSongTarget(song)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70 transition hover:border-brandPink hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {song.lyrics && (
                      <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                        Lyrics
                      </span>
                    )}
                    {song.backing_track_url && (
                      <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                        Track link
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {songsHasMore && (
                <button
                  type="button"
                  onClick={handleLoadMoreSongs}
                  disabled={songsLoading}
                  className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10 disabled:opacity-60"
                >
                  {songsLoading ? "Loading..." : "Load more"}
                </button>
              )}
            </div>
          </div>

            </div>
          <div className="glass-card rounded-3xl p-5 soft-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/60">Client links</p>
                <h3 className="text-lg font-semibold text-white">Shareable gigs</h3>
              </div>
              <button
                type="button"
                onClick={() => setGigModalOpen(true)}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
              >
                New
              </button>
            </div>
            <div className="space-y-3">
              {gigs.length === 0 && <p className="text-sm text-white/60">No client links yet.</p>}
              {gigs.map((gig) => {
                const link = `${window.location.origin}/c/${gig.share_token}`;
                const submissions = gig.client_submissions || [];
                return (
                  <div key={gig.id} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{gig.title}</p>
                        <p className="text-xs text-white/60">
                          {gig.event_date ? new Date(gig.event_date).toLocaleDateString() : "Date TBD"}
                        </p>
                      </div>
                      <span className="text-xs text-white/60">
                        {submissions.length} submission{submissions.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(link)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                      >
                        Copy link
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenSubmissions(gig)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
                      >
                        View submissions
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteGigTarget(gig)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70 transition hover:border-brandPink hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {gigModalOpen && (
        <Modal title="Create client link" onClose={() => setGigModalOpen(false)}>
          <form onSubmit={handleCreateGig} className="space-y-4">
            <input
              type="text"
              value={gigForm.title}
              onChange={(e) => setGigForm({ ...gigForm, title: e.target.value })}
              placeholder="Gig title *"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
              required
            />
            <input
              type="text"
              value={gigForm.clientName}
              onChange={(e) => setGigForm({ ...gigForm, clientName: e.target.value })}
              placeholder="Client name (optional)"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
            />
            <input
              type="date"
              value={gigForm.eventDate}
              onChange={(e) => setGigForm({ ...gigForm, eventDate: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
            />
            <select
              value={gigForm.baseSetlistId}
              onChange={(e) => setGigForm({ ...gigForm, baseSetlistId: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-brandPink focus:outline-none"
            >
              <option value="">Base setlist (optional)</option>
              {setlists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setGigModalOpen(false)}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button-glow rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:opacity-95"
              >
                Create link
              </button>
            </div>
          </form>
        </Modal>
      )}

      {submissionsModalOpen && submissionsGig && (
        <Modal
          title={`Submissions — ${submissionsGig.title}`}
          onClose={() => {
            setSubmissionsModalOpen(false);
            setSubmissionsGig(null);
            setSubmissions([]);
          }}
        >
          <div className="space-y-3">
            {submissionsLoading && (
              <div className="space-y-3">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                    <div className="h-3 w-1/3 rounded bg-white/10" />
                    <div className="h-3 w-1/4 rounded bg-white/10" />
                    <div className="h-3 w-2/3 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            )}
            {!submissionsLoading && submissions.length === 0 && (
              <p className="text-sm text-white/60">No submissions yet.</p>
            )}
            {!submissionsLoading &&
              submissions.map((submission) => (
                <div key={submission.id} className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{new Date(submission.submitted_at).toLocaleString()}</span>
                    <span>{submission.items?.length || 0} songs</span>
                  </div>
                  {submission.notes && (
                    <p className="text-sm text-white/70">Notes: {submission.notes}</p>
                  )}
                  <ol className="text-sm text-white/80 space-y-1">
                    {(submission.items || [])
                      .slice()
                      .sort((a, b) => a.position - b.position)
                      .map((item, idx) => (
                        <li key={item.id}>
                          {idx + 1}. {item.song?.title || "Unknown song"}
                        </li>
                      ))}
                  </ol>
                  <button
                    type="button"
                    onClick={() => handleCreateSetlistFromSubmission(submissionsGig, submission)}
                    disabled={creatingFromSubmissionId === submission.id}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10 disabled:opacity-60"
                  >
                    {creatingFromSubmissionId === submission.id
                      ? "Creating setlist..."
                      : "Create setlist from this"}
                  </button>
                </div>
              ))}
          </div>
        </Modal>
      )}

      {deleteGigTarget && (
        <Modal title="Delete client link?" onClose={() => setDeleteGigTarget(null)}>
          <p className="text-sm text-white/70">
            This will delete the share link and all submissions for this gig.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteGigTarget(null)}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteGig}
              className="rounded-full border border-brandPink/60 bg-brandPink/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brandPink/30"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}

      <EditSetlistModal
        isOpen={editSetlistOpen}
        setlist={editSetlist}
        onClose={() => {
          setEditSetlistOpen(false);
          setEditSetlistId(null);
        }}
        onToast={showToast}
        onRefreshSetlists={async () => {
          try {
            const data = await fetchSetlists();
            setSetlists(data);
          } catch (err) {
            setError(err?.message || "Unable to refresh setlists.");
          }
        }}
        onRefreshSetlistItems={loadSetlistItems}
      />

      <SongLibraryModal
        isOpen={songModalOpen}
        initialTab={songModalTab}
        userId={user?.id}
        onClose={() => setSongModalOpen(false)}
        onRefresh={() => loadSongs({ reset: true })}
        onToast={showToast}
      />

      {editSong && (
        <Modal title="Edit song" onClose={() => setEditSong(null)}>
          <form onSubmit={handleSaveSong} className="space-y-4">
            <input
              type="text"
              value={editSongForm.title}
              onChange={(e) => setEditSongForm({ ...editSongForm, title: e.target.value })}
              placeholder="Song title *"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
              required
            />
            <input
              type="text"
              value={editSongForm.original_artist}
              onChange={(e) => setEditSongForm({ ...editSongForm, original_artist: e.target.value })}
              placeholder="Original artist (optional)"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
            />
            <input
              type="url"
              value={editSongForm.backing_track_url}
              onChange={(e) => setEditSongForm({ ...editSongForm, backing_track_url: e.target.value })}
              placeholder="Backing track URL (optional)"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
            />
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.25em] text-white/60">Upload MP3</label>
              <input
                type="file"
                accept="audio/mpeg,.mp3"
                onChange={handleUploadTrack}
                disabled={uploadingTrack}
                className="block w-full text-sm text-white/80 file:mr-4 file:rounded-full file:border-0 file:bg-brandPurple/80 file:px-4 file:py-2 file:text-white file:font-semibold hover:file:bg-brandPink/80 disabled:opacity-60"
              />
              {uploadMessage && (
                <p className="text-xs text-white/60">{uploadMessage}</p>
              )}
              {editSongForm.backing_track_url && (
                <audio controls src={editSongForm.backing_track_url} className="w-full" />
              )}
            </div>
            <textarea
              value={editSongForm.lyrics}
              onChange={(e) => setEditSongForm({ ...editSongForm, lyrics: e.target.value })}
              placeholder="Lyrics (optional)"
              rows={4}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brandPink focus:outline-none"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditSong(null)}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSongSaving}
                className="button-glow rounded-full bg-gradient-to-r from-brandPurple to-brandPink px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:opacity-95 disabled:opacity-60"
              >
                {editSongSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteSongTarget && (
        <Modal title="Delete song?" onClose={() => setDeleteSongTarget(null)}>
          <p className="text-sm text-white/70">This will remove it from all setlists.</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteSongTarget(null)}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandPink hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteSong}
              className="rounded-full border border-brandPink/60 bg-brandPink/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brandPink/30"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}

      {toast && <div className="text-xs text-green-300">{toast}</div>}
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

function ChecklistPill({ label, done }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        done
          ? "border-green-400/40 bg-green-400/10 text-green-200"
          : "border-white/10 bg-white/5 text-white/70"
      }`}
    >
      <span className="text-[10px]">{done ? "✓" : "•"}</span>
      {label}
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
  React.useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-white/15 bg-midnight p-6 shadow-soft space-y-4"
        onClick={(event) => event.stopPropagation()}
      >
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
