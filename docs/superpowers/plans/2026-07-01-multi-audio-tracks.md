# Multi-track Audio with Default Lane — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Represent each audio source as its own stacked lane in the timeline, always show one audio lane by default, and turn an uploaded video's original audio into a fully-editable extracted track that plays and exports through the existing audio pipeline.

**Architecture:** Original video audio is decoded to a WAV blob and registered as a normal `UploadedAudio` + `AudioTrack` (`kind: 'original'`), with the `<video>` element muted so audio comes from the existing per-track `HTMLAudioElement` sync and the existing FFmpeg `amix` export path — no new playback/export machinery. The timeline renders one row per track (one track = one lane) plus a default empty lane, with dynamic per-lane labels.

**Tech Stack:** Next.js 16 / React 19 / TypeScript, Web Audio API (`AudioContext.decodeAudioData`), Framer Motion, next-intl, Tailwind 4.

## Global Constraints

- No frontend unit-test framework exists. Verification cycle for every task: `pnpm lint` (from repo root) → `pnpm build` (TypeScript typecheck) → manual in-app check → commit. Never claim a step passes without running the command.
- Default UI language is `es`; every user-visible string uses `useTranslations(...)` and must be added to all three of `messages/es.json`, `messages/en.json`, `messages/ru.json`.
- `MAX_AUDIO_TRACKS = 5`; the default empty lane is purely visual and does NOT count toward this limit.
- Preserve visual fidelity between DOM preview and canvas export; this feature does not touch `drawFrame`, but do not regress existing audio export behavior.
- Work happens on the existing `audiotracks` branch. Commit after each task.
- Windows/PowerShell environment: run `pnpm` commands from the repo root `c:/Users/praka/OneDrive/Desktop/Products/openvid`.

---

### Task 1: Add `kind` discriminator to `AudioTrack`

**Files:**
- Modify: `types/audio.types.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `AudioTrack.kind?: 'original' | 'upload' | 'voiceover'` — used by Tasks 3, 5, 7. Absent `kind` is treated as `'upload'`.

- [ ] **Step 1: Add the field**

In `types/audio.types.ts`, update the `AudioTrack` interface:

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
    /** Source of this track. Absent is treated as 'upload'. */
    kind?: 'original' | 'upload' | 'voiceover';
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm build`
Expected: build succeeds (the new optional field breaks nothing existing).

- [ ] **Step 3: Commit**

```bash
git add types/audio.types.ts
git commit -m "feat(audio): add kind discriminator to AudioTrack"
```

---

### Task 2: WAV extraction utility

**Files:**
- Create: `lib/audio-extract.utils.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `extractAudioFromVideo(file: Blob): Promise<{ url: string; duration: number } | null>` — decodes the file's audio and returns a WAV object URL + duration in seconds, or `null` if there is no decodable audio. Used by Task 3.

- [ ] **Step 1: Create the util**

Create `lib/audio-extract.utils.ts`:

```ts
/**
 * Extract a video/audio file's audio stream into a standalone WAV object URL.
 *
 * Uses Web Audio API `decodeAudioData` to decode the full file, then encodes
 * the resulting AudioBuffer to 16-bit PCM WAV. Returns null when the file has
 * no decodable audio (e.g. a silent screen recording).
 *
 * Note: WAV is uncompressed (~10 MB per stereo minute). Intended for the single
 * primary uploaded video, not arbitrarily long media.
 */
export async function extractAudioFromVideo(
    file: Blob,
): Promise<{ url: string; duration: number } | null> {
    const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
    if (!AudioCtx) return null;

    const ctx = new AudioCtx();
    try {
        const arrayBuffer = await file.arrayBuffer();
        let audioBuffer: AudioBuffer;
        try {
            audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        } catch {
            return null; // no decodable audio stream
        }
        if (!audioBuffer || audioBuffer.length === 0) return null;

        const wavBlob = encodeWav(audioBuffer);
        return { url: URL.createObjectURL(wavBlob), duration: audioBuffer.duration };
    } finally {
        // Release the decoding context; the WAV blob URL is independent of it.
        void ctx.close();
    }
}

