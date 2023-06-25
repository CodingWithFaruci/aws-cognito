/* eslint-disable max-statements */
/* eslint-disable max-lines */
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// services
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53_targets from 'aws-cdk-lib/aws-route53-targets';

// types
import { IAwsCognitoStackProps } from '../bin/types';
import { NagSuppressions } from 'cdk-nag';

export class AwsCognitoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IAwsCognitoStackProps) {
    super(scope, id, props);

    /* IMPORTS */
    const bucket = s3.Bucket.fromBucketArn(this, 'ImageBucket', props.imports.bucketArn);
    const table = ddb.Table.fromTableArn(this, 'AccountTable', props.imports.tableArn);
    const key = kms.Key.fromKeyArn(this, 'Key', props.imports.kmsKeyArn);

    /* LAMBDA FUNCTIONS */
    const postSignupTrigger =  new nodejs.NodejsFunction(this, 'SignupTrigger', {
      functionName: props.postSignupLambdaName,
      entry: 'src/index.ts',
      bundling: { minify: true },
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.minutes(2),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        TABLE_NAME: table.tableName,
      },
      logRetention: cdk.aws_logs.RetentionDays.TWO_MONTHS,
    });
    const cloudWatchPolicy = new iam.PolicyStatement({
      actions: ['cloudwatch:PutMetricData'],
      effect: iam.Effect.ALLOW,
      resources: ['*'],
    });
    postSignupTrigger.addToRolePolicy(cloudWatchPolicy);
    key.grantEncryptDecrypt(postSignupTrigger);
    bucket.grantWrite(postSignupTrigger);
    table.grantReadWriteData(postSignupTrigger);

    /* AWS COGNITO USERPOOL */
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: props.userPoolName,
      selfSignUpEnabled: true,
      standardAttributes: {
        email: { required: true },
        givenName: { required: true },
        familyName: { required: true },
        birthdate: { required: false },
        address: { required: false },
        middleName: { required: false },
        phoneNumber: { required: false },
      },
      customAttributes: {
        business_account: new cognito.BooleanAttribute({ mutable: true }),
        company_name: new cognito.StringAttribute({ mutable: true, minLen: 1, maxLen: 25 }),
        vat_nr: new cognito.StringAttribute({ mutable: true, minLen: 4, maxLen: 15 }),
      },
      signInAliases: {
        email: true,
        username: true,
      },
      autoVerify: {
        email: true,
      },
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.LINK,
        emailSubject: props.email.subject,
        emailBody: props.email.body,
      },
      email: cognito.UserPoolEmail.withSES({
        sesRegion: cdk.Aws.REGION,
        sesVerifiedDomain: props.domain,
        fromEmail: props.email.from,
        fromName: props.email.name,
        replyTo: props.email.replyTo,
      }),
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(365),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      lambdaTriggers: {
        postConfirmation: postSignupTrigger,
      },
      customSenderKmsKey: key,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // change for production
    });

    /* GOOGLE LOGIN */
    const googleSecret = secretsmanager.Secret.fromSecretNameV2(this, 'GoogleClientSecret', props.imports.googleSecretName);
    const googleLogin = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleLogin', {
      userPool,
      clientId: googleSecret.secretValueFromJson('id').unsafeUnwrap().toString(),
      clientSecretValue: googleSecret.secretValueFromJson('secret'),
      scopes: [
        'profile',
        'email',
        'openid',
      ],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
        familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
        birthdate: cognito.ProviderAttribute.GOOGLE_BIRTHDAYS,
      },
    });
    userPool.registerIdentityProvider(googleLogin);

    /* FACEBOOK LOGIN */
    const facebookSecret = secretsmanager.Secret.fromSecretNameV2(this, 'FacebookClientSecret', props.imports.facebookSecretName);
    const facebookLogin = new cognito.UserPoolIdentityProviderFacebook(this, 'FacebookLogin', {
      userPool,
      clientId: facebookSecret.secretValueFromJson('id').unsafeUnwrap().toString(),
      clientSecret: facebookSecret.secretValueFromJson('secret').unsafeUnwrap().toString(),
      scopes: [
        'public_profile',
        'email',
        'user_birthday',
      ],
      attributeMapping: {
        email: cognito.ProviderAttribute.FACEBOOK_EMAIL,
        givenName: cognito.ProviderAttribute.FACEBOOK_FIRST_NAME,
        familyName: cognito.ProviderAttribute.FACEBOOK_LAST_NAME,
        birthdate: cognito.ProviderAttribute.FACEBOOK_BIRTHDAY,
        middleName: cognito.ProviderAttribute.FACEBOOK_MIDDLE_NAME,
      },
    });
    userPool.registerIdentityProvider(facebookLogin);

    /* AWS COGNITO USERPOOLCLIENT */
    const userpoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: props.userPoolClientName,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PHONE,
        ],
        callbackUrls: props.callbackUrls,
        logoutUrls: props.logoutUrls,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.GOOGLE,
        cognito.UserPoolClientIdentityProvider.FACEBOOK,
      ],
      accessTokenValidity: cdk.Duration.minutes(60),
      idTokenValidity: cdk.Duration.minutes(60),
      refreshTokenValidity: cdk.Duration.days(30),
      preventUserExistenceErrors: true,
      enableTokenRevocation: true,
    });
    userpoolClient.node.addDependency(googleLogin, facebookLogin);

    /* AWS COGNITO IDENTITYPOOL */
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: props.identityPoolName,
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [
        {
          clientId: userpoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    // IAM Role for Cognito authenticated users.
    const authenticatedUserRole = new iam.Role(this, 'CognitoDefaultAuthenticatedRole', {
      roleName: props.authenticatedUserName,
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });

    /* IAM Role for Cognito unauthenticated users. */
    const unAuthenticatedUserRole = new iam.Role(this, 'CognitoDefaultUnauthenticatedRole', {
      roleName: props.unAuthenticatedUserName,
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });

    // IAM policy to allow Cognito users to access their own folders in the S3 bucket and invoke the API Gateway.
    const bucketActionsPolicy = new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
      ],
      resources: [bucket.arnForObjects('users/${cognito-identity.amazonaws.com:sub}/*')],
      effect: iam.Effect.ALLOW,
    });
    const bucketListingPolicy = new iam.PolicyStatement({
      actions: [
        's3:ListBucket',
      ],
      resources: [bucket.bucketArn],
      conditions: {
        StringLike: {
          's3:prefix': ['users/${cognito-identity.amazonaws.com:sub}/*'],
        },
      },
      effect: iam.Effect.ALLOW,
    });
    authenticatedUserRole.addToPolicy(bucketActionsPolicy);
    authenticatedUserRole.addToPolicy(bucketListingPolicy);

    // IAM policy to allow Anon users to upload images in the S3 bucket and invoke the API Gateway.
    const bucketPutPolicy = new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      effect: iam.Effect.ALLOW,
      resources: [bucket.bucketArn],
    });
    unAuthenticatedUserRole.addToPolicy(bucketPutPolicy);

    // Add role to identity pool.
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: authenticatedUserRole.roleArn,
        unauthenticated: unAuthenticatedUserRole.roleArn,
      },
    });

    /* AWS ACM Domain Certificate in us-east-1. */
    const domainCert = acm.Certificate.fromCertificateArn(this, 'domainCert', props.imports.acmArn);
    const domain = userPool.addDomain('CustomDomain', {
      customDomain: {
        domainName: props.cognitoDomain,
        certificate: domainCert,
      },
    });

    /* AWS Route53 Hosted Zone. */
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: props.imports.hostedZoneId,
      zoneName: props.domain,
    });

    /* AWS Route53 A Record. */
    new route53.ARecord(this, 'UserPoolCloudFrontAliasRecord', {
      zone: hostedZone,
      recordName: props.cognitoDomain,
      target: route53.RecordTarget.fromAlias(new route53_targets.UserPoolDomainTarget(domain)),
    });

    // Nag Security Suppressions. TODO's.
    NagSuppressions.addStackSuppressions(this, [
      { id: 'AwsSolutions-COG2', reason: 'MFA requirement not active at this point.' },
      { id: 'AwsSolutions-COG3', reason: 'AdvancedSecurityMode not active at this point.' },
      {
        id: 'AwsSolutions-IAM4',
        reason: 'AWSLambdaBasicExecutionRole is required for the function to write logs to CloudWatch.',
        appliesTo: ['Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'],
      },
      {
        id: 'AwsSolutions-IAM5',
        reason: 'Wildcard permissions are necessary for these actions on S3 bucket and KMS key.',
        appliesTo: [
          'Action::kms:ReEncrypt*',
          'Action::kms:GenerateDataKey*',
          'Action::s3:Abort*',
          'Action::s3:DeleteObject*',
          'Resource::arn:aws:s3:::ph-images-bucket/*',
          'Resource::arn:aws:s3:::ph-images-bucket/users/<cognito-identity.amazonaws.com:sub>/*',
          'Resource::*',
        ],
      },
      { id: 'AwsSolutions-COG7', reason: 'Allowing both auth and unauth users.' },
      { id: 'CdkNagValidationFailure', reason: 'Custom resource uses other node version.' },
      { id: 'AwsSolutions-L1', reason: 'Custom resource uses other node version.' },
    ]);
  }
}
