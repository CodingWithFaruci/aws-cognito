import { StackProps } from 'aws-cdk-lib';

export interface IAwsCognitoStackProps extends StackProps {
  imports: {
    bucketArn: string,
    tableArn: string,
    kmsKeyArn: string,
    googleSecretName: string,
    facebookSecretName: string,
    acmArn: string,
    hostedZoneId: string,
  },
  domain: string,
  cognitoDomain: string,
  userPoolName: string,
  postSignupLambdaName: string,
  userPoolClientName: string,
  identityPoolName: string,
  authenticatedUserName: string,
  unAuthenticatedUserName: string,
  email: {
    subject: string,
    body:string,
    from: string,
    name: string,
    replyTo: string,
  },
  callbackUrls: string[],
  logoutUrls: string[],
  redirectUri: string,
}