/** Encode an AudioBuffer to a 16-bit PCM WAV Blob. */
function encodeWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const numFrames = buffer.length;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = numFrames * blockAlign;

    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);          // PCM chunk size
    view.setUint16(20, 1, true);           // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 8 * bytesPerSample, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);

    // Interleave channels and clamp to 16-bit signed range.
    const channels: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

    let offset = 44;
    for (let i = 0; i < numFrames; i++) {
        for (let c = 0; c < numChannels; c++) {
            let sample = channels[c][i];
            sample = Math.max(-1, Math.min(1, sample));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
            offset += 2;
        }
    }

    return new Blob([view], { type: "audio/wav" });
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm build` then `pnpm lint`
Expected: both succeed; no unused-var or type errors in `lib/audio-extract.utils.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/audio-extract.utils.ts
git commit -m "feat(audio): add extractAudioFromVideo WAV utility"
```

---

### Task 3: Wire original-audio extraction into primary video upload

**Files:**
- Modify: `app/[locale]/(editor)/editor/page.tsx` (inside `handleVideoUpload`, ~lines 1714–1719; add a helper near the other audio handlers ~line 1330)

**Interfaces:**
- Consumes: `extractAudioFromVideo` (Task 2); `AudioTrack.kind` (Task 1); existing `setUploadedAudios`, `setAudioTracks`, `setMuteOriginalAudio`, `uploadedAudiosRef`, `videoHasAudioTrack`/`setVideoHasAudioTrack`.
- Produces: an `UploadedAudio` (`mimeType: 'audio/wav'`, `name` from i18n) + an `AudioTrack` with `kind: 'original'`, `startTime: 0`, `duration` = video duration, present in `audioTracks` after a video with audio is uploaded. Consumed visually by Tasks 4/5/7.

- [ ] **Step 1: Add an `extractOriginalAudioTrack` helper**

Near the other audio handlers in `page.tsx` (after `handleAudioDelete`, ~line 1342), add:

```tsx
// Extract the primary video's original audio into a fully-editable track.
// Mutes the <video> element so audio comes from the synced HTMLAudioElement.
const extractOriginalAudioTrack = useCallback(async (file: Blob, duration: number) => {
    try {
        const result = await extractAudioFromVideo(file);
        if (!result) return false;

        const audioId = `audio-original-${Date.now()}`;
        const newAudio: import("@/types/audio.types").UploadedAudio = {
            id: audioId,
            name: originalAudioLabel,
            url: result.url,
            duration: result.duration,
            fileSize: 0,
            mimeType: "audio/wav",
        };
        const newTrack: import("@/types/audio.types").AudioTrack = {
            id: `track-original-${Date.now()}`,
            audioId,
            name: originalAudioLabel,
            startTime: 0,
            duration: Math.min(result.duration, duration || result.duration),
            volume: 1,
            loop: false,
            kind: "original",
        };

        setUploadedAudios(prev => [...prev, newAudio]);
        setAudioTracks(prev => [...prev, newTrack]);
        setMuteOriginalAudio(true); // avoid double audio; track plays instead
        return true;
    } catch (error) {
        console.warn("Original audio extraction failed:", error);
        return false;
    }
}, [originalAudioLabel]);
```

Add the import at the top of the file with the other `lib` imports:

```tsx
import { extractAudioFromVideo } from "@/lib/audio-extract.utils";
```

Add the i18n label near other `useTranslations` usage in the component (reuse the existing `audioMenu` namespace translator if present, otherwise add `const tAudio = useTranslations("audioMenu");`):

```tsx
const originalAudioLabel = tAudio("originalTrackName");
```

- [ ] **Step 2: Call it during primary video upload**

In `handleVideoUpload`, replace the original-audio block (currently ~lines 1714–1719):

```tsx
        if (libraryVideo) {
            const originalHasAudio = libraryVideo.originalHasAudio !== false;
            setVideoHasAudioTrack(originalHasAudio);
            if (!originalHasAudio) setMuteOriginalAudio(true);
            clipAudioStateRef.current.set(libraryVideo.id, libraryVideo.hasAudio !== false);
        }
