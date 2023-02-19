const { S3 } = require('@aws-sdk/client-s3');
const bufferFromStream = require('./bufferFromStream.js');

const BUCKET = process.env.BUCKET;

const s3 = new S3({});

const uploadFile = async (key, stream) => {
  const putCommand = {
    Bucket: BUCKET,
    Key: key,
    ContentType: 'audio/mpeg',
    Body: await bufferFromStream(stream),
  };
  console.debug('Putting object to S3:', { BUCKET, key });

  let data = await s3.putObject(putCommand);

  console.debug('Response from S3:', data);
  return data;
};

const storeFile = async (key, stream) => {
  await s3.headObject({ Bucket: BUCKET, Key: key })
    .then(_ => {
      console.log('File already present!', { BUCKET, key });
    })
    .catch(async (err) => {
      if (err['$metadata'].httpStatusCode == 404) {
        await uploadFile(key, stream);
      } else {
        throw new Error(err);
      }
    });

  return Promise.resolve(`http://${BUCKET}.s3.amazonaws.com/${key}`);
};

module.exports = storeFile;
