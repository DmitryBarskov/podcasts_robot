import { Duration, StackProps } from "aws-cdk-lib";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export interface TelegramApiProps extends StackProps {
  botToken: string
}

export class TelegramApi extends Construct {
  readonly requestQueue: Queue;

  constructor (scope: Construct, id: string, props: TelegramApiProps) {
    super(scope, id);

    this.requestQueue = new Queue(this, 'TelegramRequestQueue', {
      visibilityTimeout: Duration.minutes(5),
    });

    const telegramApi = new Function(this, 'TelegramApi', {
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset('lambda/telegram-api'),
      handler: 'handler.handler',
      environment: {
        BOT_TOKEN: props.botToken,
      },
    });
    telegramApi.addEventSource(new SqsEventSource(this.requestQueue));
    this.requestQueue.grantConsumeMessages(telegramApi);
  }
}
