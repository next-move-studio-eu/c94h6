import type { RefObject } from 'react';
import { motion } from 'framer-motion';
import EngineAnalysisOutput from '../../components/EngineAnalysisOutput';
import type { EngineAnalysisOutputRef } from '../../components/EngineAnalysisOutput';
import PgnViewer from '../../components/PgnViewer';
import type { PgnViewerRef, PgnViewerSelection } from '../../components/PgnViewer';
import { ThemeProvider } from '../../contexts/ThemeContext';
import type {
  RecorderPageActions,
  RecorderPageTexts,
  RecorderSessionState,
} from './types';
import { formatRecordingTime, translateSanMove } from './utils';

interface RecorderSidebarProps {
  mode: 'light' | 'dark';
  layout: 'normal' | 'fullscreen';
  state: RecorderSessionState;
  texts: RecorderPageTexts;
  actions: Pick<
    RecorderPageActions,
    | 'handleLoadUci'
    | 'handlePositionChange'
    | 'handlePgnLoad'
    | 'setPgnSelection'
    | 'handleStartRecording'
    | 'handlePauseRecording'
    | 'handleResumeRecording'
    | 'handleStopRecording'
  >;
  analysisOutputRef: RefObject<EngineAnalysisOutputRef | null>;
  pgnViewerRef: RefObject<PgnViewerRef | null>;
  forwardSelectButtonRef: { readonly current: HTMLButtonElement | null };
  recordingTitle: string;
  analysisButtonLabel: string;
  contextButtonLabel: string;
  loadUciLabel: string;
  replaceUciLabel: string;
  recordButtonLabel: string;
  pauseButtonLabel: string;
  resumeButtonLabel: string;
  stopButtonLabel: string;
  recordingStatusLabel: string;
  pausedStatusLabel: string;
  idleStatusLabel: string;
  unsupportedBrowserLabel: string;
  webmNotSupportedLabel: string;
}

export default function RecorderSidebar({
  mode,
  layout,
  state,
  texts,
  actions,
  analysisOutputRef,
  pgnViewerRef,
  forwardSelectButtonRef,
  recordingTitle,
  analysisButtonLabel,
  contextButtonLabel,
  loadUciLabel,
  replaceUciLabel,
  recordButtonLabel,
  pauseButtonLabel,
  resumeButtonLabel,
  stopButtonLabel,
  recordingStatusLabel,
  pausedStatusLabel,
  idleStatusLabel,
  unsupportedBrowserLabel,
  webmNotSupportedLabel,
}: RecorderSidebarProps) {
  if (layout === 'fullscreen') {
    return (
      <>
        <AnalysisPanel
          mode={mode}
          state={state}
          actions={actions}
          analysisOutputRef={analysisOutputRef}
          loadUciLabel={loadUciLabel}
          replaceUciLabel={replaceUciLabel}
          analysisButtonLabel={analysisButtonLabel}
          contextButtonLabel={contextButtonLabel}
          compact
        />

        <div className="flex-1 min-h-0 flex flex-col">
          <PgnPanel
            mode={mode}
            pgn={state.pgn}
            pgnSelection={state.pgnSelection}
            pgnViewerRef={pgnViewerRef}
            forwardSelectButtonRef={forwardSelectButtonRef}
            texts={texts}
            onPositionChange={actions.handlePositionChange}
            onPgnLoad={actions.handlePgnLoad}
            onSelectionChange={actions.setPgnSelection}
          />
        </div>

        <RecordingPanel
          layout="fullscreen"
          state={state}
          actions={actions}
          recordingTitle={recordingTitle}
          recordButtonLabel={recordButtonLabel}
          pauseButtonLabel={pauseButtonLabel}
          resumeButtonLabel={resumeButtonLabel}
          stopButtonLabel={stopButtonLabel}
          recordingStatusLabel={recordingStatusLabel}
          pausedStatusLabel={pausedStatusLabel}
          idleStatusLabel={idleStatusLabel}
          unsupportedBrowserLabel={unsupportedBrowserLabel}
          webmNotSupportedLabel={webmNotSupportedLabel}
        />
      </>
    );
  }

  return (
    <>
      <div
        className="flex-1 flex flex-col gap-4 overflow-y-auto min-w-0 min-h-0"
        style={state.boardColumnHeight ? { maxHeight: state.boardColumnHeight } : undefined}
      >
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <PgnPanel
            mode={mode}
            pgn={state.pgn}
            pgnSelection={state.pgnSelection}
            pgnViewerRef={pgnViewerRef}
            forwardSelectButtonRef={forwardSelectButtonRef}
            texts={texts}
            onPositionChange={actions.handlePositionChange}
            onPgnLoad={actions.handlePgnLoad}
            onSelectionChange={actions.setPgnSelection}
          />
        </div>
      </div>

      <div
        className="flex-shrink-0 w-[22rem] flex flex-col gap-4 overflow-y-auto min-h-0"
        style={state.boardColumnHeight ? { maxHeight: state.boardColumnHeight } : undefined}
      >
        {!state.recordedZipBlob && (
          <div className="flex-1 flex flex-col min-h-0">
            <AnalysisPanel
              mode={mode}
              state={state}
              actions={actions}
              analysisOutputRef={analysisOutputRef}
              loadUciLabel={loadUciLabel}
              replaceUciLabel={replaceUciLabel}
              analysisButtonLabel={analysisButtonLabel}
              contextButtonLabel={contextButtonLabel}
            />

            <div className="flex-1 min-h-4" />

            <RecordingPanel
              layout="normal"
              state={state}
              actions={actions}
              recordingTitle={recordingTitle}
              recordButtonLabel={recordButtonLabel}
              pauseButtonLabel={pauseButtonLabel}
              resumeButtonLabel={resumeButtonLabel}
              stopButtonLabel={stopButtonLabel}
              recordingStatusLabel={recordingStatusLabel}
              pausedStatusLabel={pausedStatusLabel}
              idleStatusLabel={idleStatusLabel}
              unsupportedBrowserLabel={unsupportedBrowserLabel}
              webmNotSupportedLabel={webmNotSupportedLabel}
            />
          </div>
        )}
      </div>
    </>
  );
}

