import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { App, Aspects, Stack } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { stackConfig } from '../bin/config';
import { AwsCognitoStack } from '../lib/aws-cognito-stack';

describe('Security Check', () => {
  let stack: Stack;
  let app: App;

  beforeAll(() => {
    app = new App();
    stack = new AwsCognitoStack(app, 'test', stackConfig);
    Aspects.of(stack).add(new AwsSolutionsChecks());
  });

  test('No unsuppressed Warnings', () => {
    const warnings = Annotations.fromStack(stack).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
    expect(warnings).toHaveLength(0);
  });

  test('No unsuppressed Errors', () => {
    const errors = Annotations.fromStack(stack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
    expect(errors).toHaveLength(0);
  });
});