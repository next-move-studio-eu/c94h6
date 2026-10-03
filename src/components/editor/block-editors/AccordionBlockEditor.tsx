import BlockWrapper from '../BlockWrapper';
import type { AccordionBlock } from '../../../types/articleEditor';
import { useTranslation } from 'react-i18next';
import { ACCORDION_TYPES, type BlockEditorProps } from './blockEditorShared';

const JSX_IN_BODY = /<\/|<[A-Z]/;

function hasJsxInBody(body: string): boolean {
  return JSX_IN_BODY.test(body);
}

export function AccordionBlockEditor({
  block,
  index,
  totalBlocks,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: BlockEditorProps<AccordionBlock>) {
  const { t } = useTranslation(['articleBlocks', 'legacy']);
  return (
    <BlockWrapper
      block={block}
      blockLabel={t('articleEditor.blockAccordion')}
      canMoveUp={index > 0}
      canMoveDown={index < totalBlocks - 1}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <div className="space-y-3">
        <input
          type="text"
          value={block.title}
          onChange={(e) => onUpdate({ ...block, title: e.target.value })}
          placeholder={t('articleEditor.placeholderAccordionTitle')}
          className="field-filled focus-ring"
        />
        <select
          value={block.accordionType}
          onChange={(e) => onUpdate({ ...block, accordionType: e.target.value })}
          className="field-filled focus-ring"
        >
          {ACCORDION_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`articleEditor.accordionType${type}`)}
            </option>
          ))}
        </select>
        <textarea
          value={block.body}
          onChange={(e) => onUpdate({ ...block, body: e.target.value })}
          placeholder={t('articleEditor.placeholderAccordionBody')}
          rows={4}
          className="field-filled focus-ring resize-y"
        />
        {block.body.trim() && hasJsxInBody(block.body) && (
          <p className="rounded-lg bg-[var(--md-sys-color-error-container)] px-3 py-2 text-sm text-[var(--md-sys-color-on-error-container)]" role="status">
            {t('articleEditor.accordionBodyMdOnly')}
          </p>
        )}
      </div>
    </BlockWrapper>
  );
}
