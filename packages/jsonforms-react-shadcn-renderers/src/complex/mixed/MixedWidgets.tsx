import { JsonTypeIcon } from './JsonTypeIcon';
import React, { useState } from 'react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { Input } from '@jsonforms-react-shadcn-ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jsonforms-react-shadcn-ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@jsonforms-react-shadcn-ui/collapsible';
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@jsonforms-react-shadcn-ui/tooltip';
import { ChevronRight, Pencil, Trash2, Eye, EyeOff, X } from 'lucide-react';
import {
  MixedTreeNode,
  MixedTreePath,
  mixedPathKey,
  mixedTreeLabel,
} from '@chobantonov/jsonforms-react-renderer-common/mixedTree';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';

export const MixedNavigationContext = React.createContext<{
  selectPath: (path: string) => void;
} | null>(null);
export const MixedTypeSelector = ({
  clearable = true,
  disabled,
  error,
  onChange,
  types,
  value,
}: {
  clearable?: boolean;
  disabled: boolean;
  error?: string;
  fullWidth?: boolean;
  required?: boolean;
  onChange: (value: string | undefined) => void;
  types: string[];
  value: string | null;
}) => {
  const t = useI18n();
  return (
    <div className='min-w-0'>
      <div className='group relative'>
        <Select
          disabled={disabled}
          value={value ?? ''}
          onValueChange={onChange}
        >
          <SelectTrigger
            className={
              clearable && value && !disabled
                ? 'w-full pr-16 [&>svg]:absolute [&>svg]:right-3'
                : 'w-full'
            }
            aria-label={t('mixed.typeLabel')}
            aria-invalid={!!error}
          >
            <SelectValue placeholder={t('mixed.typePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {types.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {clearable && value && !disabled && (
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            disabled={disabled}
            aria-label='Clear type'
            title='Clear type'
            className='absolute right-7 top-1/2 h-7 w-7 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100'
            onPointerDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation();
              onChange(undefined);
            }}
          >
            <X aria-hidden='true' />
          </Button>
        )}
      </div>
      {error && (
        <div role='alert' className='text-sm text-destructive'>
          {error}
        </div>
      )}
    </div>
  );
};
export const NestedMixedNavigation = ({
  label,
  onView,
  selector,
}: {
  description?: string;
  label?: string;
  onView: () => void;
  selector: React.ReactNode;
}) => (
  <div className='space-y-1'>
    {label && <div>{label}</div>}
    <div className='flex items-center gap-2'>
      {selector}
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        aria-label={`View ${label || 'value'}`}
        onClick={onView}
      >
        <Eye aria-hidden='true' />
      </Button>
    </div>
  </div>
);