```

with:

```tsx
        if (libraryVideo) {
            const originalHasAudio = libraryVideo.originalHasAudio !== false;
            setVideoHasAudioTrack(originalHasAudio);
            if (!originalHasAudio) setMuteOriginalAudio(true);
            clipAudioStateRef.current.set(libraryVideo.id, libraryVideo.hasAudio !== false);
            if (originalHasAudio) {
                // Fire-and-forget: extract into an editable track once we know the duration.
                void extractOriginalAudioTrack(file, 0);
            }
        }
```

Note: `duration` is 0 here because it is not yet known; the helper falls back to the decoded audio duration, which equals the video duration for the primary clip.

- [ ] **Step 3: Add `extractOriginalAudioTrack` to `handleVideoUpload` deps**

Update the dependency array of `handleVideoUpload` (currently `}, [uploadVideo, clearHistory]);`) to:

```tsx
    }, [uploadVideo, clearHistory, extractOriginalAudioTrack]);
```

- [ ] **Step 4: Revoke the extracted URL on delete**

Confirm `handleAudioDelete` (~line 1332) already revokes `audio.url` via `URL.revokeObjectURL` — it does, so extracted WAV URLs are cleaned up when the track is removed. No change needed; note this in the commit body.

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm build` then `pnpm lint`
Expected: both succeed.

- [ ] **Step 6: Manual verification**

Run `pnpm dev`. In the editor:
- Upload a video WITH audio → an audio track named per `originalTrackName` appears; play → audio is heard once (not doubled); scrub → audio stays in sync.
- Upload a video WITHOUT audio → no original track is created.

- [ ] **Step 7: Commit**

```bash
git add "app/[locale]/(editor)/editor/page.tsx"
git commit -m "feat(audio): extract primary video original audio into editable track"
```

---

### Task 4: Timeline stacked lanes + default empty lane

**Files:**
- Modify: `app/components/ui/editor/Timeline.tsx` (~lines 320–334 container; ~lines 622–647 audio row)

**Interfaces:**
- Consumes: `audioTracks` (with `kind`), `uploadedAudios`, `selectedAudioTrackId`, `onSelectAudioTrack`, `onUpdateAudioTrack` (already props); `AudioFragmentTrackItem` (Task 6 simplifies its bounds but its props are unchanged).
- Produces: a timeline where each track is its own `h-5` row, and an empty `h-5` default lane renders when `audioTracks.length === 0`.

- [ ] **Step 1: Replace the single audio row with stacked lanes**

Replace the current audio block (~lines 622–647) — the `{audioTracks.length > 0 && ( ... single row ... )}` — with:

```tsx
                                {/* Audio lanes — one row per track, or a default empty lane */}
                                {audioTracks.length > 0 ? (
                                    audioTracks.map((track) => {
                                        const audio = uploadedAudios?.find(a => a.id === track.audioId);
                                        return (
                                            <div
                                                key={track.id}
                                                className="h-5 shrink-0 flex items-center border-t border-white/5 relative"
                                            >
                                                <div
                                                    className="h-full flex items-center relative"
                                                    style={{ width: contentWidth > 0 ? contentWidth : '100%' }}
                                                >
                                                    <AudioFragmentTrackItem
                                                        track={track}
                                                        audio={audio}
                                                        isSelected={track.id === selectedAudioTrackId}
                                                        contentWidth={contentWidth}
                                                        videoDuration={validDuration}
                                                        otherTracks={[]}
                                                        onSelect={() => onSelectAudioTrack?.(track.id)}
                                                        onUpdate={(updates) => onUpdateAudioTrack?.(track.id, updates)}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="h-5 shrink-0 flex items-center border-t border-white/5 relative">
                                        <div
                                            className="h-full flex items-center px-2 text-[9px] text-zinc-600 select-none"
                                            style={{ width: contentWidth > 0 ? contentWidth : '100%' }}
                                        >
                                            <span>{t("emptyAudioLane")}</span>
                                        </div>
                                    </div>
                                )}
```

