function pad(value, length = 2) {
  return String(value).padStart(length, '0')
}

/** Formats a Date as YYYY-MM-DD, used both for filenames and Drive folder names. */
export function formatDateFolder(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Formats a Date as YYYY-MM-DD_HHmmSS.jpg per the MA2D naming convention. */
export function formatPhotoFilename(date = new Date(), extension = 'jpg') {
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  return `${formatDateFolder(date)}_${time}.${extension}`
}

export function extensionFromMime(mime) {
  if (!mime) return 'jpg'
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('heic')) return 'heic'
  return 'jpg'
}
