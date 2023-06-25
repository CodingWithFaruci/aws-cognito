/* eslint-disable max-lines */
import { PostConfirmationTriggerEvent } from 'aws-lambda';

interface IEvent {
  username:string,
  sub:string,
  email:string,
  email_verified: string,
  given_name: string,
  family_name: string,
}

const testUserName = 'TestUser1';
const testSub = '0123456789';
const testEmail = 'test@domain.com';
const emailVerified = 'true';
const givenName = 'testName';
const familyName = 'testFamilyName';

// eslint-disable-next-line complexity
const createEvent = (values: IEvent) => {
  const event: PostConfirmationTriggerEvent = {
    triggerSource: 'PostConfirmation_ConfirmSignUp',
    region: 'eu-west-1',
    userName: values.username,
    version: '1',
    userPoolId: 'userPoolId',
    callerContext: {
      awsSdkVersion: 'awsSdkVersion',
      clientId: 'clientId',
    },
    request: {
      userAttributes: {
        sub: values.sub,
        email: values.email,
        email_verified: values.email_verified,
        given_name: values.given_name,
        family_name: values.family_name,
      },
      clientMetadata: {
        'string': 'string',
      },
    },
    response: {},
  };
  return event;
};

export const TestEvent: PostConfirmationTriggerEvent = createEvent({
  username: testUserName,
  sub: testSub,
  email: testEmail,
  email_verified: emailVerified,
  given_name: givenName,
  family_name: familyName,
});

export const TestEventMissingUserName: PostConfirmationTriggerEvent = createEvent({
  username: '',
  sub: testSub,
  email: testEmail,
  email_verified: emailVerified,
  given_name: givenName,
  family_name: familyName,
});

export const TestEventMissingSub: PostConfirmationTriggerEvent = createEvent({
  username: testUserName,
  sub: '',
  email: testEmail,
  email_verified: emailVerified,
  given_name: givenName,
  family_name: familyName,
});

export const TestEventMissingEmail: PostConfirmationTriggerEvent = createEvent({
  username: testUserName,
  sub: testSub,
  email: '',
  email_verified: emailVerified,
  given_name: givenName,
  family_name: familyName,
});

export const TestEventMissingEmailVerified: PostConfirmationTriggerEvent = createEvent({
  username: testUserName,
  sub: testSub,
  email:testEmail,
  email_verified: '',
  given_name: givenName,
  family_name: familyName,
});

export const TestEventMissingGivenName: PostConfirmationTriggerEvent = createEvent({
  username: testUserName,
  sub: testSub,
  email:testEmail,
  email_verified: emailVerified,
  given_name: '',
  family_name: familyName,
});

export const TestEventMissingFamilyName: PostConfirmationTriggerEvent = createEvent({
  username: testUserName,
  sub: testSub,
  email:testEmail,
  email_verified: emailVerified,
  given_name: givenName,
  family_name: '',
});