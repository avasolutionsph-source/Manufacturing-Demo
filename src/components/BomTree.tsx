import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Package, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import type { BOMNode } from '@/types';

export interface BomTreeProps {
  nodes: BOMNode[];
  onNodeClick?: (node: BOMNode) => void;
  expandedByDefault?: boolean;
}

export function BomTree({ nodes, onNodeClick, expandedByDefault = true }: BomTreeProps) {
  return (
    <div className="space-y-1" role="tree" aria-label="Bill of Materials">
      {nodes.map((node) => (
        <BomTreeNode
          key={node.id}
          node={node}
          onNodeClick={onNodeClick}
          expandedByDefault={expandedByDefault}
        />
      ))}
    </div>
  );
}

interface BomTreeNodeProps {
  node: BOMNode;
  level?: number;
  onNodeClick?: (node: BOMNode) => void;
  expandedByDefault?: boolean;
}

function BomTreeNode({ node, level = 0, onNodeClick, expandedByDefault = true }: BomTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(expandedByDefault);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div
        className={clsx(
          'flex items-center gap-2 py-2 px-3 rounded-lg transition-colors',
          'hover:bg-secondary-50 cursor-pointer group',
          level > 0 && 'ml-6'
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
        tabIndex={0}
      >
        {/* Expand/collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          className={clsx(
            'w-5 h-5 flex items-center justify-center rounded transition-colors',
            hasChildren ? 'text-secondary-400 hover:text-secondary-600 hover:bg-secondary-200' : 'invisible'
          )}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          disabled={!hasChildren}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          )}
        </button>

        {/* Icon */}
        <div
          className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            hasChildren ? 'bg-primary-50 text-primary-600' : 'bg-secondary-100 text-secondary-500'
          )}
        >
          {hasChildren ? <Layers className="w-4 h-4" /> : <Package className="w-4 h-4" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-secondary-900 truncate">{node.itemName}</span>
            <span className="text-xs text-secondary-400 font-mono">{node.itemSku}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-secondary-500">
            <span>
              Qty: <span className="font-medium text-secondary-700">{node.quantity}</span>
            </span>
            <span>{node.unitOfMeasure}</span>
          </div>
        </div>

        {/* Level indicator */}
        <span className="text-xs text-secondary-400 bg-secondary-100 px-2 py-0.5 rounded">
          L{node.level}
        </span>
      </div>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            role="group"
          >
            {node.children!.map((child) => (
              <BomTreeNode
                key={child.id}
                node={child}
                level={level + 1}
                onNodeClick={onNodeClick}
                expandedByDefault={expandedByDefault}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact BOM list view (alternative display)
export interface BomListProps {
  nodes: BOMNode[];
  showQuantities?: boolean;
}

export function BomList({ nodes, showQuantities = true }: BomListProps) {
  const flattenNodes = (nodes: BOMNode[], level = 0): Array<BOMNode & { displayLevel: number }> => {
    return nodes.reduce<Array<BOMNode & { displayLevel: number }>>((acc, node) => {
      acc.push({ ...node, displayLevel: level });
      if (node.children && node.children.length > 0) {
        acc.push(...flattenNodes(node.children, level + 1));
      }
      return acc;
    }, []);
  };

  const flatNodes = flattenNodes(nodes);

  return (
    <div className="divide-y divide-secondary-100">
      {flatNodes.map((node) => (
        <div
          key={node.id}
          className="flex items-center gap-3 py-2"
          style={{ paddingLeft: `${node.displayLevel * 1}rem` }}
        >
          <Package className="w-4 h-4 text-secondary-400 shrink-0" />
          <span className="font-mono text-xs text-secondary-400 w-20 shrink-0">{node.itemSku}</span>
          <span className="text-sm text-secondary-700 flex-1 truncate">{node.itemName}</span>
          {showQuantities && (
            <span className="text-sm text-secondary-500 shrink-0">
              {node.quantity} {node.unitOfMeasure}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
