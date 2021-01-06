/**
 * Loop through list of formats returned by getcapabilities and select first available from the list of available formats
 *
 * @param formats - List of formats avaiable for service
 * @param preferredFormats - List of preferred formats for output
 * @returns Either one of preferred formats or first avaiable format
 */
export function getPreferedFormat(
  formats: string[],
  preferredFormats: string[]
): string {
  for (let i = 0; i < preferredFormats.length; i++) {
    if (formats.indexOf(preferredFormats[i]) > -1) {
      return preferredFormats[i];
    }
  }
  return formats[0];
}