`otherTracks={[]}` is correct: each lane holds exactly one track, so there are no same-lane neighbors to collide with.

- [ ] **Step 2: Add the `t` translator if not already present**

If `Timeline.tsx` does not already call `useTranslations`, add near the top of the component:

```tsx
const t = useTranslations("timeline");
```

and the import `import { useTranslations } from "next-intl";` if missing. (If a translator already exists under a different namespace, add the `emptyAudioLane` key to that namespace and use it instead — verify the existing namespace before adding.)

- [ ] **Step 3: Allow the timeline container to grow with lanes**

The outer wrapper is `<div className="h-38 shrink-0 ...">` (~line 322). Change `h-38` to `min-h-38` so multiple stacked lanes are not clipped:

```tsx
            <div className="min-h-38 shrink-0 bg-[#0D0D11] border-t border-white/10 flex flex-col font-mono text-[10px]">
```

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm build` then `pnpm lint`
Expected: both succeed.

- [ ] **Step 5: Manual verification**

Run `pnpm dev`:
- With no audio → exactly one empty audio lane with the hint text is visible.
- With original audio + one uploaded music track → two separate stacked lanes, each draggable/resizable within its own row.

- [ ] **Step 6: Commit**

```bash
git add app/components/ui/editor/Timeline.tsx
git commit -m "feat(audio): render stacked audio lanes with default empty lane"
```

---

### Task 5: Dynamic per-lane labels in `LabelSidebar`

**Files:**
- Modify: `app/components/ui/editor/LabelSidebar.tsx`
- Modify: `app/components/ui/editor/Timeline.tsx` (the `<LabelSidebar ... />` call ~line 326)

**Interfaces:**
- Consumes: `audioTracks` `kind` + `name` (Tasks 1/3).
- Produces: `LabelSidebar` accepts `audioLaneLabels: string[]` and renders one label row per lane, aligned to the Timeline audio rows.

- [ ] **Step 1: Update `LabelSidebar` props and rendering**

Replace `app/components/ui/editor/LabelSidebar.tsx` with:

```tsx
interface LabelSidebarProps {
    /** One label per audio lane, top-to-bottom. Empty array => one default lane. */
    audioLaneLabels?: string[];
}

export default function LabelSidebar({ audioLaneLabels = [] }: LabelSidebarProps) {
    const lanes = audioLaneLabels.length > 0 ? audioLaneLabels : ["Audio"];
    const hasTracks = audioLaneLabels.length > 0;

    return (
        <div className="absolute left-0 top-0 bottom-0 w-16 shrink-0 border-r border-white/5 flex flex-col bg-[#0D0D11] z-30">
            <div className="h-7 border-b border-white/5" />

            <div className="flex-1 flex items-center px-3">
                <span className="text-[9px] uppercase font-semibold tracking-wider text-zinc-500">Video</span>
            </div>

            <div className={`flex items-center px-3 border-t border-white/5 transition-all duration-300 ${hasTracks ? 'h-12' : 'h-15'}`}>
                <span className="text-[9px] uppercase font-semibold tracking-wider text-zinc-500">Zoom</span>
            </div>

            {lanes.map((label, i) => (
                <div
                    key={i}
                    className="h-5 flex items-center px-3 border-t border-white/5 bg-white/1"
                >
                    <span className="text-[9px] uppercase font-semibold tracking-wider text-zinc-500 truncate">
                        {label}
                    </span>
                </div>
            ))}
        </div>
    );
}
```

- [ ] **Step 2: Pass labels from Timeline**

In `Timeline.tsx`, replace `<LabelSidebar audioTracksCount={audioTracks.length} />` (~line 326) with:

```tsx
                    <LabelSidebar
                        audioLaneLabels={audioTracks.map(track =>
                            track.kind === 'original' ? t("originalLaneLabel") : track.name
                        )}
                    />
