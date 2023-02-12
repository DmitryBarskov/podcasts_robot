const withLogging = (f) => {
  return async (...args) => {
    try {
      const result = await f(...args);
      console.log({ args, result });
      return result;
    } catch (exception) {
      console.error({ args, exception });
      return { statusCode: 500 };
    }
  }
};

module.exports = withLogging;
