import { Stack, StackProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export interface PodcastsRobotStackProps extends StackProps {
  botToken: string
}

export class PodcastsRobotStack extends Stack {
  constructor(scope: Construct, id: string, props: PodcastsRobotStackProps) {
    super(scope, id, props);

    const queue = new Queue(this, 'DownloadRequestQueue', {
      visibilityTimeout: Duration.seconds(300)
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
    const _gateway = new LambdaRestApi(this, 'Endpoint', {
      handler: messageParser,
    });
    queue.grantSendMessages(messageParser);

    const podcastsStorage = new Bucket(this, 'PodcastsStorage', {
      bucketName: 'podcastsrobot',
      removalPolicy: RemovalPolicy.RETAIN,
      publicReadAccess: true,
    });

    const videoDownloader = new lambda.Function(this, 'VideoDownloader', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'videoDownloader.handler',
      timeout: Duration.seconds(5 * 60),
      environment: {
        BOT_TOKEN: props.botToken,
        BUCKET: podcastsStorage.bucketName,
      },
    });
    queue.grantConsumeMessages(videoDownloader);
    videoDownloader.addEventSource(new SqsEventSource(queue));
    podcastsStorage.grantReadWrite(videoDownloader);
  }
}
