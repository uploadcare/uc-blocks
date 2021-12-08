import { BlockComponent } from '../BlockComponent/BlockComponent.js';

export class SourceList extends BlockComponent {
  initCallback() {
    let srcListStr = this.cfg('source-list');
    if (!srcListStr) {
      return;
    }
    let list = srcListStr.split(',').map((srcName) => {
      return srcName.trim();
    });
    let html = '';
    list.forEach((srcName) => {
      html += /*html*/ `<uc-source-btn type="${srcName}"></uc-source-btn>`;
    });
    if (this.hasAttribute('wrap')) {
      this.innerHTML = html;
    } else {
      this.outerHTML = html;
    }
  }
}
