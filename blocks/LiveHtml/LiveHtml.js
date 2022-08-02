import { symbiote, hljs } from '../../abstract/url-exports.js';

const INIT_HTML = /*html*/ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  CONTENT
</body>
</html>
`.trim();

class Caret {
  static getPosition(parentElement) {
    let selection = window.getSelection();
    let charCount = -1;
    let node;

    if (selection.focusNode) {
      if (Caret._isChildOf(selection.focusNode, parentElement)) {
        node = selection.focusNode;
        charCount = selection.focusOffset;

        while (node) {
          if (node === parentElement) {
            break;
          }
          if (node.previousSibling) {
            node = node.previousSibling;
            charCount += node.textContent.length;
          } else {
            node = node.parentNode;
            if (node === null) {
              break;
            }
          }
        }
      }
    }
    return charCount;
  }

  static setPosition(chars, element) {
    if (chars >= 0) {
      let selection = window.getSelection();

      let range = Caret._createRange(element, {
        count: chars,
      });

      if (range) {
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  static _createRange(node, chars, range) {
    if (!range) {
      range = document.createRange();
      range.selectNode(node);
      range.setStart(node, 0);
    }

    if (chars.count === 0) {
      range.setEnd(node, chars.count);
    } else if (node && chars.count > 0) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent.length < chars.count) {
          chars.count -= node.textContent.length;
        } else {
          range.setEnd(node, chars.count);
          chars.count = 0;
        }
      } else {
        for (let lp = 0; lp < node.childNodes.length; lp++) {
          range = Caret._createRange(node.childNodes[lp], chars, range);

          if (chars.count === 0) {
            break;
          }
        }
      }
    }
    return range;
  }

  static _isChildOf(node, parentElement) {
    while (node !== null) {
      if (node === parentElement) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }
}

export class LiveHtml extends symbiote.BaseComponent {
  hl() {
    let offset = Caret.getPosition(this.ref.editor);

    this.ref.editor.textContent = this.ref.editor.textContent;

    let html = this.ref.editor.textContent;
    // @ts-ignore
    html = hljs.default.highlight(this.ref.editor.textContent, { language: 'html' }).value;
    this.ref.editor.innerHTML = html;

    Caret.setPosition(offset, this.ref.editor);
    // this.ref.editor.focus();
  }

  sync() {
    this.hl();
    if (this._updTimeout) {
      window.clearTimeout(this._updTimeout);
    }
    this._updTimeout = window.setTimeout(() => {
      // @ts-ignore
      this.ref.vp.srcdoc = (this.importmapHtml || '') + this.ref.editor.textContent;
      if (this.hasAttribute('console-output')) {
        /** @type {Window} */
        // @ts-ignore
        let docWin = this.ref.vp.contentWindow;
        this.ref.vp.onload = () => {
          console.dirxml(docWin.document.body);
        };
      }
    }, 300);
  }

  init$ = {
    src: '',
    code: INIT_HTML,
    spellcheck: false,
    onInput: () => {
      this.sync();
    },
    onKeydown: (e) => {
      if (e.keyCode === 13) {
        e.preventDefault();
        document.execCommand('insertHTML', false, '\n');
      } else if (e.keyCode === 9) {
        e.preventDefault();
        document.execCommand('insertHTML', false, '  ');
      }
    },
    // onPaste: (e) => {
    //   e.preventDefault();
    //   let text = e.clipboardData.getData('text/plain');
    //   document.execCommand('insertText', false, text);
    // },
  };

  connectedCallback() {
    if (this.innerHTML.trim()) {
      let lines = this.innerHTML.split('\n');
      let commonTabSize = 1000;
      lines.forEach((line) => {
        if (!line.trim()) {
          return;
        }
        if (!line.startsWith(' ')) {
          commonTabSize = 0;
          return;
        }
        let tabs = line.match(/^ +/);
        if (tabs) {
          commonTabSize = Math.min(commonTabSize, tabs[0].length);
        }
      });
      /** @private */
      this.__innerHtml = lines
        .map((line) => {
          for (let i = 0; i < commonTabSize; i++) {
            if (line.startsWith(' ')) {
              line = line.replace(' ', '');
            }
          }
          return line;
        })
        .join('\n');
      this.innerHTML = '';
    }
    super.connectedCallback();
  }

  initCallback() {
    let docImportMap = document.querySelector('script[type="importmap"]');
    if (docImportMap) {
      let shimScriptHtml = '';
      let shimScriptEl = document.querySelector('script[src*="es-module-shims.js"]');
      if (shimScriptEl) {
        shimScriptHtml = shimScriptEl.outerHTML;
      }
      this.importmapHtml = shimScriptHtml + docImportMap.outerHTML;
    }
    if (this.hasAttribute('src')) {
      this.sub('src', (val) => {
        if (val) {
          window.fetch(val).then(async (resp) => {
            let code = await resp.text();
            this.$.code = code;
            this.sync();
          });
        } else {
          this.$.code = INIT_HTML;
        }
      });
    } else if (this.__innerHtml) {
      this.$.code = this.__innerHtml;
      this.sync();
    } else {
      this.$.code = INIT_HTML;
    }
  }
}

LiveHtml.bindAttributes({
  src: 'src',
});

LiveHtml.template = /*html*/ `
<div
  ref="editor"
  contenteditable="true"
  set="textContent:code; oninput:onInput; onkeydown:onKeydown; spellcheck:spellcheck">
</div>
<iframe ref="vp"></iframe>
`;
