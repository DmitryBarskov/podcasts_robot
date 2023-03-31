import { Duration, StackProps } from "aws-cdk-lib";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { Function, Runtime, Code, Architecture } from 'aws-cdk-lib/aws-lambda';
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";

interface BotEntrypointProps extends StackProps {
}

export class BotEntrypoint extends Construct {
  readonly downloadRequestQueue: Queue;
  readonly entrypointUrl: string;

  constructor(scope: Construct, id: string, props: BotEntrypointProps) {
    super(scope, id);

    this.downloadRequestQueue = new Queue(this, 'DownloadRequestQueue', {
      visibilityTimeout: Duration.minutes(3),
    });

    const botEntrypoint = new Function(this, 'BotEntrypoint', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('lambda/bot-entrypoint'),
      handler: 'handler.handler',
      architecture: Architecture.ARM_64,
      environment: {
        DOWNLOAD_QUEUE_URL: this.downloadRequestQueue.queueUrl,
      },
    });
    const gateway = new LambdaRestApi(this, 'Endpoint', {
      handler: botEntrypoint,
    });
    this.downloadRequestQueue.grantSendMessages(botEntrypoint);

    this.entrypointUrl = gateway.url;
  }
}
