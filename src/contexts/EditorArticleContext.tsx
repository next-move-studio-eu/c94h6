import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { EditorState } from '../types/articleEditor';
import { getDurationFromZipWithAudioWebm } from '../utils/articleZip';

export interface AttachmentMeta {
  durationSeconds: number;
  sizeBytes: number;
}

export interface EditorArticleContextValue {
  state: EditorState;
  setState: Dispatch<SetStateAction<EditorState>>;
  /** Resolve a file name (e.g. Thumbnail.avif, 1.avif, video1.webm) to a blob URL for preview. Returns null if not in assets. */
  getFileUrl: (fileName: string) => string | null;
  /** Metadata for in-article video by id ("1", "2", ...). Used by Video MDX component for header. */
  getArticleVideoMeta: (id: string) => AttachmentMeta | null;
  /** Metadata for in-article audio by id ("1", "2", ...). Used by ArticleAudio component for header. */
  getArticleAudioMeta: (id: string) => AttachmentMeta | null;
  /** Metadata for any attachment by file name (e.g. slideshow1.zip, chessvideo1.zip). Used by Slideshow/ChessVideo in editor preview. Async for zip assets. */
  getAttachmentMeta: (fileName: string) => Promise<AttachmentMeta | null>;
}

const EditorArticleContext = createContext<EditorArticleContextValue | null>(null);

export function EditorArticleProvider({
  state,
  setState,
  children,
}: {
  state: EditorState;
  setState: Dispatch<SetStateAction<EditorState>>;
  children: ReactNode;
}) {
  const urlCache = useRef<Map<string, string>>(new Map());
  const attachmentMetaCache = useRef<Map<string, AttachmentMeta>>(new Map());

  const revokeAll = useCallback(() => {
    urlCache.current.forEach((url) => URL.revokeObjectURL(url));
    urlCache.current.clear();
  }, []);

  useEffect(() => {
    attachmentMetaCache.current.clear();
    return revokeAll;
  }, [state.assets, revokeAll]);

  const getFileUrl = useCallback(
    (fileName: string): string | null => {
      const { thumbnail, numberedImages, chessVideos, slideshows, articleVideos, articleAudios } = state.assets;
      let blob: Blob | undefined;
      const lower = fileName.toLowerCase();
      if (lower === 'thumbnail.avif' && thumbnail) {
        blob = thumbnail;
      } else if (/^\d+\.avif$/.test(fileName)) {
        const n = parseInt(fileName.replace(/\.avif$/i, ''), 10);
        blob = numberedImages[n];
      } else if (/^video\d+\.webm$/i.test(fileName)) {
        const match = fileName.match(/^video(\d+)\.webm$/i);
        if (match) blob = articleVideos[parseInt(match[1], 10)]?.blob;
      } else if (/^audio\d+\.webm$/i.test(fileName)) {
        const match = fileName.match(/^audio(\d+)\.webm$/i);
        if (match) blob = articleAudios[parseInt(match[1], 10)]?.blob;
      } else if (/^chessvideo\d+\.zip$/i.test(fileName)) {
        const match = fileName.match(/^chessvideo(\d+)\.zip$/i);
        if (match) blob = chessVideos[parseInt(match[1], 10)];
      } else if (/^slideshow\d+\.zip$/i.test(fileName)) {
        const match = fileName.match(/^slideshow(\d+)\.zip$/i);
        if (match) blob = slideshows[parseInt(match[1], 10)];
      }
      if (!blob) return null;
      const cached = urlCache.current.get(fileName);
      if (cached) return cached;
      const url = URL.createObjectURL(blob);
      urlCache.current.set(fileName, url);
      return url;
    },
    [state.assets]
  );

  const getArticleVideoMeta = useCallback(
    (id: string): AttachmentMeta | null => {
      const n = parseInt(String(id).replace(/\D/g, ''), 10);
      if (Number.isNaN(n)) return null;
      const entry = state.assets.articleVideos[n];
      if (!entry?.blob) return null;
      return {
        durationSeconds: entry.durationSeconds ?? 0,
        sizeBytes: entry.blob.size,
      };
    },
    [state.assets.articleVideos]
  );

  const getArticleAudioMeta = useCallback(
    (id: string): AttachmentMeta | null => {
      const n = parseInt(String(id).replace(/\D/g, ''), 10);
      if (Number.isNaN(n)) return null;
      const entry = state.assets.articleAudios[n];
      if (!entry?.blob) return null;
      return {
        durationSeconds: entry.durationSeconds ?? 0,
        sizeBytes: entry.blob.size,
      };
    },
    [state.assets.articleAudios]
  );

  const getAttachmentMeta = useCallback(
    async (fileName: string): Promise<AttachmentMeta | null> => {
      const matchVideo = /^video(\d+)\.webm$/i.exec(fileName);
      if (matchVideo) {
        const meta = getArticleVideoMeta(matchVideo[1]);
        return meta;
      }
      const matchAudio = /^audio(\d+)\.webm$/i.exec(fileName);
      if (matchAudio) {
        return getArticleAudioMeta(matchAudio[1]);
      }
      const { chessVideos, slideshows } = state.assets;
      let blob: Blob | undefined;
      if (/^chessvideo\d+\.zip$/i.test(fileName)) {
        const m = fileName.match(/^chessvideo(\d+)\.zip$/i);
        if (m) blob = chessVideos[parseInt(m[1], 10)];
      } else if (/^slideshow\d+\.zip$/i.test(fileName)) {
        const m = fileName.match(/^slideshow(\d+)\.zip$/i);
        if (m) blob = slideshows[parseInt(m[1], 10)];
      }
      if (!blob) return null;
      const cached = attachmentMetaCache.current.get(fileName);
      if (cached) return cached;
      const durationSeconds = await getDurationFromZipWithAudioWebm(blob);
      const meta: AttachmentMeta = { durationSeconds, sizeBytes: blob.size };
      attachmentMetaCache.current.set(fileName, meta);
      return meta;
    },
    [state.assets.chessVideos, state.assets.slideshows, getArticleVideoMeta, getArticleAudioMeta]
  );

  const value: EditorArticleContextValue = { state, setState, getFileUrl, getArticleVideoMeta, getArticleAudioMeta, getAttachmentMeta };
  return (
    <EditorArticleContext.Provider value={value}>
      {children}
    </EditorArticleContext.Provider>
  );
}

export function useEditorArticle(): EditorArticleContextValue | null {
  return useContext(EditorArticleContext);
}