interface PgnPanelProps {
  mode: 'light' | 'dark';
  pgn: string;
  pgnSelection: PgnViewerSelection | null;
  pgnViewerRef: RefObject<PgnViewerRef | null>;
  forwardSelectButtonRef: { readonly current: HTMLButtonElement | null };
  texts: RecorderPageTexts;
  onPositionChange: RecorderPageActions['handlePositionChange'];
  onPgnLoad: RecorderPageActions['handlePgnLoad'];
  onSelectionChange: (selection: PgnViewerSelection | null) => void;
}

function PgnPanel({
  mode,
  pgn,
  pgnSelection,
  pgnViewerRef,
  forwardSelectButtonRef,
  texts,
  onPositionChange,
  onPgnLoad,
  onSelectionChange,
}: PgnPanelProps) {
  return (
    <ThemeProvider mode={mode}>
      <PgnViewer
        ref={pgnViewerRef as RefObject<PgnViewerRef>}
        pgn={pgn}
        showLoadButton={true}
        onPositionChange={onPositionChange}
        onPgnLoad={onPgnLoad}
        initialSelection={pgnSelection}
        onSelectionChange={onSelectionChange}
        forwardSelectButtonRef={forwardSelectButtonRef}
        texts={texts.pgnViewerTexts}
        translateMove={translateSanMove}
      />
    </ThemeProvider>
  );
}

interface AnalysisPanelProps {
  mode: 'light' | 'dark';
  state: RecorderSessionState;
  actions: Pick<RecorderPageActions, 'handleLoadUci'>;
  analysisOutputRef: RefObject<EngineAnalysisOutputRef | null>;
  loadUciLabel: string;
  replaceUciLabel: string;
  analysisButtonLabel: string;
  contextButtonLabel: string;
  compact?: boolean;
}

