import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Users, Building2, User } from 'lucide-react';
import type { OwnerRef } from '../../types/policy';

interface MentionListProps {
  items: OwnerRef[];
  command: (item: { id: string; label: string }) => void;
}

interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevItems, setPrevItems] = useState(props.items);

  // Reset selection when items change (using derived state pattern)
  if (props.items !== prevItems) {
    setPrevItems(props.items);
    setSelectedIndex(0);
  }

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.name });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  const getIcon = (type: string) => {
    switch (type) {
      case 'Organization':
        return <Building2 size={14} className="text-blue-400" />;
      case 'Position':
        return <Users size={14} className="text-blue-400" />;
      case 'Person':
        return <User size={14} className="text-blue-400" />;
      default:
        return <Users size={14} className="text-blue-400" />;
    }
  };

  if (props.items.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-3 min-w-[300px]">
        <div className="text-center text-slate-500 text-sm py-2">No actors found</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 min-w-[300px] max-h-[300px] overflow-y-auto">
      {props.items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => selectItem(index)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
            index === selectedIndex
              ? 'bg-blue-900/30 border border-blue-900/50'
              : 'hover:bg-slate-800 border border-transparent'
          }`}
        >
          <div className="shrink-0">{getIcon(item.type)}</div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium truncate ${
                index === selectedIndex ? 'text-blue-400' : 'text-slate-200'
              }`}
            >
              {item.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="uppercase">{item.type}</span>
              {item.uic && (
                <>
                  <span>•</span>
                  <span>UIC: {item.uic}</span>
                </>
              )}
              {item.billetCode && (
                <>
                  <span>•</span>
                  <span>Billet: {item.billetCode}</span>
                </>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = 'MentionList';
