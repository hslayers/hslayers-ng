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
