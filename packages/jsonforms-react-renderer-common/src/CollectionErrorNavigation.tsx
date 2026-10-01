import React from 'react';
import { usePathErrorIndicator, useCollectionErrors } from './errorSummary';
import { useI18n } from './translate';

export const CollectionErrorNavigation = ({ path, reveal, renderAction, options }: {
  options?: Record<string, any>;
  path: string; reveal: (index: number) => void;
  renderAction?: (label: string, onClick: () => void, icon: React.ReactNode) => React.ReactNode;
}) => {
  const errors = useCollectionErrors(path);
  const message = usePathErrorIndicator(path, options);
  const t = useI18n();
  if (!errors.count) return null;
  return <div role='status' style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', paddingBlock: 8 }}>
    <span style={{ whiteSpace: 'pre-line' }}>{message}</span>
    {errors.firstIndex !== undefined && (renderAction
      ? renderAction(t('collection.firstError'), () => reveal(errors.firstIndex!), <FirstErrorIcon />)
      : <button type='button' title={t('collection.firstError')} aria-label={t('collection.firstError')}
          style={{ color: 'inherit', background: 'transparent', border: '1px solid currentColor', borderRadius: 4, width: 28, height: 28, display: 'inline-grid', placeItems: 'center', cursor: 'pointer' }}
          onClick={() => reveal(errors.firstIndex!)}><FirstErrorIcon /></button>)}

  </div>;
};

export const RowErrorCount = ({ path, index, renderIndicator }: {
  path: string; index: number;
  renderIndicator?: (message: string) => React.ReactNode;
}) => {
  const errors = useCollectionErrors(path);
  const t = useI18n();
  const count = errors.rowCount(index);
  if (!count) return null;
  const message = t(count === 1 ? 'validation.containerError' : 'validation.containerErrors', { count });
  return renderIndicator ? <>{renderIndicator(message)}</> : <span role='img' aria-label={message} title={message}>
    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'>
      <circle cx='12' cy='12' r='9' /><path d='M12 7v6m0 3v1' />
    </svg>
  </span>;
};

const FirstErrorIcon = () => <svg width='16' height='16' viewBox='0 0 24 24'
  fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round'
  strokeLinejoin='round' aria-hidden='true' focusable='false'>
  <path d='M4 12h14M12 6l6 6-6 6M21 4v16' />
</svg>;