type TreeProps = {
  domainTree?: boolean;
  renderIndicator?: (node: MixedTreeNode) => React.ReactNode;
  root: MixedTreeNode;
  selectedPath: MixedTreePath;
  onSelect: (node: MixedTreeNode) => void;
  canDelete: (node: MixedTreeNode) => boolean;
  canRename: (node: MixedTreeNode) => boolean;
  onDelete: (node: MixedTreeNode) => void;
  onRename: (node: MixedTreeNode, name: string) => void;
  validateRename: (node: MixedTreeNode, name: string) => string | undefined;
};
export const MixedTree = (props: TreeProps) => {
  const t = useI18n();
  const [search, setSearch] = useState('');
  const [showPrimitives, setShowPrimitives] = useState(false);
  const [renaming, setRenaming] = useState<MixedTreeNode>();
  const [name, setName] = useState('');
  const error = renaming ? props.validateRename(renaming, name) : undefined;
  const commitRename = () => {
    if (renaming && !error) {
      props.onRename(renaming, name);
      setRenaming(undefined);
    }
  };
  const action = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    hover = false,
    destructive = false
  ) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type='button'
          variant={destructive ? 'destructive' : 'ghost'}
          size='icon-sm'
          aria-label={label}
          className={
            hover
              ? 'shrink-0 opacity-0 group-hover/tree-row:opacity-100 group-focus-within/tree-row:opacity-100 [@media(hover:none)]:opacity-100'
              : 'shrink-0'
          }
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
  const match = (node: MixedTreeNode): boolean =>
    mixedTreeLabel(node).toLowerCase().includes(search.toLowerCase()) ||
    node.children.some(match);
  const render = (node: MixedTreeNode): React.ReactNode => {
    const structured = node.type === 'object' || node.type === 'array';
    const selected =
      mixedPathKey(props.selectedPath) === mixedPathKey(node.path);
    if (
      search ? !match(node) : node.path.length && !structured && !showPrimitives
    )
      return null;
    return (
      <Collapsible
        key={mixedPathKey(node.path)}
        defaultOpen={props.domainTree && node.path.length === 0}
      >
        <div className='group/tree-row flex min-w-0 items-center gap-1'>
          {node.children.length > 0 ? (
            <CollapsibleTrigger
              render={<Button type='button' variant='ghost' size='icon-sm' />}
              className='size-8 shrink-0'
              aria-label={`Expand ${mixedTreeLabel(node)}`}
            >
              <ChevronRight aria-hidden='true' />
            </CollapsibleTrigger>
          ) : (
            <span aria-hidden='true' className='size-8 shrink-0' />
          )}
          {renaming &&
          mixedPathKey(renaming.path) === mixedPathKey(node.path) ? (
            <div className='flex min-w-0 flex-1 items-start gap-2'>
              <JsonTypeIcon type={node.type} active={selected} />
              <div className='min-w-0 flex-1'>
                <Input
                  autoFocus
                  aria-label={t('additionalProperties.namePlaceholder')}
                  value={name}
                  aria-invalid={!!error}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      commitRename();
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      setRenaming(undefined);
                    }
                  }}
                />
                {error && (
                  <p
                    role='alert'
                    className='text-sm text-destructive break-words'
                  >
                    {error}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <Button
              type='button'
              variant={selected ? 'secondary' : 'ghost'}
              className='min-w-0 flex-1 justify-start'
              data-recursive-node={
                props.domainTree ? mixedPathKey(node.path) : undefined
              }
              aria-pressed={selected}
              onClick={() => props.onSelect(node)}
            >
              <JsonTypeIcon type={node.type} active={selected} />
              <span className='truncate'>
                {node.path.length === 0 ? node.label : mixedTreeLabel(node)}
              </span>
            </Button>
          )}
          {props.renderIndicator?.(node)}
          {!props.domainTree &&
            node.path.length === 0 &&
            action(
              t(
                showPrimitives ? 'mixed.hidePrimitives' : 'mixed.showPrimitives'
              ),
              showPrimitives ? (
                <Eye aria-hidden='true' />
              ) : (
                <EyeOff aria-hidden='true' />
              ),
              () => setShowPrimitives(!showPrimitives)
            )}
          {props.canRename(node) &&
            !renaming &&
            action(
              t('additionalProperties.renameNamed', {
                name: mixedTreeLabel(node),
              }),
              <Pencil aria-hidden='true' />,
              () => {
                setRenaming(node);
                setName(
                  props.domainTree
                    ? node.label
                    : String(node.path[node.path.length - 1])
                );
              },
              true
            )}
          {props.canDelete(node) &&
            !renaming &&
            action(
              t('mixed.delete'),
              <Trash2 aria-hidden='true' />,
              () => props.onDelete(node),
              true,
              true
            )}
        </div>
        <CollapsibleContent keepMounted className='pl-3'>
          {node.children.map(render)}
        </CollapsibleContent>
      </Collapsible>
    );
  };
  return (
    <TooltipProvider>
      <div className='min-w-0 space-y-2 p-1'>
        <Input
          aria-label={t('mixed.searchLabel')}
          placeholder={t('mixed.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <nav aria-label={t('mixed.treeLabel')}>{render(props.root)}</nav>
      </div>
    </TooltipProvider>
  );
};
