const DB_NAME = "bo-offline";
const DB_VERSION = 1;
const STORE = "entries";

export interface OfflineEntry<T = unknown> {
	key: string;
	data: T;
	generation: number;
}

export interface OfflineMeta {
	userId: number;
	downloadedAt: string | null;
	members?: number;
	insuranceCards?: number;
}

const META_KEY = "offlineData";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
	if (!dbPromise) {
		dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);
			request.onupgradeneeded = () => {
				if (!request.result.objectStoreNames.contains(STORE)) {
					request.result.createObjectStore(STORE, { keyPath: "key" });
				}
			};
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		}).catch((err) => {
			dbPromise = null;
			throw err;
		});
	}
	return dbPromise;
}

function wrap<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

function done(tx: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error);
	});
}

export async function getOfflineEntry<T>(key: string): Promise<T | undefined> {
	const db = await openDb();
	const entry = await wrap<OfflineEntry<T> | undefined>(db.transaction(STORE).objectStore(STORE).get(key));
	return entry?.data;
}

export async function putOfflineEntry(key: string, data: unknown, generation: number): Promise<void> {
	const db = await openDb();
	const tx = db.transaction(STORE, "readwrite");
	tx.objectStore(STORE).put({ key, data, generation } satisfies OfflineEntry);
	await done(tx);
}

export async function deleteOfflineEntriesExcept(generation: number): Promise<void> {
	const db = await openDb();
	const tx = db.transaction(STORE, "readwrite");
	const request = tx.objectStore(STORE).openCursor();
	request.onsuccess = () => {
		const cursor = request.result;
		if (!cursor) return;
		if ((cursor.value as OfflineEntry).generation !== generation) cursor.delete();
		cursor.continue();
	};
	await done(tx);
}

export async function clearOfflineEntries(): Promise<void> {
	const db = await openDb();
	const tx = db.transaction(STORE, "readwrite");
	tx.objectStore(STORE).clear();
	await done(tx);
}

export function readOfflineMeta(): OfflineMeta | null {
	try {
		const value = localStorage.getItem(META_KEY);
		return value ? (JSON.parse(value) as OfflineMeta) : null;
	} catch {
		return null;
	}
}

export function writeOfflineMeta(meta: OfflineMeta | null) {
	try {
		if (meta) localStorage.setItem(META_KEY, JSON.stringify(meta));
		else localStorage.removeItem(META_KEY);
	} catch {}
}
