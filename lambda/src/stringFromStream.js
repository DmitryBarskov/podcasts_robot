const bufferFromStream = require('./bufferFromStream.js');

const stringFromStream = async (stream) => (await bufferFromStream(stream)).toString('utf8');

module.exports = stringFromStream;
