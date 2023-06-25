import { IAwsCognitoStackProps } from './types';

export const stackConfig:IAwsCognitoStackProps = {
  imports: {
    bucketArn: 'myBucketArn',
    tableArn: 'myTableArn',
    kmsKeyArn: 'myKmsArn',
    googleSecretName: 'myGoogleClientSecret',
    facebookSecretName: 'myFacebookClientSecret',
    acmArn: 'usEast1Certificate',
    hostedZoneId: 'myRoute53HostedZondeId',
  },
  domain: 'domain.com',
  cognitoDomain: 'auth.domain.com',
  postSignupLambdaName: 'post-signup-trigger',
  userPoolName: 'userpool',
  identityPoolName: 'identitypool',
  userPoolClientName: 'userpool-client',
  authenticatedUserName: 'auth-role',
  unAuthenticatedUserName: 'unauth-role',
  email: {
    subject: 'Account Verification',
    body: `Welcome to domain!
Click on the link to verify your email {##Verify Email##}`,
    from: 'noreply@domain.com',
    name: 'domain',
    replyTo: 'support@domain.com',
  },
  callbackUrls: [
    'https://domain.com',
    'https://domain.com/design',
    'https://domain.com/checkout',
  ],
  logoutUrls: [
    'https://domain.com',
    'https://domain.com/design',
    'https://domain.com/checkout',
    'https://domain.com/login',
  ],
  redirectUri: 'https://domain.com/',
};