```

(Uses the same `t` translator added in Task 4. `originalLaneLabel` resolves to e.g. "Original".)

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm build` then `pnpm lint`
Expected: both succeed.

- [ ] **Step 4: Manual verification**

Run `pnpm dev`: the left sidebar shows "Original" next to the original lane and the track name (e.g. the music filename) next to each other lane, aligned with the correct rows. With no audio, a single "Audio" label shows next to the empty lane.

- [ ] **Step 5: Commit**

```bash
git add app/components/ui/editor/LabelSidebar.tsx app/components/ui/editor/Timeline.tsx
git commit -m "feat(audio): dynamic per-lane labels in LabelSidebar"
```

---

### Task 6: Simplify `AudioFragmentTrackItem` bounds to its own lane

**Files:**
- Modify: `app/components/ui/editor/AudioFragmentTrackItem.tsx` (~lines 47–69 `boundaries`)

**Interfaces:**
- Consumes: `track`, `videoDuration` (already props). `otherTracks` is now always `[]` from Timeline (Task 4).
- Produces: fragment drag/resize bounded only by `[0, videoDuration]` and (for resize) the audio's own duration.

- [ ] **Step 1: Replace the `boundaries` memo**

Replace the `boundaries` `useMemo` (~lines 47–69) with:

```tsx
    // Each track owns its own lane, so bounds are just the full timeline.
    const boundaries = useMemo(() => {
        return { minStart: 0, maxEnd: videoDuration };
    }, [videoDuration]);
```

Leave the rest of the component (drag/resize handlers that read `boundaries.minStart`/`boundaries.maxEnd`) unchanged.

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm build` then `pnpm lint`
Expected: both succeed. If lint flags `otherTracks` or `track.id` as unused, remove `otherTracks` from destructuring and from `AudioFragmentTrackItemProps` in `types/audio.types.ts`, and drop the `otherTracks={[]}` prop in `Timeline.tsx`.

- [ ] **Step 3: Manual verification**

Run `pnpm dev`: drag and resize a fragment across the full width of its lane — it is limited only by the timeline start/end and the audio's own length, with no phantom collision stops.

- [ ] **Step 4: Commit**

```bash
git add app/components/ui/editor/AudioFragmentTrackItem.tsx types/audio.types.ts app/components/ui/editor/Timeline.tsx
git commit -m "refactor(audio): bound fragment to its own lane"
```

---

### Task 7: "Original" badge in `AudioMenu`

**Files:**
- Modify: `app/components/ui/editor/AudioMenu.tsx` (~lines 151–165 track header)

**Interfaces:**
- Consumes: `AudioTrack.kind` (Task 1); existing `audioMenu` translations.
- Produces: an "Original" badge next to the original track's name in the menu list.

- [ ] **Step 1: Render the badge**

In `AudioMenu.tsx`, inside the track name block (~line 153), add a badge when `track.kind === 'original'`:

```tsx
                                            <div className="text-sm text-white font-medium truncate flex items-center gap-1.5">
                                                <span className="truncate">{track.name}</span>
                                                {track.kind === 'original' && (
                                                    <span className="shrink-0 text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                                                        {t("originalBadge")}
                                                    </span>
                                                )}
                                            </div>
```

(replacing the existing single `<div className="text-sm text-white font-medium truncate">{track.name}</div>`.)

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm build` then `pnpm lint`
Expected: both succeed.

- [ ] **Step 3: Manual verification**

Run `pnpm dev`: open the Audio tool — the original track shows an "Original" badge; uploaded music tracks do not.

- [ ] **Step 4: Commit**

