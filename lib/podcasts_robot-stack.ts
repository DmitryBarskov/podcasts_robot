import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

export interface PodcastsRobotStackProps extends cdk.StackProps {
  botToken: string
}

export class PodcastsRobotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PodcastsRobotStackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'DownloadRequestQueue', {
      visibilityTimeout: cdk.Duration.seconds(300)
    });

    const messageParser = new lambda.Function(this, 'MessageParser', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'messageParser.handler',
      environment: {
        BOT_TOKEN: props.botToken,
        QUEUE_URL: queue.queueUrl,
      },
    });
    const _gateway = new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: messageParser,
    });
    queue.grantSendMessages(messageParser);

    const videoDownloader = new lambda.Function(this, 'VideoDownloader', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'videoDownloader.handler',
      environment: {
        BOT_TOKEN: props.botToken,
      },
    });
    queue.grantConsumeMessages(videoDownloader);
  }
}
