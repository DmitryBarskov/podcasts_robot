import {
  CdkCustomResourceEvent,
  CdkCustomResourceResponse,
  Context,
} from 'aws-lambda';

import { setWebhook, deleteWebhook, TelegramResponse } from './telegramApi';

export const handler = async (
  event: CdkCustomResourceEvent,
  context: Context,
): Promise<CdkCustomResourceResponse> => {
  const responseDefaults: CdkCustomResourceResponse = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: context.logGroupName,
  };

  const errorResponse = (message: string) => {
    console.error(message);
    return {
      ...responseDefaults,
      Status: 'FAILED',
      Data: { Response: message, },
    };
  };

  console.log('Lambda is invoked with:', event);

  let telegramResponse: TelegramResponse;

  if (event.RequestType === "Create" || event.RequestType === "Update") {
    const webhookUrl: string | undefined = event.ResourceProperties.webhookUrl;

    if (webhookUrl === undefined) {
      return errorResponse('webhookUrl property is not provided!');
    }

    telegramResponse = await setWebhook(webhookUrl);
  } else if (event.RequestType === "Delete") {
    telegramResponse = await deleteWebhook();
  } else {
    return errorResponse('Unsupported event type!');
  }

  console.info('Response from Telegram:', telegramResponse);
  return {
    ...responseDefaults,
    Status: telegramResponse.ok ? 'SUCCESS' : 'FAILED',
    Data: { Response: JSON.stringify(telegramResponse), },
  };
};
