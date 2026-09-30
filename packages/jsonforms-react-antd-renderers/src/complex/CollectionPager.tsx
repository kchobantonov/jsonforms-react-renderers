import React from 'react';
import { Pagination } from 'antd';
import { CollectionPage } from '@chobantonov/jsonforms-react-renderer-common/collectionPagination';
export const CollectionPager = ({ page }: { page: CollectionPage }) =>
  !page.enabled || page.total === 0 ? null : (
    <Pagination
      current={page.current}
      pageSize={page.size}
      total={page.total}
      pageSizeOptions={page.choices}
      showSizeChanger
      onChange={page.change}
      style={{ marginBlock: 12 }}
    />
  );
