import fs from 'fs';
import { findFiles } from '@jam-do/jam-tools/node/index.js';
import { applyData, cssMin } from '@jam-do/jam-tools/iso/index.js';
import { jsMin } from '@jam-do/jam-tools/iso/jsMin.js';
import DOC_TPL from './tpl/main.tpl.js';
import DOC_CSS from './styles/css.js';
import { mdProcessor } from './mdProcessor.js';

let IMPORTMAP = fs.readFileSync('./static-gen/importmap.json').toString();
let LIVE_HTML_CSS = fs.readFileSync('blocks/LiveHtml/live-html.css').toString();
let CODE_CSS = LIVE_HTML_CSS.replaceAll('lr-live-html [contenteditable]', 'code');
let JS = fs.readFileSync('./static-gen/script.js').toString();

function getBase(path) {
  let slashes = path.split('/').length - 1;
  let base = '';
  for (let i = 0; i < slashes; i++) {
    base += '../';
  }
  return base || './';
}

/**
 * @param {String} inputName
 * @param {String} outputName
 * @param {(tpl: String) => String} [processor]
 */
function processEntries(inputName, outputName, processor) {
  let entries = findFiles('./', [inputName], ['node_modules']);
  entries.forEach((entryPath) => {
    let content = fs.readFileSync(entryPath).toString();
    let contentHtml = processor ? processor(content) : content;
    let output = applyData(DOC_TPL, {
      IMPORTMAP,
      JS: jsMin(JS),
      CSS: cssMin(DOC_CSS + LIVE_HTML_CSS + CODE_CSS),
      BASE: getBase(entryPath),
      CONTENT: contentHtml,
    });
    fs.writeFileSync(entryPath.replace(inputName, outputName), output);
  });
}

const allTasks = [
  {
    in: 'README.md',
    out: 'index.html',
    processor: mdProcessor,
  },
  {
    in: 'TOC.md',
    out: 'toc.html',
    processor: mdProcessor,
  },
  {
    in: 'ref.htm',
    out: 'index.html',
  },
];

allTasks.forEach((task) => {
  processEntries(task.in, task.out, task.processor);
});
