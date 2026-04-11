/**
 * TTS/STT vocabulary block for preview: table with label (e.g. "žlutá"), text (e.g. "yellow"),
 * Play button with voice dropdown, and optional "Hold to record" for speech-to-text practice.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, ChevronDown, Mic, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TtsItemContent } from '../../types/articleContent';

const TTS_VOICE_STORAGE_PREFIX = 'editor-tts-voice-';

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  return (window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition
    ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition
    ?? null;
}

/**
 * Normalize for STT match: trim, lower case, collapse spaces, strip punctuation.
 * Browsers often return "Yellow." or "yellow!" so we must not require exact punctuation.
 */
function normalizeForMatch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:'"()\-–—]/g, '');
}

function getStoredVoiceName(lang: string): string | null {
  try {
    return localStorage.getItem(TTS_VOICE_STORAGE_PREFIX + lang);
  } catch {
    return null;
  }
}

function setStoredVoiceName(lang: string, voiceName: string | null): void {
  try {
    if (voiceName) localStorage.setItem(TTS_VOICE_STORAGE_PREFIX + lang, voiceName);
    else localStorage.removeItem(TTS_VOICE_STORAGE_PREFIX + lang);
  } catch {
    /* ignore */
  }
}

export interface TtsVocabularyProps {
  items: TtsItemContent[];
  /** When true and exactly one item: show only center-aligned play/stop + voice dropdown (no table, no STT). */
  justRead?: boolean;
}

/** Per-row STT result; when ok is false, transcripts may contain what the engine heard (for tooltip). */
type SttRowResult = { ok: true } | { ok: false; transcripts?: string[] };

