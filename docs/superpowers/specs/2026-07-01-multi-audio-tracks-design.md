# Multi-track audio with a default lane — Design

**Date:** 2026-07-01
**Status:** Approved (brainstorming)
**Area:** Editor · Audio

## Goal

Let users work with multiple audio tracks in the timeline, laid out as separate
stacked lanes:

- An audio lane is **always visible** by default (even before any audio exists).
- When a video with sound is uploaded, its **original audio** appears as a
  **fully-editable track** (move / trim / re-time / volume), just like uploaded
  audio.
- Image + voiceover already produces an audio track — keep it working unchanged.
- Users can add **background music** (or any audio) as **another track / lane**
  that plays over the whole video alongside the original audio.

## Current system (baseline)

- `AudioTrack` (`types/audio.types.ts`): `id, audioId, name, startTime, duration,
  volume, loop, trimStart?`. Uploaded audios and image voiceovers become
  `AudioTrack`s and render as fragments in a **single** audio row in the
  timeline (`Timeline.tsx` ~line 622), all absolutely positioned inside one lane.
- **Original video audio** is NOT a track. It plays from the `<video>` element,
  gated by `muteOriginalAudio`. `videoHasAudioTrack` (editor state) records
  whether the uploaded video has an audio stream (from
  `libraryVideo.originalHasAudio`).
- **Preview playback**: `audioElementsRef` holds one `HTMLAudioElement` per track;
  `syncAudioPlayback(videoTime, playing)` seeks/plays/pauses each element to match
  the playhead (`page.tsx` ~lines 963–1049).
- **Export**: `useVideoExport` mixes the source video audio (when
  `videoHasAudioTrack && !muteOriginalAudio`) with every `audioTracks[]` entry
  (each carrying `audioUrl, startTime, duration, trimStart, volume`) via FFmpeg
  `adelay` + `volume` + `amix`. The extracted original track therefore flows
  through the existing mix path with **no export changes required**.
- `LabelSidebar.tsx` renders a single hard-coded "Audio" label row, shown only
  when `audioTracksCount > 0`.

## Design

### 1. Data model

Add an optional discriminator to `AudioTrack`:

```ts
export interface AudioTrack {
  id: string;
  audioId: string;
  name: string;
  startTime: number;
  duration: number;
  volume: number;
  loop: boolean;
  trimStart?: number;
  kind?: 'original' | 'upload' | 'voiceover'; // default treated as 'upload'
}
```

- **One track = one lane** (one row). Lane order follows array order.
- Because each lane holds exactly one fragment, the same-lane collision math in
  `AudioFragmentTrackItem` (`boundaries` from `otherTracks`) is no longer needed;
  a fragment's bounds are simply `[0, videoDuration]`. `otherTracks` becomes
  unused for positioning (keep the prop or drop it — implementation detail).
- Background music = a normal `kind: 'upload'` track appended to the array.

### 2. Original video audio → extracted, fully-editable track

New util `lib/audio-extract.utils.ts`:

```ts
extractAudioFromVideo(file: Blob): Promise<{ url: string; duration: number } | null>
```

- Reads the file into an `ArrayBuffer`, decodes with
  `new AudioContext().decodeAudioData(...)` to an `AudioBuffer`.
- Encodes the `AudioBuffer` to a 16-bit PCM **WAV** `Blob`, returns an object URL
  + duration. Returns `null` if the file has no decodable audio.

Wiring in `handleVideoUpload` (`page.tsx`), for the **single primary video** path
(not the multi-clip append path), when `originalHasAudio` is true:

1. Show a lightweight "processing audio…" indicator.
2. `extractAudioFromVideo(file)` → register an `UploadedAudio`
   (`id, name: "Original audio", url, duration, fileSize, mimeType: 'audio/wav'`).
3. Create an `AudioTrack` with `kind: 'original'`, `audioId` = that upload,
   `startTime: 0`, `duration` = video duration, `volume: 1`, `loop: false`.
4. Set `muteOriginalAudio = true` so the `<video>` element is silent and audio
   comes from the synced `HTMLAudioElement` instead (no double audio).
5. If extraction fails, fall back to current behavior (original audio on the
   `<video>` element, no track) and leave `muteOriginalAudio` as-is.

Cleanup: revoke the extracted object URL when the track/upload is removed or when
a new primary video replaces it.

**Scope:** applies to the single primary uploaded video only. Multi-clip
concatenated videos keep their current per-clip original-audio behavior in this
pass.

**Trade-off (accepted):** WAV is uncompressed (~10 MB/min stereo). Fine for
typical demo clips; large for very long videos. Mitigated by the "processing"
state and the single-video scope.

### 3. Timeline: stacked lanes + always-visible default lane

`Timeline.tsx`:

- Replace the single audio row with **N rows**, one per `audioTracks` entry.
  Each row renders exactly that track's `AudioFragmentTrackItem`.
- When `audioTracks.length === 0`, render **one empty default lane** with a
  subtle affordance (e.g. muted "Add music" / drop hint) so an audio lane is
  always present.
- Row height and the timeline's overall height math must account for a variable
  number of lanes (currently the code assumes 0 or 1 audio row of `h-5`).

`LabelSidebar.tsx`:

- Accept the list of lanes (or their labels) instead of just a count.
- Render one label per lane: `Original` for `kind: 'original'`, otherwise the
  track name (or `Music` / `Voiceover`). Keep the Video and Zoom labels aligned
  with their rows.

### 4. AudioMenu & interactions

`AudioMenu.tsx`:

- Keep upload button + drag-and-drop.
- Track list mirrors lanes; show an "Original" badge on the `kind: 'original'`
  track.
- Deleting the original track removes its `UploadedAudio` + `AudioTrack` and
  revokes its URL; the `<video>` element stays muted (result = silence, which is
  the user's intent when deleting).
- Per-track volume/mute (`TrackVolumeSlider`) keeps working for every lane.
- The former global "mute original audio" control is effectively the original
  track's volume/mute now.

## Out of scope (this pass)

- Extracting/retiming original audio for multi-clip concatenated videos.
- Multiple fragments per lane (each lane holds one track).
- Waveform rendering inside fragments (keep current bar visual).
- Compressed (MP3/AAC) extraction instead of WAV.

## Affected files

- `types/audio.types.ts` — add `kind`; adjust `AudioFragmentTrackItemProps` /
  `LabelSidebar` props as needed.
- `lib/audio-extract.utils.ts` — new extraction + WAV encode util.
- `app/[locale]/(editor)/editor/page.tsx` — extraction wiring on primary video
  upload; original-track lifecycle; URL cleanup.
- `app/components/ui/editor/Timeline.tsx` — stacked lanes + default empty lane +
  height math.
- `app/components/ui/editor/LabelSidebar.tsx` — dynamic per-lane labels.
- `app/components/ui/editor/AudioFragmentTrackItem.tsx` — simplify bounds to
  `[0, videoDuration]` (own lane).
- `app/components/ui/editor/AudioMenu.tsx` — Original badge + list mirroring.
- `messages/{es,en,ru}.json` — new i18n keys (lane labels, "Original",
  processing state, empty-lane hint).

## Testing / verification

- Upload a video **with** audio → an "Original" lane appears, plays in sync,
  no doubled audio; export contains the audio.
- Upload a video **without** audio → default empty lane shown; no original track.
- Add background music → second lane; both play together; export mixes both.
- Image + voiceover → voiceover lane still works as before.
- Move/trim the original track → playback and export honor the new timing.
- Delete the original track → silence in preview and export.
