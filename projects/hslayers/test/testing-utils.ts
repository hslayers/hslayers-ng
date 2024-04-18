const orgConsoleError = window.console.error;

export function patchConsoleToFailOnError(): void {
  window.console.error = function (...args: any[]) {
    orgConsoleError.apply(this, args);
    try {
      throw new Error('console.error');
    } catch (err) {
      window.console.info('console.error', args, err);
    }
    fail('console.error was called, this is not allowed in a unit test run');
  };
}
