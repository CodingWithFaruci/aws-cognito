/* eslint-disable max-lines */
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as AwsCognito from '../lib/aws-cognito-stack';
import { stackConfig } from '../bin/config';

const app = new cdk.App();
const stack = new AwsCognito.AwsCognitoStack(app, 'MyTestStack', stackConfig);
const template = Template.fromStack(stack);

test('01. Lambda Function Created', () => {
  template.hasResourceProperties('AWS::Lambda::Function', {
    FunctionName: stackConfig.postSignupLambdaName,
    Handler: 'index.handler',
    Runtime: 'nodejs18.x',
    Timeout: 120,
  });
});

test('02. Cognito Userpool Created', () => {
  template.hasResourceProperties('AWS::Cognito::UserPool', {
    UserPoolName: stackConfig.userPoolName,
    AccountRecoverySetting: {
      RecoveryMechanisms: [{
        Name: 'verified_email',
        Priority: 1,
      }],
    },
    AdminCreateUserConfig: {
      AllowAdminCreateUserOnly: false,
    },
    AliasAttributes: [ 'email' ],
    AutoVerifiedAttributes: [ 'email' ],
    EmailConfiguration: {
      EmailSendingAccount: 'DEVELOPER',
      From: `${stackConfig.email.name} <${stackConfig.email.from}>`,
      ReplyToEmailAddress: `${stackConfig.email.replyTo}`,
    },
    Policies: {
      PasswordPolicy: {
        MinimumLength: 12,
        RequireLowercase: true,
        RequireNumbers: true,
        RequireSymbols: true,
        RequireUppercase: true,
        TemporaryPasswordValidityDays: 365,
      },
    },
    Schema: [
      {
        Mutable: true,
        Name: 'email',
        Required: true,
      },
      {
        Mutable: true,
        Name: 'given_name',
        Required: true,
      },
      {
        Mutable: true,
        Name: 'family_name',
        Required: true,
      },
      {
        Mutable: true,
        Name: 'birthdate',
        Required: false,
      },
      {
        Mutable: true,
        Name: 'address',
        Required: false,
      },
      {
        Mutable: true,
        Name: 'middle_name',
        Required: false,
      },
      {
        Mutable: true,
        Name: 'phone_number',
        Required: false,
      },
      {
        Mutable: true,
        Name: 'business_account',
      },
      {
        Mutable: true,
        Name: 'company_name',
      },
      {
        Mutable: true,
        Name: 'vat_nr',
      },
    ],
  });
});

test('03. Userpool Identity Provider Google Created', () => {
  template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
    ProviderName: 'Google',
    ProviderType: 'Google',
    AttributeMapping: {
      email: 'email',
      given_name: 'given_name',
      family_name: 'family_name',
      birthdate: 'birthdays',
    },
    ProviderDetails: {
      authorize_scopes: 'profile email openid',
    },
  });
});

test('04. Userpool Identity Provider Facebook Created', () => {
  template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
    ProviderName: 'Facebook',
    ProviderType: 'Facebook',
    AttributeMapping: {
      birthdate: 'birthday',
      email: 'email',
      family_name: 'last_name',
      given_name: 'first_name',
      middle_name: 'middle_name',
    },
    ProviderDetails: {
      authorize_scopes: 'public_profile,email,user_birthday',
    },
  });
});

test('05. Userpool Client Created', () => {
  template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
    ClientName: stackConfig.userPoolClientName,
    CallbackURLs: stackConfig.callbackUrls,
    LogoutURLs: stackConfig.logoutUrls,
    IdTokenValidity: 60,
    AccessTokenValidity: 60,
    RefreshTokenValidity: 43200,
    TokenValidityUnits: {
      AccessToken: 'minutes',
      IdToken: 'minutes',
      RefreshToken: 'minutes',
    },
    EnableTokenRevocation: true,
    AllowedOAuthFlows: [ 'code' ],
    AllowedOAuthFlowsUserPoolClient: true,
    AllowedOAuthScopes: [
      'profile',
      'email',
      'openid',
      'phone',
    ],
    SupportedIdentityProviders: [
      'COGNITO',
      'Google',
      'Facebook',
    ],
    PreventUserExistenceErrors: 'ENABLED',
  });
});

test('06. Identity Pool Created', () => {
  template.hasResourceProperties('AWS::Cognito::IdentityPool', {
    IdentityPoolName: stackConfig.identityPoolName,
    AllowUnauthenticatedIdentities: true,
  });
});

test('07. IAM Auth Role Created', () => {
  template.hasResourceProperties('AWS::IAM::Role', {
    RoleName: stackConfig.authenticatedUserName,
  });
});

test('08. IAM UnAuth Role Created', () => {
  template.hasResourceProperties('AWS::IAM::Role', {
    RoleName: stackConfig.unAuthenticatedUserName,
  });
});