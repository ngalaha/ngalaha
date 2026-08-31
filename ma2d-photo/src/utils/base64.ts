/**
 * Minimal, dependency-free base64 helpers (RN/Hermes has no global
 * `btoa`/`atob` guaranteed across all runtimes, and no `Buffer`).
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64Encode(input: string): string {
  let output = '';
  let i = 0;
  const bytes: number[] = [];
  for (let n = 0; n < input.length; n++) {
    bytes.push(input.charCodeAt(n) & 0xff);
  }
  while (i < bytes.length) {
    const b1 = bytes[i++];
    const b2 = i < bytes.length ? bytes[i++] : NaN;
    const b3 = i < bytes.length ? bytes[i++] : NaN;

    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 3) << 4) | (isNaN(b2) ? 0 : b2 >> 4);
    const enc3 = isNaN(b2) ? 64 : ((b2 & 15) << 2) | (isNaN(b3) ? 0 : b3 >> 6);
    const enc4 = isNaN(b3) ? 64 : b3 & 63;

    output +=
      CHARS.charAt(enc1) +
      CHARS.charAt(enc2) +
      (enc3 === 64 ? '=' : CHARS.charAt(enc3)) +
      (enc4 === 64 ? '=' : CHARS.charAt(enc4));
  }
  return output;
}

/**
 * Encodes a OneDrive/SharePoint sharing URL into the "shares" API token
 * per Microsoft Graph docs:
 * https://learn.microsoft.com/en-us/graph/api/shares-get
 */
export function encodeSharingUrl(url: string): string {
  const base64 = base64Encode(url);
  const unpadded = base64.replace(/=+$/, '');
  const urlSafe = unpadded.replace(/\//g, '_').replace(/\+/g, '-');
  return `u!${urlSafe}`;
}

/**
 * Decodes UTF-8 bytes into a JS string without relying on `TextDecoder`
 * (not guaranteed present on Hermes / RN 0.74 either).
 */
export function utf8DecodeBytes(bytes: Uint8Array): string {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i];
    let codePoint: number;
    let length: number;

    if (b0 < 0x80) {
      codePoint = b0;
      length = 1;
    } else if ((b0 & 0xe0) === 0xc0) {
      codePoint = b0 & 0x1f;
      length = 2;
    } else if ((b0 & 0xf0) === 0xe0) {
      codePoint = b0 & 0x0f;
      length = 3;
    } else if ((b0 & 0xf8) === 0xf0) {
      codePoint = b0 & 0x07;
      length = 4;
    } else {
      // Invalid leading byte — skip it rather than throw on malformed input.
      i += 1;
      continue;
    }

    if (i + length > bytes.length) break;
    for (let k = 1; k < length; k++) {
      codePoint = (codePoint << 6) | (bytes[i + k] & 0x3f);
    }
    i += length;

    if (codePoint > 0xffff) {
      codePoint -= 0x10000;
      result += String.fromCharCode(0xd800 + (codePoint >> 10), 0xdc00 + (codePoint & 0x3ff));
    } else {
      result += String.fromCharCode(codePoint);
    }
  }
  return result;
}

export function base64Decode(input: string): Uint8Array {
  const clean = input.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];
  let i = 0;
  while (i < clean.length) {
    const enc1 = CHARS.indexOf(clean.charAt(i++));
    const enc2 = CHARS.indexOf(clean.charAt(i++));
    const enc3 = CHARS.indexOf(clean.charAt(i++));
    const enc4 = CHARS.indexOf(clean.charAt(i++));

    const b1 = (enc1 << 2) | (enc2 >> 4);
    const b2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const b3 = ((enc3 & 3) << 6) | enc4;

    bytes.push(b1);
    if (enc3 !== -1 && enc3 !== 64) bytes.push(b2);
    if (enc4 !== -1 && enc4 !== 64) bytes.push(b3);
  }
  return new Uint8Array(bytes);
}
