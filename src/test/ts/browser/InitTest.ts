import { GeneralSteps, Logger, Pipeline, Assertions, Chain, Keyboard, Keys } from '@ephox/agar';
import { UnitTest } from '@ephox/bedrock-client';
import { VersionLoader } from '@tinymce/miniature';
import { cRender, cRemove } from '../alien/Loader';
import { SugarElement } from '@ephox/sugar';

UnitTest.asynctest('InitTest', (success, failure) => {
  const cFakeType = (str: string) => Chain.op((context: any) => {
    context.editor.getBody().innerHTML = '<p>' + str + '</p>';
    Keyboard.keystroke(Keys.space(), {}, SugarElement.fromDom(context.editor.getBody()));
  });

  const sTestVersion = (version: '4' | '5' | '6') => VersionLoader.sWithVersion(
    version,
    GeneralSteps.sequence([
      Logger.t('Should be able to setup editor', Chain.asStep({}, [
        cRender(),
        Chain.op((context) => {
          Assertions.assertEq('Editor should not be inline', false, context.editor.inline);
        }),
        cRemove
      ])),

      Logger.t('Should be able to setup editor', Chain.asStep({}, [
        cRender({}, `<editor :init="init" :inline=true ></editor>`),
        Chain.op((context) => {
          Assertions.assertEq('Editor should be inline', true, context.editor.inline);
        }),
        cRemove
      ])),

      Logger.t('Should be able to setup editor', Chain.asStep({}, [
        cRender({ init: { inline: true }}),
        Chain.op((context) => {
          Assertions.assertEq('Editor should be inline', true, context.editor.inline);
        }),
        cRemove
      ])),

      Logger.t('Test one way binding tinymce-vue -> variable', GeneralSteps.sequence([
        Logger.t('Test outputFormat="text"', Chain.asStep({}, [
          cRender({
            content: undefined
          }, `
            <editor
              :init="init"
              @update:modelValue="content = $event"
              output-format="text"
            ></editor>
          `),
          cFakeType('A'),
          Chain.op((context) => {
            Assertions.assertEq('Content emitted should be of format="text"', 'A', context.vm.content);
          }),
          cRemove
        ])),
        Logger.t('Test outputFormat="html"', Chain.asStep({}, [
          cRender({
            content: undefined
          }, `
            <editor
              :init="init"
              v-model="content"
              output-format="html"
            ></editor>
          `),
          cFakeType('A'),
          Chain.op((context) => {
            Assertions.assertEq('Content emitted should be of format="html"', '<p>A</p>', context.vm.content);
          }),
          cRemove
        ])),
      ])),
    ])
  );

  Pipeline.async({}, [
    sTestVersion('4'),
    sTestVersion('5'),
    sTestVersion('6')
  ], success, failure);
});