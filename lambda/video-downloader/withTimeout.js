const withTimeout = async (asyncFunc, timeoutInMs, ...args) => {
  const pendingResult = asyncFunc(args);
  const delayedError = new Promise((_resolve, reject) => {
    setTimeout(
      reject,
      timeoutInMs,
      `Function reached its timeout ${timeoutInMs} ms.`
    );
  });
  return await Promise.race([
    pendingResult,
    delayedError,
  ]);
};

module.exports = withTimeout;
