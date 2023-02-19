const bufferFromStream = async (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];

    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', err => reject(err));
  });
};

module.exports = bufferFromStream;
