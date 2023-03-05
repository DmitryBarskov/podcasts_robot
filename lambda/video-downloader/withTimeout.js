const withTimeout = async (asyncFunc, timeoutInMs, ...args) => {
  let pendingResult = asyncFunc(args);
  return await Promise.race([
    pendingResult,
    new Promise((_resolve, reject) => {
      setTimeout(
        reject,
        timeoutInMs,
        `Function reached its timeout ${timeoutInMs} ms.`
      );
    }),
  ]);
};

module.exports = withTimeout;
