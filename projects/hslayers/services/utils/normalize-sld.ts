/**
 * Mappings from Function name attribute to corresponding PropertyIs element name
 * This maps SLD function operators to their equivalent PropertyIs element names
 */
const FUNCTION_TO_PROPERTY_MAP: Record<string, string> = {
  'equalTo': 'PropertyIsEqualTo',
  'notEqualTo': 'PropertyIsNotEqualTo',
  'like': 'PropertyIsLike',
  'lessThan': 'PropertyIsLessThan',
  'lessThanOrEqualTo': 'PropertyIsLessThanOrEqualTo',
  'greaterThan': 'PropertyIsGreaterThan',
  'greaterThanOrEqualTo': 'PropertyIsGreaterThanOrEqualTo',
  'isNull': 'PropertyIsNull',
  'between': 'PropertyIsBetween',
};

/**
 * Converts SLD Function elements to equivalent PropertyIs elements
 * For example: <Function name="lessThan"> becomes <PropertyIsLessThan>
 *
 * This transformation is necessary for compatibility between different SLD implementations
 * such as those used by QGIS, GeoServer, and other OGC-compliant systems.
 *
 * @param sld - The SLD XML string to process
 * @returns The SLD string with Function elements converted to PropertyIs elements
 */
export const normalizeSldComparisonOperators = (sld: string): string => {
  if (!sld) {
    return sld;
  }

  // Early exit if no Function elements are present
  if (!sld.includes('<Function name=') && !sld.includes(':Function name=')) {
    return sld;
  }

  // Use a tag stack to track opening tags for proper nesting and matching
  const tagStack: Array<{
    tag: string;
    namespace: string;
    operator?: string;
  }> = [];

  // Accumulate the result in parts for efficient string building
  const parts: string[] = [];
  let lastIndex = 0;

  // Regex matches both opening and closing Function tags with optional namespaces
  // Captures the namespace prefix (group 1) and operator name (group 2, for opening tags only)
  const tagRegex =
    /<\/?([a-zA-Z][a-zA-Z0-9]*:)?Function(?:\s+name="([^"]+)")?>/g;

  let match;
  while ((match = tagRegex.exec(sld)) !== null) {
    const fullMatch = match[0];
    const namespaceWithColon = match[1] || '';
    const isClosingTag = fullMatch.charAt(1) === '/';
    const operator = match[2]; // Undefined for closing tags

    // Preserve content between tags or part of SLD preceding the first Function tag
    parts.push(sld.substring(lastIndex, match.index));
    lastIndex = match.index + fullMatch.length;

    if (isClosingTag) {
      // Process closing tag by finding its matching opening tag from the stack
      const openingTag = tagStack.pop();
      if (openingTag && openingTag.operator) {
        const propertyElement = FUNCTION_TO_PROPERTY_MAP[openingTag.operator];
        if (propertyElement) {
          // Create the corresponding PropertyIs closing tag
          parts.push(`</${namespaceWithColon}${propertyElement}>`);
        } else {
          // Keep original if no mapping exists
          parts.push(fullMatch);
        }
      } else {
        // Keep original if no matching opening tag (malformed XML)
        parts.push(fullMatch);
      }
    } else {
      // Process opening tag
      if (operator && FUNCTION_TO_PROPERTY_MAP[operator]) {
        // Push tag info to stack for later matching with closing tag
        tagStack.push({
          tag: 'Function',
          namespace: namespaceWithColon,
          operator: operator,
        });

        // Create the corresponding PropertyIs opening tag
        parts.push(
          `<${namespaceWithColon}${FUNCTION_TO_PROPERTY_MAP[operator]}>`,
        );
      } else {
        // Keep original if not a supported operator
        parts.push(fullMatch);
      }
    }
  }
  // Add any remaining content after the last match
  if (lastIndex < sld.length) {
    parts.push(sld.substring(lastIndex));
  }

  // Join all parts to form the intermediate result
  let result = parts.join('');

  // Add ElseFilter to the last rule if it doesn't have a filter
  const ruleRegex = /<se:Rule[^>]*>([\s\S]*?)<\/se:Rule>/g;
  const rules = result.match(ruleRegex);

  if (rules && rules.length > 0) {
    const lastRule = rules[rules.length - 1];
    if (!lastRule.includes('<se:Filter') && !lastRule.includes('<Filter')) {
      // Find the position of the last rule's closing tag
      const lastRuleEndIndex = result.lastIndexOf('</se:Rule>');
      if (lastRuleEndIndex !== -1) {
        // Insert ElseFilter specifically before the last rule's closing tag
        result =
          result.slice(0, lastRuleEndIndex) +
          '<se:ElseFilter xmlns:se="http://www.opengis.net/se"/>' +
          result.slice(lastRuleEndIndex);
      }
    }
  }

  return result;
};
