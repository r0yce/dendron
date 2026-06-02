/** Jest mock for ESM-only ora (v8+) in CLI command imports. */
function createSpinner() {
  const spinner = {
    start: () => spinner,
    stop: () => spinner,
    succeed: () => spinner,
    fail: () => spinner,
    warn: () => spinner,
    info: () => spinner,
    text: () => spinner,
    clear: () => spinner,
  };
  return spinner;
}

module.exports = createSpinner;
module.exports.default = createSpinner;