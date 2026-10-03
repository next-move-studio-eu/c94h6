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
  analysisOffButtonLabel: string;
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
  analysisOffButtonLabel,
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
          analysisOffButtonLabel={analysisOffButtonLabel}
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
              analysisOffButtonLabel={analysisOffButtonLabel}
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
  analysisOffButtonLabel: string;
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
  analysisOffButtonLabel,
  compact = false,
}: AnalysisPanelProps) {
  const modes: { label: string; value: 1 | 5 | null; needsEngine: boolean }[] = [
    { label: analysisButtonLabel, value: 1, needsEngine: true },
    { label: contextButtonLabel, value: 5, needsEngine: true },
    { label: analysisOffButtonLabel, value: null, needsEngine: false },
  ];

  return (
    <div className="flex-shrink-0 w-full space-y-3">
      {state.showUciButton && (
        <LoadUciButton
          state={state}
          onClick={actions.handleLoadUci}
          loadUciLabel={loadUciLabel}
          replaceUciLabel={replaceUciLabel}
          className={compact ? 'btn-tonal w-full mb-2' : 'btn-tonal w-full'}
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

      <div className={`flex gap-2 ${compact ? 'mt-2' : ''}`} role="group" aria-label="Analysis mode">
        {modes.map(({ label, value, needsEngine }) => {
          const isActive = state.analysisMode === value;
          const disabled = needsEngine && !state.analysisConnectionReady;
          return (
            <motion.button
              key={label}
              type="button"
              onClick={() => analysisOutputRef.current?.setAnalysisMode(value)}
              disabled={disabled}
              aria-pressed={isActive}
              className={`flex-1 px-3 ${isActive ? 'btn-filled' : 'btn-tonal'}`}
              whileTap={{ scale: 0.98 }}
            >
              {label}
            </motion.button>
          );
        })}
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
    <div className={isFullscreen ? 'flex-shrink-0 surface-container-highest rounded-xl p-3' : 'flex-shrink-0 surface-container-highest rounded-xl p-4'}>
      <div className={`flex items-center justify-between ${isFullscreen ? 'mb-2' : 'mb-3'}`}>
        <h2 className={`${isFullscreen ? 'text-base' : 'text-lg'} font-semibold flex items-center gap-2`}>
          <span className="w-1 h-5 rounded-full bg-primary" />
          {recordingTitle}
        </h2>
        {(state.recordingState === 'recording' || state.recordingState === 'paused') && (
          <div className={`${isFullscreen ? 'text-xl' : 'text-2xl'} font-mono font-bold text-primary`}>
            {formatRecordingTime(state.elapsedTime)}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {state.recordingState === 'idle' && (
          <motion.button
            onClick={actions.handleStartRecording}
            disabled={!state.isWebMSupported}
            className="btn-filled"
            title={!state.isWebMSupported && !isFullscreen ? webmNotSupportedLabel : ''}
            whileTap={state.isWebMSupported ? { scale: 0.98 } : {}}
          >
            {recordButtonLabel}
          </motion.button>
        )}

        {state.recordingState === 'recording' && (
          <>
            <ActionButton label={pauseButtonLabel} onClick={actions.handlePauseRecording} />
            <ActionButton label={stopButtonLabel} onClick={actions.handleStopRecording} danger />
          </>
        )}

        {state.recordingState === 'paused' && (
          <>
            <ActionButton label={resumeButtonLabel} onClick={actions.handleResumeRecording} primary />
            <ActionButton label={stopButtonLabel} onClick={actions.handleStopRecording} danger />
          </>
        )}

        <div className="ml-auto text-sm font-medium">
          {state.recordingState === 'recording' && (
            <span className="text-error animate-pulse">{recordingStatusLabel}</span>
          )}
          {state.recordingState === 'paused' && (
            <span className="text-warning">{pausedStatusLabel}</span>
          )}
          {state.recordingState === 'idle' && <span className="text-on-surface-variant">{idleStatusLabel}</span>}
        </div>
      </div>

      {!state.isWebMSupported && (
        <div className={isFullscreen ? 'mt-3 rounded-xl p-3 text-sm bg-error-container text-on-error-container' : 'mt-4'}>
          {isFullscreen ? (
            webmNotSupportedLabel
          ) : (
            <div className="p-4 rounded-xl bg-error-container text-on-error-container">
              <div className="font-bold text-lg mb-2">{unsupportedBrowserLabel}</div>
              <div className="text-sm">{webmNotSupportedLabel}</div>
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
  primary?: boolean;
  danger?: boolean;
}

function ActionButton({ label, onClick, primary = false, danger = false }: ActionButtonProps) {
  const className = danger ? 'btn-filled !bg-error !text-on-error' : primary ? 'btn-filled' : 'btn-tonal';

  return (
    <motion.button onClick={onClick} className={className} whileTap={{ scale: 0.98 }}>
      {label}
    </motion.button>
  );
}