function AnalysisPanel({
  mode,
  state,
  actions,
  analysisOutputRef,
  loadUciLabel,
  replaceUciLabel,
  analysisButtonLabel,
  contextButtonLabel,
  compact = false,
}: AnalysisPanelProps) {
  const labels = [
    { label: state.analysisLoading ? '...' : analysisButtonLabel, depth: 1 as const },
    { label: state.analysisLoading ? '...' : contextButtonLabel, depth: 5 as const },
  ];

  return (
    <div className="flex-shrink-0 w-full space-y-3">
      {state.showUciButton && (
        <LoadUciButton
          state={state}
          onClick={actions.handleLoadUci}
          loadUciLabel={loadUciLabel}
          replaceUciLabel={replaceUciLabel}
          className={compact ? 'w-full px-3 py-1.5 text-sm rounded border mb-2 transition-opacity' : 'w-full px-3 py-1.5 text-sm rounded border transition-opacity'}
        />
      )}

      <ThemeProvider mode={mode}>
        <EngineAnalysisOutput
          ref={analysisOutputRef as RefObject<EngineAnalysisOutputRef>}
          fen={state.fen}
          gameId="management-recorder"
          translateMove={translateSanMove}
        />
      </ThemeProvider>

      <div className={`flex gap-2 ${compact ? 'mt-2' : ''}`}>
        {labels.map(({ label, depth }) => (
          <motion.button
            key={depth}
            onClick={() => analysisOutputRef.current?.requestAnalysis(depth)}
            disabled={state.analysisLoading || !state.analysisConnectionReady}
            className="flex-1 px-3 py-1.5 text-sm bg-[var(--surfaceHigh)] text-[var(--text)] rounded hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.98 }}
          >
            {label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

interface LoadUciButtonProps {
  state: RecorderSessionState;
  onClick: () => void | Promise<void>;
  loadUciLabel: string;
  replaceUciLabel: string;
  className: string;
}

function LoadUciButton({ state, onClick, loadUciLabel, replaceUciLabel, className }: LoadUciButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={state.loadUciPending}
      className={className}
      style={{
        backgroundColor: 'var(--surfaceHigh)',
        color: 'var(--text)',
        borderColor: 'var(--border)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {state.loadUciPending ? '...' : state.uciEngineReady ? replaceUciLabel : loadUciLabel}
    </motion.button>
  );
}

interface RecordingPanelProps {
  layout: 'normal' | 'fullscreen';
  state: RecorderSessionState;
  actions: Pick<
    RecorderPageActions,
    'handleStartRecording' | 'handlePauseRecording' | 'handleResumeRecording' | 'handleStopRecording'
  >;
  recordingTitle: string;
  recordButtonLabel: string;
  pauseButtonLabel: string;
  resumeButtonLabel: string;
  stopButtonLabel: string;
  recordingStatusLabel: string;
  pausedStatusLabel: string;
  idleStatusLabel: string;
  unsupportedBrowserLabel: string;
  webmNotSupportedLabel: string;
}

function RecordingPanel({
  layout,
  state,
  actions,
  recordingTitle,
  recordButtonLabel,
  pauseButtonLabel,
  resumeButtonLabel,
  stopButtonLabel,
  recordingStatusLabel,
  pausedStatusLabel,
  idleStatusLabel,
  unsupportedBrowserLabel,
  webmNotSupportedLabel,
}: RecordingPanelProps) {
  const isFullscreen = layout === 'fullscreen';

  return (
    <div
      className={isFullscreen ? 'flex-shrink-0 pt-3 border-t' : 'flex-shrink-0 pt-4 border-t'}
      style={{ borderColor: isFullscreen ? 'var(--border)' : 'var(--divider)' }}
    >
      <div className={`flex items-center justify-between ${isFullscreen ? 'mb-2' : 'mb-3'}`}>
        <h2
          className={`${isFullscreen ? 'text-base' : 'text-lg'} font-semibold flex items-center gap-2`}
          style={{ color: 'var(--text)' }}
        >
          <span className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
          {recordingTitle}
        </h2>
        {(state.recordingState === 'recording' || state.recordingState === 'paused') && (
          <div
            className={`${isFullscreen ? 'text-xl' : 'text-2xl'} font-mono font-bold`}
            style={{ color: 'var(--primary)' }}
          >
            {formatRecordingTime(state.elapsedTime)}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {state.recordingState === 'idle' && (
          <motion.button
            onClick={actions.handleStartRecording}
            disabled={!state.isWebMSupported}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isFullscreen ? '' : 'duration-150'}`}
            style={
              state.isWebMSupported
                ? { backgroundColor: 'var(--primary)', color: 'var(--onPrimary)' }
                : isFullscreen
                  ? { backgroundColor: 'var(--surfaceHigh)', color: 'var(--text)', cursor: 'not-allowed', opacity: 0.6 }
                  : { backgroundColor: 'var(--surfaceHigh)', color: 'var(--textDisabled)', cursor: 'not-allowed' }
            }
            onMouseEnter={(event) => {
              if (!isFullscreen && state.isWebMSupported) {
                (event.currentTarget as HTMLElement).style.backgroundColor = 'var(--primaryHover)';
              }
            }}
            onMouseLeave={(event) => {
              if (!isFullscreen && state.isWebMSupported) {
                (event.currentTarget as HTMLElement).style.backgroundColor = 'var(--primary)';
              }
            }}
            title={!state.isWebMSupported && !isFullscreen ? webmNotSupportedLabel : ''}
            whileTap={state.isWebMSupported ? { scale: 0.98 } : {}}
          >
            {recordButtonLabel}
          </motion.button>
        )}

        {state.recordingState === 'recording' && (
          <>
            <ActionButton
              label={pauseButtonLabel}
              onClick={actions.handlePauseRecording}
              isFullscreen={isFullscreen}
              primary={false}
            />
            <ActionButton label={stopButtonLabel} onClick={actions.handleStopRecording} isFullscreen={isFullscreen} danger />
          </>
        )}

        {state.recordingState === 'paused' && (
          <>
            <ActionButton label={resumeButtonLabel} onClick={actions.handleResumeRecording} isFullscreen={isFullscreen} primary />
            <ActionButton label={stopButtonLabel} onClick={actions.handleStopRecording} isFullscreen={isFullscreen} danger />
          </>
        )}

        <div className={`ml-auto ${isFullscreen ? 'text-text' : ''} text-sm font-medium`}>
          {state.recordingState === 'recording' && (
            <span className={isFullscreen ? 'text-error animate-pulse' : 'animate-pulse'} style={isFullscreen ? undefined : { color: 'var(--error)' }}>
              {recordingStatusLabel}
            </span>
          )}
          {state.recordingState === 'paused' && (
            <span className={isFullscreen ? 'text-warning' : ''} style={isFullscreen ? undefined : { color: 'var(--warning)' }}>
              {pausedStatusLabel}
            </span>
          )}
          {state.recordingState === 'idle' && <span style={{ color: 'var(--textSecondary)' }}>{idleStatusLabel}</span>}
        </div>
      </div>

      {!state.isWebMSupported && (
        <div className={isFullscreen ? 'mt-3 p-3 rounded-lg text-sm' : 'flex-shrink-0 mt-4 pt-4 border-t'} style={isFullscreen ? { backgroundColor: 'var(--error)', color: 'var(--onPrimary)' } : { borderColor: 'var(--divider)' }}>
          {isFullscreen ? (
            webmNotSupportedLabel
          ) : (
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--error)', color: 'var(--onError)' }}>
              <div className="font-bold text-lg mb-2">{unsupportedBrowserLabel}</div>
              <div className="text-sm opacity-95">{webmNotSupportedLabel}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void | Promise<void>;
  isFullscreen: boolean;
  primary?: boolean;
  danger?: boolean;
}

function ActionButton({ label, onClick, isFullscreen, primary = false, danger = false }: ActionButtonProps) {
  const style = danger
    ? { backgroundColor: 'var(--error)', color: isFullscreen ? 'var(--onPrimary)' : 'var(--onError)' }
    : primary
      ? { backgroundColor: 'var(--primary)', color: 'var(--onPrimary)' }
      : { backgroundColor: 'var(--surfaceHigh)', color: 'var(--text)' };

  return (
    <motion.button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm ${primary || danger ? 'font-semibold' : 'font-medium'} ${isFullscreen ? '' : 'transition-colors duration-150'}`}
      style={style}
      onMouseEnter={(event) => {
        if (!isFullscreen) {
          if (primary) {
            (event.currentTarget as HTMLElement).style.backgroundColor = 'var(--primaryHover)';
          } else if (danger) {
            (event.currentTarget as HTMLElement).style.opacity = '0.9';
          } else {
            (event.currentTarget as HTMLElement).style.backgroundColor = 'var(--hoverBg)';
          }
        }
      }}
      onMouseLeave={(event) => {
        if (!isFullscreen) {
          if (primary) {
            (event.currentTarget as HTMLElement).style.backgroundColor = 'var(--primary)';
          } else if (danger) {
            (event.currentTarget as HTMLElement).style.opacity = '1';
          } else {
            (event.currentTarget as HTMLElement).style.backgroundColor = 'var(--surfaceHigh)';
          }
        }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {label}
    </motion.button>
  );
}
