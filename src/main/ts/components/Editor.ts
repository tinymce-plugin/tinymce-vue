/**
 * Copyright (c) 2018-present, Ephox, Inc.
 *
 * This source code is licensed under the Apache 2 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ScriptLoader } from '../ScriptLoader';
import { getTinymce } from '../TinyMCE';
import { isTextarea, mergePlugins, uuid, isNullOrUndefined, initEditor, TinyMCEPluginEditor } from '../Utils';
import { editorProps } from './EditorPropTypes';
import { h, defineComponent, onMounted, ref, Ref, toRefs, nextTick, watch, onBeforeUnmount, onActivated, onDeactivated } from 'vue';
import { EditorEvent, TinyMCE } from 'tinymce';

type EditorOptions = Parameters<TinyMCE['init']>[0];
const defaultOptions: EditorOptions = {
  min_height: 300,
  // menubar: false,
  plugins: [ 'code hr' ],
  toolbar: [ 'code hr' ],
  schema: 'html5',
  // skin: false,
  // content_css: false,
  table_default_attributes: {
    border: '1'
  },
  table_default_styles: {
    'border-collapse': 'collapse',
    'width': '100%'
  },
  table_header_type: 'sectionCells',
  table_responsive_width: true,
  file_picker_types: 'file img media',
  // object_resizing: 'table',
  fontsize_formats: '12px 14px 16px 18px 24px 36px 48px 56px 72px',
};

const renderInline = (ce: any, id: string, elementRef: Ref<Element | null>, tagName?: string) =>
  ce(tagName ? tagName : 'div', {
    id,
    ref: elementRef
  });

const renderIframe = (ce: any, id: string, elementRef: Ref<Element | null>) =>
  ce('textarea', {
    id,
    visibility: 'hidden',
    ref: elementRef
  });

export const Editor = defineComponent({
  props: editorProps,
  setup: (props, ctx) => {
    let conf = props.init ? Object.assign(defaultOptions, props.init) : {};
    const { disabled, modelValue, tagName } = toRefs(props);
    const element: Ref<Element | null> = ref(null);
    let vueEditor: any = null;
    const elementId: string = props.id || uuid('tiny-vue');
    const inlineEditor: boolean = (props.init && props.init.inline) || props.inline;
    const modelBind = !!ctx.attrs['onUpdate:modelValue'];
    let mounting = true;
    const initialValue: string = props.initialValue ? props.initialValue : '';
    let cache = '';

    const getContent = (isMounting: boolean): () => string => modelBind ?
      () => (modelValue?.value ? modelValue.value : '') :
      () => isMounting ? initialValue : cache;

    const initWrapper = (): void => {
      const content = getContent(mounting);
      const finalInit = {
        ...conf,
        readonly: props.disabled,
        selector: `#${elementId}`,
        plugins: mergePlugins(conf.plugins, props.plugins),
        toolbar: props.toolbar || (conf.toolbar),
        inline: inlineEditor,
        setup: (editor: TinyMCEPluginEditor) => {
          vueEditor = editor;
          editor.on('init', (e: EditorEvent<any>) => initEditor(e, props, ctx, editor, modelValue, content));
          if (typeof conf.setup === 'function') {
            conf.setup(editor);
          }
        }
      };
      if (isTextarea(element.value)) {
        element.value.style.visibility = '';
      }
      getTinymce().init(finalInit);
      mounting = false;
    };
    watch(disabled, (disable) => {
      if (vueEditor !== null) {
        if (typeof vueEditor.mode?.set === 'function') {
          vueEditor.mode.set(disable ? 'readonly' : 'design');
        } else {
          vueEditor.setMode(disable ? 'readonly' : 'design');
        }
      }
    });
    watch(tagName, (_) => {
      if (!modelBind) {
        cache = vueEditor.getContent();
      }
      getTinymce()?.remove(vueEditor);
      nextTick(() => initWrapper());
    });
    onMounted(() => {
      if (getTinymce() !== null) {
        initWrapper();
      } else if (element.value && element.value.ownerDocument) {
        const channel = props.cloudChannel ? props.cloudChannel : '6';
        const apiKey = props.apiKey ? props.apiKey : 'no-api-key';
        const scriptSrc = isNullOrUndefined(props.tinymceScriptSrc) ?
          `https://cdn.tiny.cloud/1/${apiKey}/tinymce/${channel}/tinymce.min.js` :
          props.tinymceScriptSrc;
        ScriptLoader.load(
          element.value.ownerDocument,
          scriptSrc,
          initWrapper
        );
      }
    });
    onBeforeUnmount(() => {
      if (getTinymce() !== null) {
        getTinymce().remove(vueEditor);
      }
    });
    if (!inlineEditor) {
      onActivated(() => {
        if (!mounting) {
          initWrapper();
        }
      });
      onDeactivated(() => {
        if (!modelBind) {
          cache = vueEditor.getContent();
        }
        getTinymce()?.remove(vueEditor);
      });
    }
    const rerender = (init: EditorOptions) => {
      cache = vueEditor.getContent();
      getTinymce()?.remove(vueEditor);
      conf = { ...conf, ...init };
      nextTick(() => initWrapper());
    };
    ctx.expose({
      rerender
    });
    return () => inlineEditor ?
      renderInline(h, elementId, element, props.tagName) :
      renderIframe(h, elementId, element);
  }
});
