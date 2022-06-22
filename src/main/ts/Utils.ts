/**
 * Copyright (c) 2018-present, Ephox, Inc.
 *
 * This source code is licensed under the Apache 2 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Ref, SetupContext } from 'vue';
import { IPropTypes } from './components/EditorPropTypes';
import { Editor as TinyMCEEditor, EditorEvent } from 'tinymce';
declare type ContentFormat = 'raw' | 'text' | 'html' | 'tree';
interface GetContentArgs {
  format?: ContentFormat;
  get?: boolean;
  content?: string;
  getInner?: boolean;
  no_events?: boolean;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  [key: string]: any;
}
interface SetContentArgs {
  format?: string;
  set?: boolean;
  content?: string;
  no_events?: boolean;
  no_selection?: boolean;
}
export interface TinyMCEPluginEditor extends TinyMCEEditor {
  getTpContent(args?: GetContentArgs): string;
  setTpContent(content: string, args?: SetContentArgs): string;
}

const validEvents = [
  'onActivate',
  'onAddUndo',
  'onBeforeAddUndo',
  'onBeforeExecCommand',
  'onBeforeGetContent',
  'onBeforeRenderUI',
  'onBeforeSetContent',
  'onBeforePaste',
  'onBlur',
  'onChange',
  'onClearUndos',
  'onClick',
  'onContextMenu',
  'onCopy',
  'onCut',
  'onDblclick',
  'onDeactivate',
  'onDirty',
  'onDrag',
  'onDragDrop',
  'onDragEnd',
  'onDragGesture',
  'onDragOver',
  'onDrop',
  'onExecCommand',
  'onFocus',
  'onFocusIn',
  'onFocusOut',
  'onGetContent',
  'onHide',
  'onInit',
  'onKeyDown',
  'onKeyPress',
  'onKeyUp',
  'onLoadContent',
  'onMouseDown',
  'onMouseEnter',
  'onMouseLeave',
  'onMouseMove',
  'onMouseOut',
  'onMouseOver',
  'onMouseUp',
  'onNodeChange',
  'onObjectResizeStart',
  'onObjectResized',
  'onObjectSelected',
  'onPaste',
  'onPostProcess',
  'onPostRender',
  'onPreProcess',
  'onProgressState',
  'onRedo',
  'onRemove',
  'onReset',
  'onSaveContent',
  'onSelectionChange',
  'onSetAttrib',
  'onSetContent',
  'onShow',
  'onSubmit',
  'onUndo',
  'onVisualAid'
];

const isValidKey = (key: string) =>
  validEvents.map((event) => event.toLowerCase()).indexOf(key.toLowerCase()) !== -1;

const bindHandlers = (initEvent: EditorEvent<any>, listeners: any, editor: TinyMCEPluginEditor): void => {
  Object.keys(listeners)
    .filter(isValidKey)
    .forEach((key: string) => {
      const handler = listeners[key];
      if (typeof handler === 'function') {
        if (key === 'onInit') {
          handler(initEvent, editor);
        } else {
          editor.on(key.substring(2), (e: EditorEvent<any>) => handler(e, editor));
        }
      }
    });
};

const bindModelHandlers = (props: IPropTypes, ctx: SetupContext, editor: TinyMCEPluginEditor, modelValue: Ref<any>) => {
  const modelEvents = props.modelEvents ? props.modelEvents : null;
  const normalizedEvents = Array.isArray(modelEvents) ? modelEvents.join(' ') : modelEvents;

  // watch(modelValue, (val: string, prevVal: string) => {
  //   if (editor && typeof val === 'string' && val !== prevVal && val !== editor.getContent({ format: props.outputFormat })) {
  //     editor.setContent(val);
  //   }
  // });

  editor.on(normalizedEvents ? normalizedEvents : 'input  focus focusin click focusout drop ObjectResized keydown paste ExecCommand ObjectSelected', () => {
    // ctx.emit('update:modelValue', editor.getContent({ format: props.outputFormat }));
    // eslint-disable-next-line max-len
    ctx.emit('update:modelValue', typeof editor.getTpContent === 'function' ? editor.getTpContent({ format: props.outputFormat }) : editor.getContent({ format: props.outputFormat }));
  });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line no-unused-expressions
  tinymce.tinymcePlugin && setIntervalFn((clear) => {
    if (typeof editor.getTpContent === 'function') {
      clear();
      ctx.emit('update:modelValue', editor.getTpContent({ format: props.outputFormat }));
      ctx.emit('update:modelValue', editor.getTpContent({ format: props.outputFormat }));
    }
  }, 50);
};

const initEditor = (
  initEvent: EditorEvent<any>,
  props: IPropTypes,
  ctx: SetupContext,
  editor: TinyMCEPluginEditor,
  modelValue: Ref<any>,
  content: () => string) => {
  editor.setContent(content());
  if (ctx.attrs['onUpdate:modelValue']) {
    bindModelHandlers(props, ctx, editor, modelValue);
  }
  bindHandlers(initEvent, ctx.attrs, editor);
};

let unique = 0;

const uuid = (prefix: string): string => {
  const time = Date.now();
  const random = Math.floor(Math.random() * 1000000000);

  unique++;

  return prefix + '_' + random + unique + String(time);
};

const isTextarea = (element: Element | null): element is HTMLTextAreaElement =>
  element !== null && element.tagName.toLowerCase() === 'textarea';

const normalizePluginArray = (plugins?: string | string[]): string[] => {
  if (typeof plugins === 'undefined' || plugins === '') {
    return [];
  }

  return Array.isArray(plugins) ? plugins : plugins.split(' ');
};

const mergePlugins = (initPlugins: string | string[], inputPlugins?: string | string[]) =>
  normalizePluginArray(initPlugins).concat(normalizePluginArray(inputPlugins));

const isNullOrUndefined = (value: any): value is null | undefined =>
  value === null || value === undefined;

/**
 *  定时器 超时自动关闭
 * @param func
 * @param delay
 * @param outTime
 */
export const setIntervalFn = (func: any, delay: number, outTime?: number) => {
  // eslint-disable-next-line no-unused-expressions
  !outTime && (outTime = delay * 1000);
  const setIntervalObj: any = {
    id: null,
    outTime,
    outId: null,
  };
  setIntervalObj.id = setInterval((obj) => {
    func(() => {
      clearTimeout(obj.outId);
      clearInterval(obj.id);
    });
  }, delay, setIntervalObj);
  setIntervalObj.outId = setTimeout(() => {
    // eslint-disable-next-line no-unused-expressions
    setIntervalObj.id && clearInterval(setIntervalObj.id);
  }, setIntervalObj.outTime);

};
export {
  bindHandlers,
  bindModelHandlers,
  initEditor,
  isValidKey,
  uuid,
  isTextarea,
  mergePlugins,
  isNullOrUndefined
};