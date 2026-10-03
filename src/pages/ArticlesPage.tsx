import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback, type SetStateAction } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FilePlus,
  FolderOpen,
  Save,
  SaveAll,
  Eye,
  Edit3,
  LayoutList,
  CodeXml,
  WandSparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  createEmptyEditorState,
  createDefaultBlock,
  createBlockId,
  type EditorState,
  type EditorBlock,
  type MarkdownBlock,
  type ArticleLanguage,
} from '../types/articleEditor';
import { buildArticleZip, parseArticleZip } from '../utils/articleZip';
import { fingerprintArticleZip } from '../utils/articleDiskFingerprint';
import {
  saveBlobWithResolver,
  saveBlobToArticleTarget,
  isTauriRuntime,
  openArticleZipTauri,
  openArticleZipWithBrowserPicker,
} from '../utils/savePathResolver';
import {
  contentToBlocks,
  contentToBlocksWithSchema,
  contentToPayload,
  blockToContentItem,
  mergeKnownFields,
  payloadToContentAndIds,
  blocksToContentJson,
  ensureContentItemsHaveIds,
} from '../utils/articleContentJson';
import { validateRawJsonForTransition } from '../utils/articleContentSchema';
import { EditorArticleProvider } from '../contexts/EditorArticleContext';
import { ArticleContentProvider } from '../contexts/ArticleContentContext';
import { AuthProvider } from '../contexts/AuthContext';
import { useArticleEditorAutosave } from '../hooks/useArticleEditorAutosave';
import { useArticleSession } from '../contexts/ArticleSessionContext';
import AssetsPanel from '../components/editor/AssetsPanel';
import { AppendBlockSplitButton, type AddableBlockType } from '../components/editor/AddBlockMenu';
import type { MarkdownInsertPlacement } from '../utils/markdownInsert';
import ArticleEditorPreview from '../components/ArticleEditorPreview';
import {
  MarkdownBlockEditor,
  AccordionBlockEditor,
  ChessDiagramBlockEditor,
  PhotoBlockEditor,
  VideoBlockEditor,
  ArticleVideoBlockEditor,
  ArticleAudioBlockEditor,
  SlideshowBlockEditor,
  PlayEngineBlockEditor,
  DotBlockEditor,
  PieBlockEditor,
  BarBlockEditor,
  KaTeXBlockEditor,
  QuizBlockEditor,
  TtsBlockEditor,
  SmilesBlockEditor,
  UnknownBlockEditor,
} from '../components/editor/BlockEditors';

const ARTICLE_EDITOR_AUTOSAVE_KEY = 'article-editor-autosave';

interface LoadExampleState {
  fileName: string;
  lang: string;
  state: EditorState;
}

