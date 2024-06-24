/**
 * Parse QML string style and make base64 symbols usable in browser by
 *
 * Look for prop elements with source attribute
 * and prepend its content to v while switching : with ,
 */
export function parseBase64Style(styleString: string) {
  const regex = /<prop([^>]*source="(data:[^"]*)"[^>]*v="base64:([^"]*)")/g;

  return styleString.startsWith('<qgis')
    ? styleString.replace(regex, (match, p1, p2, p3) => {
        return match.replace(`v="base64:${p3}"`, `v="${p2}base64,${p3}"`);
      })
    : styleString;
}
