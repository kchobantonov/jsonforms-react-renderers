import React from 'react';
import { Pagination, theme } from 'antd';
import { CollectionPage } from '@chobantonov/jsonforms-react-renderer-common/collectionPagination';
export const CollectionPager = ({ page }: { page: CollectionPage }) => {
  const { token } = theme.useToken();
  return !page.enabled || page.total === 0 ? null : (
    <div data-collection-footer style={{ display: 'flex', justifyContent: 'flex-end', paddingBlock: 12, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
      <Pagination
        current={page.current}
        pageSize={page.size}
        total={page.total}
        pageSizeOptions={page.choices}
        showSizeChanger
        onChange={page.change}
      />
    </div>
  );
};
