import { IFunction } from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

/**
 * TODO: Just a draft so far.
 * Manages webhooks for telegram bots as a CDK construct.
 */
class TelegramBotProvider {
  constructor(scope: Construct, id: string, onEventHandler: IFunction) {
    new cr.Provider(scope, id, {
      onEventHandler,
    });
  }
}
