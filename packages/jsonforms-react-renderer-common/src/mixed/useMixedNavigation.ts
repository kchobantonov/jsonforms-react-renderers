import { useMemo, type Dispatch, type SetStateAction } from 'react';
import type { MixedTreeNode, MixedTreePath } from './mixedTree';

/** Maps a descendant data path back to its tree node without selecting an unrelated node. */
export const useMixedNavigation = (
  path: string,
  tree: MixedTreeNode | undefined,
  setSelectedPath: Dispatch<SetStateAction<MixedTreePath>>,
  setExpanded: (expanded: boolean) => void,
) =>
  useMemo(
    () => ({
      selectPath: (targetPath: string) => {
        if (!tree) return;
        const findByDataPath = (
          node: MixedTreeNode,
        ): MixedTreeNode | undefined => {
          const nodePath = [path, ...node.path]
            .filter((segment) => segment !== '')
            .join('.');
          if (nodePath === targetPath) return node;
          for (const child of node.children) {
            const found = findByDataPath(child);
            if (found) return found;
          }
          return undefined;
        };
        const target = findByDataPath(tree);
        if (target) {
          setSelectedPath(target.path);
          setExpanded(true);
        }
      },
    }),
    [path, tree, setExpanded, setSelectedPath],
  );
