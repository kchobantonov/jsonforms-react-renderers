import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@jsonforms-react-shadcn-ui/pagination';
import React from 'react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@jsonforms-react-shadcn-ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';
import { CollectionPage } from '@chobantonov/jsonforms-react-renderer-common/collectionPagination';
export const CollectionPager = ({ page }: { page: CollectionPage }) => {
  const t = useI18n();
  if (!page.enabled || !page.total) return null;
  return (
    <Pagination
      aria-label={t('collection.pagination')}
      className='flex flex-wrap items-center justify-end gap-2 py-2'
    >
      <Select
        value={String(page.size)}
        onValueChange={(value) => page.change(page.current, Number(value))}
      >
        <SelectTrigger aria-label={t('collection.pageSize')} className='w-20'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {page.choices.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <PaginationContent>
        <PaginationItem>
          <Button
            type='button'
            variant='outline'
            size='icon-sm'
            aria-label={t('collection.previous')}
            disabled={page.current === 1}
            onClick={() => page.change(page.current - 1)}
          >
            <ChevronLeft />
          </Button>
        </PaginationItem>
        <PaginationItem>
          <span aria-live='polite'>
            {page.current} / {page.pages}
          </span>
        </PaginationItem>
        <PaginationItem>
          <Button
            type='button'
            variant='outline'
            size='icon-sm'
            aria-label={t('collection.next')}
            disabled={page.current === page.pages}
            onClick={() => page.change(page.current + 1)}
          >
            <ChevronRight />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
