import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CryptoOSDB extends DBSchema {
  screenshots: {
    key: string; // uuid
    value: {
      id: string;
      ideaId?: string;
      journalId?: string;
      caption?: string;
      mimeType: string;
      blob: Blob;
      createdAt: number;
    };
    indexes: {
      'by-idea': string;
      'by-journal': string;
    };
  };
}

const DB_NAME = 'cryptoos_storage';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CryptoOSDB>> | null = null;

function getDb(): Promise<IDBPDatabase<CryptoOSDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CryptoOSDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('screenshots')) {
          const store = db.createObjectStore('screenshots', { keyPath: 'id' });
          store.createIndex('by-idea', 'ideaId');
          store.createIndex('by-journal', 'journalId');
        }
      },
    });
  }
  return dbPromise;
}

export const evidenceDb = {
  async saveScreenshot(params: {
    id: string;
    blob: Blob;
    ideaId?: string;
    journalId?: string;
    caption?: string;
  }): Promise<string> {
    const db = await getDb();
    await db.put('screenshots', {
      id: params.id,
      blob: params.blob,
      ideaId: params.ideaId,
      journalId: params.journalId,
      caption: params.caption,
      mimeType: params.blob.type || 'image/png',
      createdAt: Date.now(),
    });
    return params.id;
  },

  async getScreenshot(id: string): Promise<{
    id: string;
    blob: Blob;
    url: string;
    caption?: string;
    createdAt: number;
  } | null> {
    const db = await getDb();
    const item = await db.get('screenshots', id);
    if (!item) return null;
    return {
      id: item.id,
      blob: item.blob,
      url: URL.createObjectURL(item.blob),
      caption: item.caption,
      createdAt: item.createdAt,
    };
  },

  async getScreenshotsByIdea(ideaId: string): Promise<{ id: string; url: string; caption?: string }[]> {
    const db = await getDb();
    const items = await db.getAllFromIndex('screenshots', 'by-idea', ideaId);
    return items.map((item) => ({
      id: item.id,
      url: URL.createObjectURL(item.blob),
      caption: item.caption,
    }));
  },

  async deleteScreenshot(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('screenshots', id);
  },
};
