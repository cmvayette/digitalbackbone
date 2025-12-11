import { ReactRenderer } from '@tiptap/react';
import Mention from '@tiptap/extension-mention';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import { MentionList } from './MentionList';
import type { OwnerRef } from '../../types/policy';

// Mock actor data (replace with real API call)
const mockActors: OwnerRef[] = [
  { id: '1', name: 'J6 (IT Director)', type: 'Position', billetCode: 'J6-001' },
  { id: '2', name: 'Engineering Department', type: 'Organization', uic: 'ENG-001' },
  { id: '3', name: 'Logistics Department', type: 'Organization', uic: 'LOG-001' },
  { id: '4', name: 'Commander', type: 'Position', billetCode: 'CDR-001' },
  { id: '5', name: 'Chief of Staff', type: 'Position', billetCode: 'COS-001' },
  { id: '6', name: 'Admin Department', type: 'Organization', uic: 'ADM-001' },
  { id: '7', name: 'Cyber Security Officer', type: 'Position', billetCode: 'CSO-001' },
];

// Fetch actors from org-chart API (to be implemented)
const fetchActors = async (query: string): Promise<OwnerRef[]> => {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/org-chart/search?q=${query}`);
  // return response.json();

  return mockActors.filter((actor) =>
    actor.name.toLowerCase().includes(query.toLowerCase())
  );
};

export const ActorMention = Mention.configure({
  HTMLAttributes: {
    class: 'mention',
  },
  suggestion: {
    items: async ({ query }) => {
      return await fetchActors(query);
    },

    render: () => {
      let component: ReactRenderer<any>;
      let popup: TippyInstance[];

      return {
        onStart: (props: SuggestionProps) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect as any,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          });
        },

        onUpdate(props: SuggestionProps) {
          component.updateProps(props);

          if (!props.clientRect) {
            return;
          }

          popup[0].setProps({
            getReferenceClientRect: props.clientRect as any,
          });
        },

        onKeyDown(props: any) {
          if (props.event.key === 'Escape') {
            popup[0].hide();
            return true;
          }

          return (component.ref as any)?.onKeyDown(props);
        },

        onExit() {
          popup[0].destroy();
          component.destroy();
        },
      };
    },
  } as Partial<SuggestionOptions>,
});