```bash
git add app/components/ui/editor/AudioMenu.tsx
git commit -m "feat(audio): show Original badge in AudioMenu"
```

---

### Task 8: i18n keys (es/en/ru)

**Files:**
- Modify: `messages/es.json`, `messages/en.json`, `messages/ru.json`

**Interfaces:**
- Consumes: nothing.
- Produces: all keys referenced by Tasks 3/4/5/7:
  - `audioMenu.originalTrackName`, `audioMenu.originalBadge`
  - `timeline.emptyAudioLane`, `timeline.originalLaneLabel`

- [ ] **Step 1: Add keys to `messages/es.json`**

Under the existing `"audioMenu"` object add:

```json
    "originalTrackName": "Audio original",
    "originalBadge": "Original",
```

Add (or extend) a `"timeline"` object with:

```json
    "emptyAudioLane": "Agrega música o voz",
    "originalLaneLabel": "Original"
```

- [ ] **Step 2: Add keys to `messages/en.json`**

`audioMenu`:

```json
    "originalTrackName": "Original audio",
    "originalBadge": "Original",
```

`timeline`:

```json
    "emptyAudioLane": "Add music or voiceover",
    "originalLaneLabel": "Original"
```

- [ ] **Step 3: Add keys to `messages/ru.json`**

`audioMenu`:

```json
    "originalTrackName": "Оригинальный звук",
    "originalBadge": "Оригинал",
```

`timeline`:

```json
    "emptyAudioLane": "Добавьте музыку или озвучку",
    "originalLaneLabel": "Оригинал"
```

- [ ] **Step 4: Verify the timeline namespace matches Task 4/5 usage**

If `Timeline.tsx` used an existing translator namespace instead of `"timeline"` (per Task 4 Step 2 / Task 5 Step 2), place `emptyAudioLane` and `originalLaneLabel` under THAT namespace in all three files instead. The namespace in the JSON and in `useTranslations(...)` must match exactly.

- [ ] **Step 5: Typecheck + build**

Run: `pnpm build`
Expected: build succeeds; no missing-message runtime warnings for the new keys when exercised in `pnpm dev`.

- [ ] **Step 6: Commit**

```bash
git add messages/es.json messages/en.json messages/ru.json
git commit -m "i18n(audio): add multi-track lane + original audio strings"
```

---

### Task 9: End-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Full manual pass**

Run `pnpm dev` and confirm the spec's acceptance criteria:
1. Upload a video WITH audio → "Original" lane appears, plays in sync, no doubled audio.
2. Upload a video WITHOUT audio → one empty default lane; no original track.
3. Add background music → a second lane; both play together; move it to span the whole video.
4. Image + voiceover → voiceover lane still works as before.
5. Move/trim the original track → preview playback honors new timing.
6. Delete the original track → silence in preview.

- [ ] **Step 2: Export check**

Export a project that has original audio + one music track at 1080p. Confirm the downloaded file contains BOTH audio sources mixed (original + music), and that a project with the original track deleted exports silent original audio.

- [ ] **Step 3: Lint + build gate**

Run: `pnpm lint` then `pnpm build`
Expected: both pass clean.

- [ ] **Step 4: Final commit (if any fixups were needed)**

```bash
git add -A
git commit -m "test(audio): end-to-end verification fixups"
```

(Skip if no changes were required.)

---

## Notes / Risks

- **Extraction cost:** WAV is uncompressed; long videos consume significant memory. Scoped to the single primary uploaded video (multi-clip append path unchanged). If this becomes a problem, a later pass can switch to compressed encoding via MediaBunny.
- **`decodeAudioData` browser support:** all target browsers support it; the util returns `null` on failure and the app falls back to `<video>`-element original audio.
- **State restore / undo:** the original track lives in `audioTracks`, which is already part of `EditorState` undo/redo and autosave — no extra wiring needed, but confirm undo after upload does not desync `muteOriginalAudio` during the Task 9 pass.
