import { useState, useRef, useEffect, useMemo, useCallback, type SetStateAction } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FilePlus,
  FolderOpen,
  Save,
  SaveAll,
  Eye,
  Edit3,
  Type,
  ListChecks,
  Image as ImageIcon,
  SquarePlay,
  Video as VideoIcon,
  Presentation,
  Swords,
  LayoutList,
  CodeXml,
  Puzzle,
  Workflow,
  Sigma,
  PieChart,
  BarChart2,
  Mic,
  Music,
  FlaskConical,
  WandSparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  createEmptyEditorState,
  createDefaultBlock,
  createBlockId,
  type EditorState,
  type EditorBlock,
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

  const addBlock = (type: EditorBlock['type']) => {
    const block = createDefaultBlock(type);
    if (type === 'photo' && numberedImageIds.length > 0) {
      (block as { imageId: number }).imageId = numberedImageIds[0];
    }
    if (type === 'articleVideo' && articleVideoIds.length > 0) {
      (block as { videoId: string }).videoId = String(articleVideoIds[0]);
    }
    if (type === 'articleAudio' && articleAudioIds.length > 0) {
      (block as { audioId: string }).audioId = String(articleAudioIds[0]);
    }
    setState((s) => {
      const contentItem = blockToContentItem(block);
      const newId = createBlockId();
      const newBlock = { ...block, id: newId };
      return {
        ...s,
        content: [...s.content, contentItem],
        blockIds: [...s.blockIds, newId],
        blocks: [...s.blocks, newBlock],
      };
    });
  };

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
    <div className="relative h-[calc(100vh-80px)] flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
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
          <div className="flex max-h-[calc(100vh-2rem-80px)] w-full max-w-[calc(100vw-2rem)] min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-[var(--surface)]" style={{ boxShadow: 'var(--shadowSm)' }}>
            <header className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleNew}
                  className="flex items-center gap-2 rounded-lg border-2 border-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary)] transition-colors duration-150 hover:bg-[var(--primarySubtle)]"
                >
                  <FilePlus className="h-4 w-4" />
                  {t('articlesPage.new')}
                </button>
                <button
                  type="button"
                  onClick={handleOpenZip}
                  className="flex items-center gap-2 rounded-lg border-2 border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-colors duration-150 hover:bg-[var(--hoverBg)]"
                >
                  <FolderOpen className="h-4 w-4" />
                  {t('articlesPage.openZip')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  title={t('articlesPage.saveShortcutHint')}
                  className="flex items-center gap-2 rounded-lg border-2 border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-colors duration-150 disabled:opacity-60 hover:bg-[var(--hoverBg)]"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? t('articlesPage.saving') : t('articlesPage.save')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveAs()}
                  disabled={isSaving}
                  title={t('articlesPage.saveAsShortcutHint')}
                  className="flex items-center gap-2 rounded-lg border-2 border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-colors duration-150 disabled:opacity-60 hover:bg-[var(--hoverBg)]"
                >
                  <SaveAll className="h-4 w-4" />
                  {t('articlesPage.saveAs')}
                </button>
                {articleFileLabel && (
                  <span className="max-w-[12rem] truncate text-xs font-medium text-[var(--textSecondary)]" title={articleFileLabel}>
                    {articleFileLabel}
                    {diskDirty ? ` ${t('articlesPage.unsavedMarker')}` : ''}
                  </span>
                )}
                <div className="ml-auto flex flex-wrap items-center gap-2">
                {lastSavedAt && (
                  <span className="self-center text-xs text-[var(--textSecondary)]" role="status">
                    {t('articlesPage.draftSavedAt', {
                      time: new Date(lastSavedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
                    })}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => (isProMode ? handleSwitchToNoob() : handleSwitchToPro())}
                  title={isProMode ? t('articlesPage.modeNoobTooltip') : t('articlesPage.modeProTooltip')}
                  className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-semibold ${isProMode ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--onPrimary)] hover:opacity-90' : 'border-[var(--primaryBorder)] text-[var(--text)] hover:bg-[var(--primarySubtle)]'}`}
                >
                  {isProMode ? <LayoutList className="h-4 w-4" /> : <CodeXml className="h-4 w-4" />}
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
                  className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-semibold ${showPreview ? 'border-[var(--primaryBorder)] text-[var(--text)] hover:bg-[var(--primarySubtle)]' : 'border-[var(--primary)] bg-[var(--primary)] text-[var(--onPrimary)] hover:opacity-90'}`}
                >
                  {showPreview ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPreview ? t('articlesPage.edit') : t('articlesPage.preview')}
                </button>
                </div>
              </div>
              {loadErrors.length > 0 && (
                <div className="mt-3 rounded-lg border border-[var(--error)] bg-[var(--errorSubtle)] p-3 text-sm text-[var(--error)]">
                  <ul className="list-disc pl-4">
                    {loadErrors.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </header>

            <div className="flex min-h-0 flex-1 flex overflow-hidden">
              <div className="flex min-h-full min-w-0 flex-1 items-stretch">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
                        className="absolute right-7 top-7 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--primaryBorder)] bg-[var(--surface)] text-[var(--primary)] transition-colors duration-150 hover:bg-[var(--primarySubtle)]"
                      >
                        <WandSparkles className="h-4 w-4" />
                      </button>
                      <textarea
                        value={proModeJson}
                        onChange={(e) => handleProJsonChange(e.target.value)}
                        placeholder={t('articlesPage.proModePlaceholder')}
                        className="h-full min-h-0 w-full resize-none overflow-y-auto rounded-lg border border-[var(--primaryBorder)] bg-[var(--surface)] p-4 pr-14 font-mono text-sm text-[var(--text)] placeholder:text-[var(--textSecondary)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primarySubtle)] scrollbar-theme"
                        style={{ minHeight: 0 }}
                        spellCheck={false}
                      />
                    </div>
                  ) : (
                    <div key="blocks" className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 scrollbar-theme">
                      <div className="mb-4 flex flex-wrap gap-2 flex-shrink-0">
                        <span className="mr-2 self-center text-xs font-medium text-[var(--textSecondary)]">
                          {t('articlesPage.add')}
                        </span>
                        {(
                          [
                            ['markdown', 'articleEditor.blockMarkdown', Type],
                            ['photo', 'articlesPage.blockImage', ImageIcon],
                            ['articleVideo', 'articleEditor.blockArticleVideo', VideoIcon],
                            ['articleAudio', 'articleEditor.blockArticleAudio', Music],
                            ['accordion', 'articlesPage.blockAccordion', ListChecks],
                            ['quiz', 'articlesPage.blockQuiz', Puzzle],
                            ['slideshow', 'articlesPage.blockSlideshow', Presentation],
                            ['tts', 'articleEditor.blockTts', Mic],
                            ['katex', 'articleEditor.blockKatex', Sigma],
                            ['dot', 'articlesPage.blockDot', Workflow],
                            ['pie', 'articlesPage.blockPie', PieChart],
                            ['bar', 'articlesPage.blockBar', BarChart2],
                            ['smiles', 'articleEditor.blockSmiles', FlaskConical],
                            ['chessDiagram', 'articlesPage.blockChessDiagram', Swords],
                            ['video', 'articlesPage.blockVideo', SquarePlay],
                            ['playEngine', 'articlesPage.blockPlayEngine', Swords],
                          ] as [string, string, typeof Type][]
                        ).map(([type, labelKey, Icon]) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => addBlock(type as EditorBlock['type'])}
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--primaryBorder)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--primarySubtle)]"
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {t(labelKey)}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-6 pb-8">
                        {state.blocks.length === 0 && (
                          <p className="py-8 text-center text-sm text-[var(--textSecondary)]">
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
                              return <MarkdownBlockEditor key={block.id} block={block} {...common} />;
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
                  <aside className="flex w-72 flex-shrink-0 flex-col overflow-hidden border-l border-[var(--border)] min-h-0">
                    <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-theme">
                      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--textSecondary)]">
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
