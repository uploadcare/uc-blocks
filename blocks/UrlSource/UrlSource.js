import { UploaderBlock } from '../../abstract/UploaderBlock.js';
import { ActivityBlock } from '../../abstract/ActivityBlock.js';

export class UrlSource extends UploaderBlock {
  activityType = ActivityBlock.activities.URL;

  init$ = {
    ...this.init$,
    importDisabled: true,
    onUpload: () => {
      let url = this.ref.input['value'];
      this.uploadCollection.add({
        externalUrl: url,
      });
      this.$['*currentActivity'] = ActivityBlock.activities.UPLOAD_LIST;
    },
    onCancel: () => {
      this.cancelFlow();
    },
    onInput: (e) => {
      let value = /** @type {HTMLInputElement} */ (e.target).value;
      this.set$({ importDisabled: !value });
    },
  };

  initCallback() {
    super.initCallback();
    this.registerActivity(this.activityType, () => {
      this.set$({
        '*activityCaption': this.l10n('caption-from-url'),
        '*activityIcon': 'url',
      });
    });
  }
}

UrlSource.template = /*html*/ `
<input placeholder="https://..." .url-input type="text" ref="input" set="oninput: onInput"/>
<button
  type="button"
  class="url-upload-btn primary-btn"
  set="onclick: onUpload; @disabled: importDisabled">
</button>
<button
  type="button"
  class="cancel-btn secondary-btn"
  set="onclick: onCancel"
  l10n="cancel">
</button>
`;
