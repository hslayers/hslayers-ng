export default function() {
  return function(input) {
    input = input || '';
    return input.replace(/^http[s]?:\/\//, '');
  }
}
