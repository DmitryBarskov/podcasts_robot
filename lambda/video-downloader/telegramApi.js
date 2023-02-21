const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const sqsClient = new SQSClient();
const TELEGRAM_REQUEST_QUEUE_URL = process.env.TELEGRAM_REQUEST_QUEUE_URL;

const telegramApi = async (messageBody) => {
  console.debug('Sending to SQS:', { TELEGRAM_REQUEST_QUEUE_URL, messageBody });
  try {
    const output = await sqsClient.send(new SendMessageCommand({
      MessageBody: JSON.stringify(messageBody),
      QueueUrl: TELEGRAM_REQUEST_QUEUE_URL,
    }));
    console.debug('Received response from SQS:', output);
    return output;
  } catch (err) {
    console.error('Error resopsne from SQS:', err);
    throw err;
  }
};

module.exports = telegramApi;
