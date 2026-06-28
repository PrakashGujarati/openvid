const DB_NAME = "openvid-images-library";
const DB_VERSION = 1;
const STORE = "images";

export interface LibraryImage {
    id: string;
    fileName: string;
    blob: Blob;
    width: number;
    height: number;
    fileSize: number;
    createdAt: number;
    thumbnailUrl: string;
}

export type LibraryImageInfo = Omit<LibraryImage, "blob">;

// In-memory caches (object-URL lifetime tied to the tab)
const blobCache = new Map<string, Blob>();
const urlCache = new Map<string, string>();

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: "id" });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function readImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
            URL.revokeObjectURL(url);
        };
        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(e);
        };
        img.src = url;
    });
}

function thumbUrlFor(id: string, blob: Blob): string {
    let url = urlCache.get(id);
    if (!url) {
        url = URL.createObjectURL(blob);
        urlCache.set(id, url);
        blobCache.set(id, blob);
    }
    return url;
}

export async function addLibraryImage(file: File): Promise<LibraryImage> {
    const { width, height } = await readImageDimensions(file);
    const id = crypto.randomUUID();
    const record: LibraryImage = {
        id,
        fileName: file.name,
        blob: file,
        width,
        height,
        fileSize: file.size,
        createdAt: Date.now(),
        thumbnailUrl: thumbUrlFor(id, file),
    };
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        // Don't persist the object URL — it is tab-scoped. Recreate on read.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { thumbnailUrl: _omit, ...persist } = record;
        tx.objectStore(STORE).put(persist);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    db.close();
    return record;
}

export async function getLibraryImage(id: string): Promise<LibraryImage | null> {
    const db = await openDB();
    const rec = await new Promise<Omit<LibraryImage, "thumbnailUrl"> | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    db.close();
    if (!rec) return null;
    return { ...rec, thumbnailUrl: thumbUrlFor(rec.id, rec.blob) };
}

export async function getLibraryImageInfoList(): Promise<LibraryImageInfo[]> {
    const db = await openDB();
    const list = await new Promise<Omit<LibraryImage, "thumbnailUrl">[]>((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
    db.close();
    return list
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((rec) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { blob: _unused, ...info } = rec;
            return { ...info, thumbnailUrl: thumbUrlFor(rec.id, rec.blob) };
        });
}

export async function deleteLibraryImage(id: string): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    db.close();
    const url = urlCache.get(id);
    if (url) URL.revokeObjectURL(url);
    urlCache.delete(id);
    blobCache.delete(id);
}

export function formatImageFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
