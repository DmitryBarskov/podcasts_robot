import { CustomResource, ResourceProps, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Architecture, Runtime, type IFunction } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import path = require('path');

export interface TelegramWebhookProps extends ResourceProps {
  botToken: string;
  webhookUrl: string;
}

export class TelegramWebhook extends Construct {
  readonly response: string;

  constructor (scope: Construct, id: string, props: TelegramWebhookProps) {
    super(scope, id);

    const func = new NodejsFunction(scope, 'TelegramWebhookSetter', {
      runtime: Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      entry: path.join(__dirname, '../lambda/webhook-provider/index.ts'),
      handler: 'handler',
      environment: {
        BOT_TOKEN: props.botToken,
      }
    });
    const provider = new Provider(scope, 'TelegramWebhookProvider', {
      onEventHandler: func,
    });

    const customResource = new CustomResource(scope, 'TelegramWebhookResource', {
      serviceToken: provider.serviceToken,
      properties: {
        webhookUrl: props.webhookUrl,
      }
    });

    this.response = customResource.getAttString('Response');
  }
}
