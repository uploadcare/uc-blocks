/**
 * @param {String | unknown} [operation]
 * @returns {String}
 */
export const normalizeCdnOperation = (operation) => {
  if (typeof operation !== 'string' || !operation) {
    return '';
  }
  let str = operation.trim();
  let start = 0;
  let end = str.length;
  if (str.startsWith('-/')) {
    start = 2;
  } else if (str.startsWith('/')) {
    start = 1;
  }

  if (str.endsWith('/')) {
    end = str.length - 1;
  }
  return str.substring(start, end);
};

/**
 * @param {...(String | unknown)} operations
 * @returns {String}
 */
export const joinCdnOperations = (...operations) => {
  return operations
    .filter((op) => typeof op === 'string' && op)
    .map((op) => normalizeCdnOperation(/** @type {String} */ (op)))
    .join('/-/');
};

/**
 * @param {...(String | unknown)} [cdnOperations]
 * @returns {String}
 */
export const createCdnUrlModifiers = (...cdnOperations) => {
  let joined = joinCdnOperations(...cdnOperations);
  return joined ? `-/${joined}/` : '';
};

/**
 * @param {String} cdnUrl
 * @returns {String}
 */
export function extractFilename(cdnUrl) {
  let url = new URL(cdnUrl);
  let pathname = url.pathname;
  let urlFilenameIdx = pathname.lastIndexOf('http');
  let plainFilenameIdx = pathname.lastIndexOf('/');
  let filename = '';

  if (urlFilenameIdx > 0) {
    filename = pathname.slice(urlFilenameIdx) + url.search;
    url.search = '';
  } else if (plainFilenameIdx > 0) {
    filename = pathname.slice(plainFilenameIdx + 1);
  }

  return filename;
}

/**
 * @param {String} cdnUrl
 * @returns {String}
 */
export function trimFilename(cdnUrl) {
  let filename = extractFilename(cdnUrl);

  let url = new URL(cdnUrl);
  let { pathname, search } = url;
  let pathnameWithSearch = pathname + search;
  let filenameIdx = pathnameWithSearch.lastIndexOf(filename);
  if (filenameIdx + filename.length === pathnameWithSearch.length) {
    url.pathname = pathnameWithSearch.substring(0, filenameIdx);
    url.search = '';
  }
  return url.toString();
}

/**
 * @param {String} baseCdnUrl
 * @param {String} [cdnModifiers]
 * @param {String} [filename]
 * @returns {String}
 */
export const createCdnUrl = (baseCdnUrl, cdnModifiers, filename) => {
  let url = new URL(trimFilename(baseCdnUrl));
  filename = filename || extractFilename(baseCdnUrl);
  url.pathname = url.pathname + (cdnModifiers || '') + (filename || '');
  return url.toString();
};

/**
 * Create url for an original file on CDN or Proxy CDN
 *
 * @param {String} cdnUrl - URL to get base domain from, any pathname will be stripped
 * @param {String} uuidOrFileUrl - Uuid for CDN or file URL for Proxy CDN
 * @returns {String}
 */
export const createOriginalUrl = (cdnUrl, uuidOrFileUrl) => {
  let isFileUrl = uuidOrFileUrl.startsWith('http');

  let url = new URL(cdnUrl);
  url.pathname = uuidOrFileUrl + (isFileUrl ? '' : '/');
  return url.toString();
};