export default function TtsVocabulary({ items, justRead = false }: TtsVocabularyProps) {
  const { t } = useTranslation('articleBlocks');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [openVoiceRow, setOpenVoiceRow] = useState<number | null>(null);
  const [recordingRow, setRecordingRow] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  /** Per-row STT result. Cleared only when that row is clicked again. */
  const [sttResultByRow, setSttResultByRow] = useState<Record<number, SttRowResult>>({});
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const loadVoices = useCallback(() => {
    setVoices(window.speechSynthesis?.getVoices() ?? []);
  }, []);

  useEffect(() => {
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, [loadVoices]);

  const getVoicesForLang = useCallback((lang: string) => {
    const norm = (lang || 'en-GB').trim();
    return voices.filter((v) => v.lang === norm || v.lang.startsWith(norm.split('-')[0]));
  }, [voices]);

  const getVoiceForRow = useCallback(
    (item: TtsItemContent) => {
      const list = getVoicesForLang(item.language);
      const stored = getStoredVoiceName(item.language);
      const found = stored ? list.find((v) => v.name === stored) : null;
      return found ?? list[0] ?? null;
    },
    [getVoicesForLang]
  );

  const speak = useCallback(
    (
      item: TtsItemContent,
      options?: { onStart?: () => void; onEnd?: () => void }
    ) => {
      const synth = window.speechSynthesis;
      if (!synth || !(item.text ?? '').trim()) return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance((item.text ?? '').trim());
      utterance.lang = (item.language ?? 'en-GB').trim();
      const voice = getVoiceForRow(item);
      if (voice) utterance.voice = voice;
      utterance.onstart = () => options?.onStart?.();
      utterance.onend = () => options?.onEnd?.();
      utterance.onerror = () => options?.onEnd?.();
      synth.speak(utterance);
    },
    [getVoiceForRow]
  );

  const stopSpeak = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const setVoiceForLang = useCallback((lang: string, voice: SpeechSynthesisVoice | null) => {
    if (voice) setStoredVoiceName(lang, voice.name);
    else setStoredVoiceName(lang, null);
  }, []);

  const startRecording = useCallback((rowIndex: number) => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;
    const expectedText = items[rowIndex]?.text ?? '';
    // Use same language as TTS for this row (e.g. en-GB for "yellow") so STT engine matches.
    const lang = (items[rowIndex]?.language ?? 'en-GB').trim() || 'en-GB';
    const rec = new Recognition();
    rec.continuous = false;
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 10;
    let resolved = false;
    rec.onresult = (event: SpeechRecognitionEvent) => {
      if (resolved) return;
      resolved = true;
      const expectedNorm = normalizeForMatch(expectedText);
      const transcripts: string[] = [];
      for (let r = 0; r < event.results.length; r++) {
        const result = event.results[r];
        for (let j = 0; j < result.length; j++) {
          const alt = result.item(j) as SpeechRecognitionAlternative;
          const tr = (alt?.transcript ?? '').trim();
          if (tr && !transcripts.includes(tr)) transcripts.push(tr);
        }
      }
      if (!expectedNorm) {
        setSttResultByRow((prev) => ({ ...prev, [rowIndex]: { ok: false, transcripts: transcripts.length ? transcripts : undefined } }));
        setRecordingRow(null);
        return;
      }
      let match = false;
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        for (let j = 0; j < result.length; j++) {
          const alt = result.item(j) as SpeechRecognitionAlternative;
          const transcript = (alt?.transcript ?? '').trim();
          if (normalizeForMatch(transcript) === expectedNorm) {
            match = true;
            break;
          }
        }
        if (match) break;
      }
      setSttResultByRow((prev) => ({
        ...prev,
        [rowIndex]: match ? { ok: true } : { ok: false, transcripts: transcripts.length ? transcripts : undefined },
      }));
      setRecordingRow(null);
    };
    rec.onerror = () => {
      setRecordingRow(null);
      setSttResultByRow((prev) => ({ ...prev, [rowIndex]: { ok: false } }));
    };
    rec.onend = () => setRecordingRow((prev) => (prev === rowIndex ? null : prev));
    recognitionRef.current = rec;
    rec.start();
    setRecordingRow(rowIndex);
  }, [items]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* already ended */
      }
      recognitionRef.current = null;
    }
    setRecordingRow(null);
  }, []);

  const hasAnyStt = items.some((it) => it.stt);
  const tableClass =
    'w-full border-collapse text-left text-sm table-fixed border border-[var(--border)]';
  const cellClass =
    'align-middle py-2 px-3 border border-[var(--border)] text-[var(--text)]';
  const thClass = `${cellClass} bg-[var(--surfaceHigh)] text-[var(--textSecondary)] font-medium`;

  if (!items?.length) return null;

  const singleItem = items[0];
  const showJustRead = justRead && items.length === 1;

  if (showJustRead) {
    return (
      <div className="my-4 flex justify-center">
        <div className="inline-flex min-w-0 shrink-0 items-stretch rounded-lg border border-[var(--primaryBorder)] bg-[var(--primarySubtle)]">
          {isSpeaking ? (
            <button
              type="button"
              onClick={stopSpeak}
              className="inline-flex items-center gap-1 rounded-l-lg border-0 bg-transparent px-2.5 py-1.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--onPrimary)]"
            >
              <Square className="h-3.5 w-3.5" />
              {t('articleEditor.ttsStop')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                speak(singleItem, {
                  onStart: () => setIsSpeaking(true),
                  onEnd: () => setIsSpeaking(false),
                })
              }
              disabled={!(singleItem.text ?? '').trim()}
              title={typeof singleItem.label === 'string' && singleItem.label.trim() ? singleItem.label.trim() : undefined}
              className="inline-flex items-center gap-1 rounded-l-lg border-0 bg-transparent px-2.5 py-1.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--onPrimary)] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[var(--primary)]"
            >
              <Play className="h-3.5 w-3.5" />
              {(typeof singleItem.label === 'string' && singleItem.label.trim())
                ? singleItem.label.trim()
                : t('articleEditor.ttsPlayAction')}
            </button>
          )}
          <div className="relative flex items-stretch">
            <button
              type="button"
              onClick={() => setOpenVoiceRow(openVoiceRow === 0 ? null : 0)}
              className="inline-flex items-center justify-center rounded-r-lg border-0 border-l border-[var(--primaryBorder)] bg-transparent px-2 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--onPrimary)]"
              aria-label={t('articleEditor.ttsVoiceSelect')}
            >
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${openVoiceRow === 0 ? 'rotate-180' : ''}`}
              />
            </button>
            {openVoiceRow === 0 && (
              <div
                className="absolute left-0 top-full z-50 mt-1 max-h-48 min-w-[12rem] overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg"
                style={{ boxShadow: 'var(--shadowMd)' }}
              >
                {getVoicesForLang(singleItem.language).length === 0 ? (
                  <div className="px-3 py-2 text-xs text-[var(--textSecondary)]">
                    {t('articleEditor.ttsNoVoices')}
                  </div>
                ) : (
                  getVoicesForLang(singleItem.language).map((v) => (
                    <button
                      key={v.name + v.lang}
                      type="button"
                      onClick={() => {
                        setVoiceForLang(singleItem.language, v);
                        setOpenVoiceRow(null);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm ${
                        getVoiceForRow(singleItem)?.name === v.name
                          ? 'bg-[var(--primary)] text-[var(--onPrimary)]'
                          : 'text-[var(--text)] hover:bg-[var(--hoverBg)]'
                      }`}
                    >
                      {v.name} ({v.lang})
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 overflow-x-auto">
      <table className={tableClass}>
        <colgroup>
          <col style={{ width: hasAnyStt ? '35%' : '42.5%' }} />
          <col style={{ width: hasAnyStt ? '35%' : '42.5%' }} />
          <col style={{ width: '15%' }} />
          {hasAnyStt && <col style={{ width: '15%' }} />}
        </colgroup>
        <thead>
          <tr>
            <th className={thClass}>
              {t('articleEditor.ttsLabel')}
            </th>
            <th className={thClass}>
              {t('articleEditor.ttsText')}
            </th>
            <th className={thClass}>
              {t('articleEditor.ttsPlay')}
            </th>
            {hasAnyStt && (
              <th className={thClass}>
                {t('articleEditor.ttsStt')}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className={cellClass}>
                {item.label ?? ''}
              </td>
              <td className={cellClass}>
                {item.text ?? ''}
              </td>
              <td className={cellClass}>
                <div className="inline-flex min-w-0 shrink-0 items-stretch rounded-lg border border-[var(--primaryBorder)] bg-[var(--primarySubtle)]">
                  <button
                    type="button"
                    onClick={() => speak(item)}
                    disabled={!(item.text ?? '').trim()}
                    className="inline-flex items-center gap-1 rounded-l-lg border-0 bg-transparent px-2.5 py-1.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--onPrimary)] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[var(--primary)]"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {t('articleEditor.ttsPlayAction')}
                  </button>
                  <div className="relative flex items-stretch">
                    <button
                      type="button"
                      onClick={() => setOpenVoiceRow(openVoiceRow === i ? null : i)}
                      className="inline-flex items-center justify-center rounded-r-lg border-0 border-l border-[var(--primaryBorder)] bg-transparent px-2 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--onPrimary)]"
                      aria-label={t('articleEditor.ttsVoiceSelect')}
                    >
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 transition-transform ${openVoiceRow === i ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {openVoiceRow === i && (
                      <div
                        className="absolute left-0 top-full z-50 mt-1 max-h-48 min-w-[12rem] overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg"
                        style={{ boxShadow: 'var(--shadowMd)' }}
                      >
                        {getVoicesForLang(item.language).length === 0 ? (
                          <div className="px-3 py-2 text-xs text-[var(--textSecondary)]">
                            {t('articleEditor.ttsNoVoices')}
                          </div>
                        ) : (
                          getVoicesForLang(item.language).map((v) => (
                            <button
                              key={v.name + v.lang}
                              type="button"
                              onClick={() => {
                                setVoiceForLang(item.language, v);
                                setOpenVoiceRow(null);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm ${
                                getVoiceForRow(item)?.name === v.name
                                  ? 'bg-[var(--primary)] text-[var(--onPrimary)]'
                                  : 'text-[var(--text)] hover:bg-[var(--hoverBg)]'
                              }`}
                            >
                              {v.name} ({v.lang})
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              {hasAnyStt && (
                <td className={cellClass}>
                  <div className="min-w-0 shrink-0">
                  {item.stt ? (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (sttResultByRow[i] !== undefined) {
                          setSttResultByRow((prev) => {
                            const next = { ...prev };
                            delete next[i];
                            return next;
                          });
                          return;
                        }
                        startRecording(i);
                      }}
                      onMouseUp={stopRecording}
                      onMouseLeave={stopRecording}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        if (sttResultByRow[i] !== undefined) {
                          setSttResultByRow((prev) => {
                            const next = { ...prev };
                            delete next[i];
                            return next;
                          });
                          return;
                        }
                        startRecording(i);
                      }}
                      onTouchEnd={stopRecording}
                      onTouchCancel={stopRecording}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors ${
                        recordingRow === i
                          ? 'border-[var(--error)] bg-[var(--errorSubtle)] text-[var(--error)] animate-pulse'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--hoverBg)]'
                      }`}
                      title={t('articleEditor.ttsHoldToRecord')}
                    >
                      <Mic className="h-3.5 w-3.5" />
                      {recordingRow === i ? (
                        <span className="flex gap-0.5">
                          <span className="h-2 w-0.5 rounded-full bg-current animate-pulse [animation-duration:0.4s]" />
                          <span className="h-2 w-0.5 rounded-full bg-current animate-pulse [animation-duration:0.5s] [animation-delay:0.1s]" />
                          <span className="h-2 w-0.5 rounded-full bg-current animate-pulse [animation-duration:0.6s] [animation-delay:0.2s]" />
                          {t('articleEditor.ttsRecording')}
                        </span>
                      ) : sttResultByRow[i]?.ok === true ? (
                        <span className="text-[var(--success)]">{t('articleEditor.ttsMatch')}</span>
                      ) : sttResultByRow[i]?.ok === false ? (
                        <span
                          className="text-[var(--error)] cursor-help"
                          title={
                            (sttResultByRow[i] as { ok: false; transcripts?: string[] }).transcripts?.length
                              ? t('articleEditor.ttsHeardTooltip') + '\n' + (sttResultByRow[i] as { ok: false; transcripts: string[] }).transcripts.join('\n')
                              : t('articleEditor.ttsNoMatch')
                          }
                        >
                          {t('articleEditor.ttsNoMatch')}
                        </span>
                      ) : (
                        t('articleEditor.ttsHoldToRecord')
                      )}
                    </button>
                  ) : null}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
