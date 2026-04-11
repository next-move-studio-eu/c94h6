import type { TFunction } from 'i18next';
import type { EditorState } from '../../../types/articleEditor';

export interface AssetsPanelProps {
  state: EditorState;
  setState: React.Dispatch<React.SetStateAction<EditorState>>;
}

export type AssetsTranslation = TFunction<'articleBlocks' | 'legacy'>;
