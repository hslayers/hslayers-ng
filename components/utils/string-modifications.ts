/**
 * @ngdoc method
 * @name replaceAll
 * @public
 * @param {string} search String to look for
 * @param {string} replacement Replacement value
 * @returns {string} Returns modified string
 * @description Replaces input string text with replacement text
 */
export function replaceAll(search: string, replacement: string): string {
  if (!String.prototype.replaceAll) {
    return this.replace(new RegExp(search, 'g'), replacement);
  }
}

/**
 * @ngdoc method
 * @name format
 * @public
 * @param {any} args String to look for
 * @returns {string} Returns modified string
 * @description Replaces input string text with replacement text
 */
export function format(...args: any): string {
  return this.replace(/{(\d+)}/g, (match, number) => {
    return args[number] !== undefined ? args[number] : match;
  });
}
/**
 * @ngdoc method
 * @name capitalizeFirstLetter
 * @public
 * @returns {string} Returns modified string
 * @description Replaces first string letter to UpperCase
 */
export function capitalizeFirstLetter(): string {
  return this.charAt(0).toUpperCase() + this.slice(1);
}
