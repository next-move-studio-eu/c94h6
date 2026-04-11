/**
 * Autosave for article editor: saves info, content, blockIds, blocks, and attachments to localStorage
 * (assets/blobs are not saved). Restore on mount, debounced save, save on hide/close.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import type { EditorState } from '../types/articleEditor';
import { blocksToContentJson } from '../utils/articleContentJson';

const AUTOSAVE_DEBOUNCE_MS = 2500;

export interface StoredDraft {
  info: EditorState['info'];
  content: EditorState['content'];
  blockIds: EditorState['blockIds'];
  blocks: EditorState['blocks'];
  attachments: EditorState['attachments'];
  savedAt: string;
}

function getDraftPayload(state: EditorState): StoredDraft {
  return {
    info: state.info,
    content: state.content,
    blockIds: state.blockIds,
    blocks: state.blocks,
    attachments: state.attachments,
    savedAt: new Date().toISOString(),
  };
}

function saveDraft(storageKey: string, state: EditorState): void {
  try {
    const payload = getDraftPayload(state);
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (e) {
    console.warn('Article editor autosave failed', e);
  }
}

function loadDraft(storageKey: string): StoredDraft | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (
      data &&
      typeof data === 'object' &&
      'info' in data &&
      'blocks' in data &&
      'attachments' in data &&
      Array.isArray((data as StoredDraft).blocks)
    ) {
      const draft = data as StoredDraft;
      // Legacy draft may lack content/blockIds; accept and let restore migrate
      return draft;
    }
  } catch {
    // ignore
  }
  return null;
}

export interface UseArticleEditorAutosaveOptions {
  state: EditorState;
  setState: React.Dispatch<React.SetStateAction<EditorState>>;
  storageKey: string;
  onRestore?: () => void;
  onSaved?: () => void;
}

export function useArticleEditorAutosave({
  state,
  setState,
  storageKey,
  onRestore,
  onSaved,
}: UseArticleEditorAutosaveOptions) {
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setLastSavedAt(null);
  }, [storageKey]);

  const restoreDraftIfAvailable = useCallback(() => {
    const draft = loadDraft(storageKey);
    if (!draft) return false;
    setState((prev) => {
      const hasContent = Array.isArray((draft as StoredDraft & { content?: unknown }).content);
      const hasBlockIds = Array.isArray((draft as StoredDraft & { blockIds?: unknown }).blockIds);
      if (hasContent && hasBlockIds) {
        return {
          ...prev,
          info: draft.info,
          content: (draft as StoredDraft).content,
          blockIds: (draft as StoredDraft).blockIds,
          blocks: draft.blocks,
          attachments: draft.attachments,
        };
      }
      // Legacy draft: derive content and blockIds from blocks
      const content = (blocksToContentJson(draft.blocks).content as Record<string, unknown>[]) ?? [];
      const blockIds = draft.blocks.map((b) => b.id);
      return {
        ...prev,
        info: draft.info,
        content,
        blockIds,
        blocks: draft.blocks,
        attachments: draft.attachments,
      };
    });
    setLastSavedAt(draft.savedAt);
    onRestore?.();
    return true;
  }, [storageKey, setState, onRestore]);

  // Restore draft on mount if present
  useEffect(() => {
    restoreDraftIfAvailable();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  // Debounced save when state (info, blocks, attachments) changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      saveDraft(storageKey, state);
      const now = new Date().toISOString();
      setLastSavedAt(now);
      onSaved?.();
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [storageKey, state, onSaved]);

  // Save on page hide (tab switch, minimize) and before unload
  useEffect(() => {
    const flush = () => saveDraft(storageKey, state);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    const handleBeforeUnload = () => flush();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [storageKey, state]);

  return {
    restoreDraftIfAvailable,
    clearDraft,
    lastSavedAt,
  };
}
