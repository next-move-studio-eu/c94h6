import BlockWrapper from '../BlockWrapper';
import Select from '../../Select';
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
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
        />
        <Select
          value={block.accordionType}
          onChange={(v) => onUpdate({ ...block, accordionType: v })}
          options={ACCORDION_TYPES.map((type) => ({
            value: type,
            label: t(`articleEditor.accordionType${type}`),
          }))}
          variant="editor"
        />
        <textarea
          value={block.body}
          onChange={(e) => onUpdate({ ...block, body: e.target.value })}
          placeholder={t('articleEditor.placeholderAccordionBody')}
          rows={4}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
        />
        {block.body.trim() && hasJsxInBody(block.body) && (
          <p className="text-sm text-amber-600 dark:text-amber-400" role="status">
            {t('articleEditor.accordionBodyMdOnly')}
          </p>
        )}
      </div>
    </BlockWrapper>
  );
}