export default function ArticlesPage() {
  const { t, i18n } = useTranslation(['articlesPage', 'articleEditor']);
  const appLanguage = i18n.resolvedLanguage === 'cs' ? 'cs' : 'en';
  const location = useLocation();
  const navigate = useNavigate();
  const defaultState = useMemo<EditorState>(() => {
    const empty = createEmptyEditorState();
    return {
      ...empty,
      info: { ...empty.info, language: appLanguage as ArticleLanguage },
    };
  }, [appLanguage]);
  const {
    articleState,
    setArticleState,
    showPreview,
    setShowPreview,
    isProMode,
    setIsProMode,
    proModeJson,
    setProModeJson,
    loadErrors,
    setLoadErrors,
    articleDiskTarget,
    setArticleDiskTarget,
  } = useArticleSession();
  const state = articleState ?? defaultState;
  const setState = useCallback(
    (next: SetStateAction<EditorState>) => {
      setArticleState((prev) => {
        const base = prev ?? defaultState;
        return typeof next === 'function' ? (next as (prevState: EditorState) => EditorState)(base) : next;
      });
    },
    [setArticleState, defaultState]
  );
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const diskBaselineRef = useRef<string | null>(null);
  const [diskDirty, setDiskDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!articleState) setArticleState(defaultState);
  }, [articleState, setArticleState, defaultState]);

  const { clearDraft, lastSavedAt } = useArticleEditorAutosave({
    state,
    setState,
    storageKey: ARTICLE_EDITOR_AUTOSAVE_KEY,
    onRestore: () => {},
    onSaved: () => {},
  });

  const numberedImageIds = Object.keys(state.assets.numberedImages)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  const videoIds = Object.keys(state.assets.chessVideos)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  const articleVideoIds = Object.keys(state.assets.articleVideos)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  const articleAudioIds = Object.keys(state.assets.articleAudios)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  const slideshowIds = Object.keys(state.assets.slideshows)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);

  const articleFileLabel = useMemo(() => {
    if (!articleDiskTarget) return null;
    if (articleDiskTarget.kind === 'tauri') {
      const p = articleDiskTarget.path;
      const sep = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
      return sep >= 0 ? p.slice(sep + 1) : p;
    }
    return articleDiskTarget.handle.name ?? null;
  }, [articleDiskTarget]);

  const applyZipBlob = useCallback(
    async (
      blob: Blob,
      binding?: { tauriPath?: string; browserHandle?: FileSystemFileHandle }
    ) => {
      const { state: newState, errors } = await parseArticleZip(blob);
      setState(newState);
      if (isProMode) setProModeJson(JSON.stringify(contentToPayload(newState.content), null, 2));
      setLoadErrors(errors);
      if (binding?.tauriPath) {
        setArticleDiskTarget({ kind: 'tauri', path: binding.tauriPath });
      } else if (binding?.browserHandle) {
        setArticleDiskTarget({ kind: 'fileHandle', handle: binding.browserHandle });
      } else {
        setArticleDiskTarget(null);
      }
      const fp = await fingerprintArticleZip(newState);
      diskBaselineRef.current = fp;
      setDiskDirty(false);
    },
    [isProMode, setArticleDiskTarget, setLoadErrors, setProModeJson, setState]
  );

  const handleNew = () => {
    if (diskDirty && !window.confirm(t('articlesPage.newDiscardUnsaved'))) return;
    clearDraft();
    const empty = createEmptyEditorState();
    const newState = { ...empty, info: { ...empty.info, language: appLanguage as ArticleLanguage } };
    setState(newState);
    if (isProMode) setProModeJson(JSON.stringify(contentToPayload(newState.content), null, 2));
    setLoadErrors([]);
    setArticleDiskTarget(null);
    diskBaselineRef.current = null;
  };

  const handleOpenZip = async () => {
    if (diskDirty && !window.confirm(t('articlesPage.openDiscardUnsaved'))) return;
    setLoadErrors([]);
    try {
      if (isTauriRuntime()) {
        const r = await openArticleZipTauri();
        if (!r) return;
        await applyZipBlob(r.blob, { tauriPath: r.path });
        return;
      }
      const br = await openArticleZipWithBrowserPicker();
      if (br) {
        await applyZipBlob(br.blob, { browserHandle: br.handle });
        return;
      }
      fileInputRef.current?.click();
    } catch (err) {
      setLoadErrors([err instanceof Error ? err.message : t('articlesPage.parseZipFailed')]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.name.toLowerCase().endsWith('.zip')) return;
    if (diskDirty && !window.confirm(t('articlesPage.openDiscardUnsaved'))) return;
    setLoadErrors([]);
    try {
      const blob = await file.arrayBuffer().then((ab) => new Blob([ab]));
      await applyZipBlob(blob);
    } catch (err) {
      setLoadErrors([err instanceof Error ? err.message : t('articlesPage.parseZipFailed')]);
    }
  };

  const defaultZipName = useCallback(() => {
    const slug = (state.info.title?.trim() || 'article').replace(/[^a-z0-9-]/gi, '-') || 'article';
    return `${slug}.zip`;
  }, [state.info.title]);

  const commitBaseline = useCallback(async (s: EditorState) => {
    const fp = await fingerprintArticleZip(s);
    diskBaselineRef.current = fp;
    setDiskDirty(false);
  }, []);

  const getProModeValidationErrors = useCallback((raw: string): string[] => {
    const gate = validateRawJsonForTransition(raw);
    if (!gate.ok) {
      return gate.errors.map((msg) => {
        if (msg === 'Invalid JSON syntax.') return t('articlesPage.proModeInvalidSyntax');
        if (msg.startsWith('Payload must')) return t('articlesPage.proModeInvalidRoot');
        const itemMatch = msg.match(/^content\[(\d+)\]/);
        if (itemMatch) return t('articlesPage.proModeInvalidItemShape', { index: String(Number(itemMatch[1]) + 1) });
        return msg;
      });
    }
    const parsedResult = payloadToContentAndIds(gate.payload);
    if (!parsedResult) return [t('articlesPage.proModeInvalidRoot')];
    const { schemaErrors } = contentToBlocksWithSchema(parsedResult.content, parsedResult.blockIds);
    return schemaErrors;
  }, [t]);

  const resolveProJsonState = useCallback(
    (baseState: EditorState, raw: string): { nextState: EditorState | null; errors: string[] } => {
      const gate = validateRawJsonForTransition(raw);
      if (!gate.ok) {
        return { nextState: null, errors: getProModeValidationErrors(raw) };
      }
      const parsedResult = payloadToContentAndIds(gate.payload);
      if (!parsedResult) {
        return { nextState: null, errors: [t('articlesPage.proModeInvalidRoot')] };
      }
      const emptyContent = [{ type: 'markdown', content: '' } as Record<string, unknown>];
      const emptyIds = [createBlockId()];
      const content = parsedResult.content.length > 0 ? parsedResult.content : emptyContent;
      const blockIds = parsedResult.content.length > 0 ? parsedResult.blockIds : emptyIds;
      const { blocks, schemaErrors } = contentToBlocksWithSchema(content, blockIds);
      const errors = [...schemaErrors];
      if (schemaErrors.length > 0) {
        errors.unshift(t('articlesPage.proModeKnownTypeFallbackNotice'));
      }
      return {
        nextState: {
          ...baseState,
          content,
          blockIds,
          blocks,
        },
        errors,
      };
    },
    [getProModeValidationErrors, t]
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      let stateToSave = state;
      if (isProMode) {
        const { nextState, errors } = resolveProJsonState(state, proModeJson);
        if (!nextState) {
          setLoadErrors(errors);
          return;
        }
        setState(nextState);
        setLoadErrors(errors);
        stateToSave = nextState;
      }
      const blob = await buildArticleZip(stateToSave);
      const name = defaultZipName();
      if (articleDiskTarget) {
        try {
          await saveBlobToArticleTarget(articleDiskTarget, blob);
        } catch (err) {
          console.error(err);
          setLoadErrors([
            t('articlesPage.saveFailedPath', {
              message: err instanceof Error ? err.message : String(err),
            }),
          ]);
          setArticleDiskTarget(null);
          return;
        }
      } else {
        const r = await saveBlobWithResolver('article', name, blob, [{ name: 'Article ZIP', extensions: ['zip'] }]);
        if (!r.saved) return;
        if (r.tauriPath) setArticleDiskTarget({ kind: 'tauri', path: r.tauriPath });
        else if (r.browserFileHandle) setArticleDiskTarget({ kind: 'fileHandle', handle: r.browserFileHandle });
      }
      await commitBaseline(stateToSave);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [
    articleDiskTarget,
    commitBaseline,
    defaultZipName,
    isProMode,
    proModeJson,
    resolveProJsonState,
    setArticleDiskTarget,
    setLoadErrors,
    setState,
    state,
    t,
  ]);

  const handleSaveAs = useCallback(async () => {
    setIsSaving(true);
    try {
      let stateToSave = state;
      if (isProMode) {
        const { nextState, errors } = resolveProJsonState(state, proModeJson);
        if (!nextState) {
          setLoadErrors(errors);
          return;
        }
        setState(nextState);
        setLoadErrors(errors);
        stateToSave = nextState;
      }
      const blob = await buildArticleZip(stateToSave);
      const name = defaultZipName();
      const r = await saveBlobWithResolver('article', name, blob, [{ name: 'Article ZIP', extensions: ['zip'] }]);
      if (!r.saved) return;
      if (r.tauriPath) setArticleDiskTarget({ kind: 'tauri', path: r.tauriPath });
      else if (r.browserFileHandle) setArticleDiskTarget({ kind: 'fileHandle', handle: r.browserFileHandle });
      else setArticleDiskTarget(null);
      await commitBaseline(stateToSave);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [
    commitBaseline,
    defaultZipName,
    isProMode,
    proModeJson,
    resolveProJsonState,
    setArticleDiskTarget,
    setLoadErrors,
    setState,
    state,
  ]);

  useEffect(() => {
    let cancelled = false;
    const tid = window.setTimeout(() => {
      void (async () => {
        const fp = await fingerprintArticleZip(state);
        if (cancelled) return;
        if (diskBaselineRef.current === null) {
          diskBaselineRef.current = fp;
          setDiskDirty(false);
          return;
        }
        setDiskDirty(fp !== diskBaselineRef.current);
      })();
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(tid);
    };
  }, [state]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!diskDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [diskDirty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 's') return;
      e.preventDefault();
      if (e.shiftKey) void handleSaveAs();
      else void handleSave();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave, handleSaveAs]);

  const scrollBlockIdRef = useRef<string | null>(null);

  const createPreparedBlock = (type: AddableBlockType): EditorBlock => {
    let block = createDefaultBlock(type);
    if (block.type === 'photo' && numberedImageIds.length > 0) {
      block = { ...block, imageId: numberedImageIds[0] };
    } else if (block.type === 'articleVideo' && articleVideoIds.length > 0) {
      block = { ...block, videoId: String(articleVideoIds[0]) };
    } else if (block.type === 'articleAudio' && articleAudioIds.length > 0) {
      block = { ...block, audioId: String(articleAudioIds[0]) };
    }
    return { ...block, id: createBlockId() };
  };

  const addBlock = (type: AddableBlockType) => {
    const newBlock = createPreparedBlock(type);
    scrollBlockIdRef.current = newBlock.id;
    setState((current) => ({
      ...current,
      content: [...current.content, blockToContentItem(newBlock)],
      blockIds: [...current.blockIds, newBlock.id],
      blocks: [...current.blocks, newBlock],
    }));
  };

  const insertAtMarkdownCaret = (index: number, type: AddableBlockType, plan: MarkdownInsertPlacement) => {
    const newBlock = createPreparedBlock(type);
    const suffixBlock: MarkdownBlock | null =
      plan.action === 'between'
        ? (() => {
            const created = createDefaultBlock('markdown');
            return created.type === 'markdown'
              ? { ...created, id: createBlockId(), content: plan.after }
              : { id: createBlockId(), type: 'markdown', content: plan.after };
          })()
        : null;
    scrollBlockIdRef.current = newBlock.id;
    setState((current) => {
      const existing = current.blocks[index];
      if (!existing || existing.type !== 'markdown') return current;
      const content = [...current.content];
      const blockIds = [...current.blockIds];
      const blocks = [...current.blocks];
      if (plan.action === 'before') {
        const markdownBlock: MarkdownBlock = { ...existing, content: plan.markdown };
        content.splice(index, 1, blockToContentItem(newBlock), blockToContentItem(markdownBlock));
        blockIds.splice(index, 1, newBlock.id, markdownBlock.id);
        blocks.splice(index, 1, newBlock, markdownBlock);
      } else if (plan.action === 'after') {
        const markdownBlock: MarkdownBlock = { ...existing, content: plan.markdown };
        content.splice(index, 1, blockToContentItem(markdownBlock), blockToContentItem(newBlock));
        blockIds.splice(index, 1, markdownBlock.id, newBlock.id);
        blocks.splice(index, 1, markdownBlock, newBlock);
      } else if (suffixBlock) {
        const prefix: MarkdownBlock = { ...existing, content: plan.before };
        content.splice(
          index,
          1,
          blockToContentItem(prefix),
          blockToContentItem(newBlock),
          blockToContentItem(suffixBlock),
        );
        blockIds.splice(index, 1, prefix.id, newBlock.id, suffixBlock.id);
        blocks.splice(index, 1, prefix, newBlock, suffixBlock);
      } else {
        return current;
      }
      return { ...current, content, blockIds, blocks };
    });
  };

  useLayoutEffect(() => {
    const id = scrollBlockIdRef.current;
    if (!id) return;
    const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(id) : id;
    const element = document.querySelector(`[data-editor-block-id="${escaped}"]`);
    if (!element) return;
    scrollBlockIdRef.current = null;
    element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [state.blocks]);

  const updateBlock = (index: number, block: EditorBlock) => {
    setState((s) => {
      const newItem = mergeKnownFields(s.content[index] ?? {}, block, block.type);
      const newContent = s.content.map((item, i) => (i === index ? newItem : item));
      const id = s.blockIds[index] ?? s.blocks[index]?.id ?? createBlockId();
      const newBlock = contentToBlocks([newItem], [id])[0];
      const newBlocks = s.blocks.map((b, i) => (i === index ? newBlock : b));
      return { ...s, content: newContent, blocks: newBlocks };
    });
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= state.blocks.length) return;
    setState((s) => {
      const content = [...s.content];
      const blockIds = [...s.blockIds];
      const blocks = [...s.blocks];
      [content[index], content[next]] = [content[next], content[index]];
      [blockIds[index], blockIds[next]] = [blockIds[next], blockIds[index]];
      [blocks[index], blocks[next]] = [blocks[next], blocks[index]];
      return { ...s, content, blockIds, blocks };
    });
  };

  const removeBlock = (index: number) => {
    setState((s) => ({
      ...s,
      content: s.content.filter((_, i) => i !== index),
      blockIds: s.blockIds.filter((_, i) => i !== index),
      blocks: s.blocks.filter((_, i) => i !== index),
    }));
  };

  useEffect(() => {
    if (proModeJson) return;
    setProModeJson(JSON.stringify(contentToPayload(state.content), null, 2));
  }, [proModeJson, setProModeJson, state.content]);

  useEffect(() => {
    if (isProMode || !proModeJson) return;
    const errors = getProModeValidationErrors(proModeJson);
    if (errors.length === 0) return;
    setIsProMode(true);
    setShowPreview(false);
    setLoadErrors(errors);
  }, [isProMode, proModeJson, setIsProMode, setShowPreview, setLoadErrors]);

  const syncProJsonToBlocks = useCallback(
    (raw: string): boolean => {
      const { nextState, errors } = resolveProJsonState(state, raw);
      if (!nextState) {
        setLoadErrors(errors);
        return false;
      }
      setState(nextState);
      setLoadErrors(errors);
      return true;
    },
    [resolveProJsonState, setLoadErrors, setState, state]
  );

  const handleSwitchToPro = () => {
    setProModeJson(JSON.stringify(contentToPayload(state.content), null, 2));
    setIsProMode(true);
  };

  const handleSwitchToNoob = () => {
    if (!syncProJsonToBlocks(proModeJson)) {
      setLoadErrors((prev) => [t('articlesPage.proModeSwitchBlocked'), ...prev]);
      return;
    }
    setIsProMode(false);
  };

  const handleProJsonChange = (value: string) => {
    setProModeJson(value);
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      setLoadErrors(getProModeValidationErrors(value));
    }, 250);
  };

  const handlePrettyPrintProJson = () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    const gate = validateRawJsonForTransition(proModeJson);
    if (!gate.ok && gate.errors[0] === 'Invalid JSON syntax.') {
      setLoadErrors([t('articlesPage.proModeInvalidSyntax')]);
      return;
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(proModeJson) as Record<string, unknown>;
    } catch {
      setLoadErrors([t('articlesPage.proModeInvalidSyntax')]);
      return;
    }
    let out: unknown = parsed;
    if (gate.ok && gate.payload && Array.isArray(gate.payload.content)) {
      out = {
        ...gate.payload,
        content: ensureContentItemsHaveIds(gate.payload.content),
      };
    }
    setProModeJson(JSON.stringify(out, null, 2));
    setLoadErrors([]);
  };

  useEffect(() => () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); }, []);

  // When navigated from Examples page with a loaded example, apply state and show preview
  useEffect(() => {
    const loadExample = (location.state as { loadExample?: LoadExampleState } | null)?.loadExample;
    if (!loadExample?.state) return;
    const loaded = loadExample.state;
    // Migrate legacy state (blocks-only) to content + blockIds + blocks
    const stateToSet =
      Array.isArray(loaded.content) && Array.isArray(loaded.blockIds)
        ? loaded
        : {
            ...loaded,
            content: (blocksToContentJson(loaded.blocks).content as Record<string, unknown>[]) ?? [],
            blockIds: loaded.blocks.map((b) => b.id),
            blocks: loaded.blocks,
          };
    setState(stateToSet);
    setShowPreview(true);
    setProModeJson(JSON.stringify(contentToPayload(stateToSet.content), null, 2));
    setLoadErrors([]);
    setArticleDiskTarget(null);
    void fingerprintArticleZip(stateToSet).then((fp) => {
      diskBaselineRef.current = fp;
      setDiskDirty(false);
    });
    navigate(location.pathname, { replace: true, state: {} });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount when coming from examples

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="surface relative flex h-[calc(100vh-80px)] flex-col overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,application/zip"
        onChange={handleFileSelect}
        className="hidden"
      />

      <EditorArticleProvider state={state} setState={setState}>
        <ArticleContentProvider>
          <AuthProvider>
        <motion.div
          className="flex flex-1 min-h-0 flex-col items-center overflow-hidden p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="surface-container-low flex max-h-[calc(100vh-2rem-80px)] w-full max-w-[calc(100vw-2rem)] min-h-0 flex-1 flex-col overflow-hidden rounded-xl">
            <header className="surface-container-high flex-shrink-0 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleNew}
                  className="btn-tonal"
                >
                  <FilePlus className="h-5 w-5" />
                  {t('articlesPage.new')}
                </button>
                <button
                  type="button"
                  onClick={handleOpenZip}
                  className="btn-text"
                >
                  <FolderOpen className="h-5 w-5" />
                  {t('articlesPage.openZip')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  title={t('articlesPage.saveShortcutHint')}
                  className="btn-filled"
                >
                  <Save className="h-5 w-5" />
                  {isSaving ? t('articlesPage.saving') : t('articlesPage.save')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveAs()}
                  disabled={isSaving}
                  title={t('articlesPage.saveAsShortcutHint')}
                  className="btn-tonal"
                >
                  <SaveAll className="h-5 w-5" />
                  {t('articlesPage.saveAs')}
                </button>
                {articleFileLabel && (
                  <span className="max-w-[12rem] truncate text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]" title={articleFileLabel}>
                    {articleFileLabel}
                    {diskDirty ? ` ${t('articlesPage.unsavedMarker')}` : ''}
                  </span>
                )}
                <div className="ml-auto flex flex-wrap items-center gap-2">
                {lastSavedAt && (
                  <span className="self-center text-xs text-[var(--md-sys-color-on-surface-variant)]" role="status">
                    {t('articlesPage.draftSavedAt', {
                      time: new Date(lastSavedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
                    })}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => (isProMode ? handleSwitchToNoob() : handleSwitchToPro())}
                  title={isProMode ? t('articlesPage.modeNoobTooltip') : t('articlesPage.modeProTooltip')}
                  className={isProMode ? 'btn-filled' : 'btn-tonal'}
                >
                  {isProMode ? <LayoutList className="h-5 w-5" /> : <CodeXml className="h-5 w-5" />}
                  {isProMode ? t('articlesPage.modeNoob') : t('articlesPage.modePro')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (showPreview) {
                      setShowPreview(false);
                      return;
                    }
                    if (isProMode) {
                      if (syncTimeoutRef.current) {
                        clearTimeout(syncTimeoutRef.current);
                        syncTimeoutRef.current = null;
                      }
                      const ok = syncProJsonToBlocks(proModeJson);
                      if (!ok) {
                        setLoadErrors((prev) => [t('articlesPage.proModePreviewBlocked'), ...prev]);
                        return;
                      }
                    }
                    setShowPreview(true);
                  }}
                  className={showPreview ? 'btn-text' : 'btn-filled'}
                >
                  {showPreview ? <Edit3 className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  {showPreview ? t('articlesPage.edit') : t('articlesPage.preview')}
                </button>
                </div>
              </div>
              {loadErrors.length > 0 && (
                <div className="mt-3 rounded-xl bg-[var(--md-sys-color-error-container)] p-3 text-sm text-[var(--md-sys-color-on-error-container)]">
                  <ul className="list-disc pl-4">
                    {loadErrors.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </header>

            <div className="flex min-h-0 flex-1 overflow-hidden p-3">
              <div className="flex min-h-full min-w-0 flex-1 items-stretch gap-3">
                <div className="surface-container flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl">
                  {showPreview ? (
                    <div key="preview" className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-theme">
                      <ArticleEditorPreview blocks={state.blocks} />
                    </div>
                  ) : isProMode ? (
                    <div key="pro" className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-4">
                      <button
                        type="button"
                        onClick={handlePrettyPrintProJson}
                        title={t('articlesPage.proModePrettyPrint')}
                        aria-label={t('articlesPage.proModePrettyPrint')}
                        className="btn-icon-tonal absolute right-7 top-7 z-10"
                      >
                        <WandSparkles className="h-4 w-4" />
                      </button>
                      <textarea
                        value={proModeJson}
                        onChange={(e) => handleProJsonChange(e.target.value)}
                        placeholder={t('articlesPage.proModePlaceholder')}
                        className="field-filled focus-ring h-full min-h-0 resize-none overflow-y-auto pr-14 font-mono text-sm scrollbar-theme"
                        style={{ minHeight: 0 }}
                        spellCheck={false}
                      />
                    </div>
                  ) : (
                    <div key="blocks" className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 scrollbar-theme">
                      <div className="mb-4 flex-shrink-0">
                        <AppendBlockSplitButton onAppend={addBlock} />
                      </div>
                      <div className="space-y-6 pb-8">
                        {state.blocks.length === 0 && (
                          <p className="py-8 text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
                            {t('articlesPage.noBlocksYet')}
                          </p>
                        )}
                        {state.blocks.map((block, index) => {
                          const common = {
                            index,
                            totalBlocks: state.blocks.length,
                            onMoveUp: () => moveBlock(index, -1),
                            onMoveDown: () => moveBlock(index, 1),
                            onRemove: () => removeBlock(index),
                            onUpdate: (b: EditorBlock) => updateBlock(index, b),
                            numberedImageIds,
                            numberedImages: state.assets.numberedImages,
                            videoIds,
                            articleVideoIds,
                            articleAudioIds,
                            slideshowIds,
                          };
                          switch (block.type) {
                            case 'markdown':
                              return (
                                <MarkdownBlockEditor
                                  key={block.id}
                                  block={block}
                                  {...common}
                                  onInsertAtCaret={(type, insertPlan) => insertAtMarkdownCaret(index, type, insertPlan)}
                                />
                              );
                            case 'accordion':
                              return <AccordionBlockEditor key={block.id} block={block} {...common} />;
                            case 'chessDiagram':
                              return <ChessDiagramBlockEditor key={block.id} block={block} {...common} />;
                            case 'photo':
                              return <PhotoBlockEditor key={block.id} block={block} {...common} />;
                            case 'video':
                              return <VideoBlockEditor key={block.id} block={block} {...common} />;
                            case 'articleVideo':
                              return <ArticleVideoBlockEditor key={block.id} block={block} {...common} />;
                            case 'articleAudio':
                              return <ArticleAudioBlockEditor key={block.id} block={block} {...common} />;
                            case 'slideshow':
                              return <SlideshowBlockEditor key={block.id} block={block} {...common} />;
                            case 'playEngine':
                              return <PlayEngineBlockEditor key={block.id} block={block} {...common} />;
                            case 'dot':
                              return <DotBlockEditor key={block.id} block={block} {...common} />;
                            case 'pie':
                              return <PieBlockEditor key={block.id} block={block} {...common} />;
                            case 'bar':
                              return <BarBlockEditor key={block.id} block={block} {...common} />;
                            case 'katex':
                              return <KaTeXBlockEditor key={block.id} block={block} {...common} />;
                            case 'quiz':
                              return <QuizBlockEditor key={block.id} block={block} {...common} />;
                            case 'tts':
                              return <TtsBlockEditor key={block.id} block={block} {...common} />;
                            case 'smiles':
                              return <SmilesBlockEditor key={block.id} block={block} {...common} />;
                            case 'unknown':
                              return <UnknownBlockEditor key={block.id} block={block} {...common} />;
                            default:
                              return null;
                          }
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {!showPreview && (
                  <aside className="surface-container-highest flex w-72 min-h-0 flex-shrink-0 flex-col overflow-hidden rounded-xl">
                    <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-theme">
                      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                        {t('articlesPage.assets')}
                      </h2>
                      <AssetsPanel state={state} setState={setState} />
                    </div>
                  </aside>
                )}
              </div>
            </div>
          </div>
        </motion.div>
          </AuthProvider>
        </ArticleContentProvider>
      </EditorArticleProvider>

    </div>
  );
}
