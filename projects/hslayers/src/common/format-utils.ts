/**
 * Loop through list of formats returned by getcapabilities and select first available from the list of available formats
 *
 * @function getPreferedFormat
 * @param {Array} formats List of formats avaiable for service
 * @param {Array} preferedFormats List of prefered formats for output
 * @returns {string} Either one of prefered formats or first first avaiable format
 */
export function getPreferedFormat(formats, preferedFormats: string[]) {
  for (let i = 0; i < preferedFormats.length; i++) {
    if (formats.indexOf(preferedFormats[i]) > -1) {
      return preferedFormats[i];
    }
  }
  return formats[0];
}
