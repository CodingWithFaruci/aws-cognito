/* eslint-disable max-lines, max-len */
import { handler } from '../src/index';

// Mock AWS Services
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

// Error messages.
import {
  DYNAMO_FAILED,
  MISSING_BUCKET_OR_TABLE_NAME,
  MISSING_EMAIL, MISSING_EMAIL_VERIFIED,
  MISSING_FAMILY_NAME, MISSING_GIVEN_NAME,
  MISSING_NAME,
  MISSING_SUB,
  S3_FAILED,
} from '../src/untils/errors';

// Test In and Outputs.
import {
  TestEvent,
  TestEventMissingUserName,
  TestEventMissingSub,
  TestEventMissingEmail,
  TestEventMissingEmailVerified,
  TestEventMissingGivenName,
  TestEventMissingFamilyName,
} from './fixtures/events';
import {
  cwSuccessResponse,
  dynamoFailedResponse,
  dynamoPutResponse,
  s3FailedResponse,
  s3PutResponse,
} from './fixtures/responses';

// Client Mocks
const s3MockClient = mockClient(S3Client);
const ddbMockClient = mockClient(DynamoDBDocumentClient);
const cwMockClient = mockClient(CloudWatchClient);

describe('Patch Methods', () => {
  beforeEach(() => {
    s3MockClient.reset();
    ddbMockClient.reset();
    cwMockClient.reset();
    process.env = Object.assign(process.env, {
      BUCKET_NAME: 'test-bucket',
      TABLE_NAME: 'test-table',
    });
  });

  it('01. successfully creates an s3 directory and inserts an entry into dynamoDb', async () => {
    s3MockClient.on(PutObjectCommand).resolves(s3PutResponse);
    ddbMockClient.on(PutCommand).resolves(dynamoPutResponse);
    await expect(handler(TestEvent)).resolves.not.toThrowError();
  });

  it('02. throws an error on missing table name', async () => {
    process.env = Object.assign(process.env, { TABLE_NAME: '', BUCKET_NAME: 'test-bucket' });
    await expect(handler(TestEvent)).rejects.toThrowError(MISSING_BUCKET_OR_TABLE_NAME);
  });

  it('03. throws an error on missing bucket name', async () => {
    process.env = Object.assign(process.env, { TABLE_NAME: 'test-table', BUCKET_NAME: '' });
    await expect(handler(TestEvent)).rejects.toThrowError(MISSING_BUCKET_OR_TABLE_NAME);
  });

  it('04. throws an error on missing sub', async () => {
    s3MockClient.on(PutObjectCommand).rejects(s3PutResponse);
    cwMockClient.on(PutMetricDataCommand).resolves(cwSuccessResponse);
    await expect(handler(TestEventMissingSub)).rejects.toThrowError(MISSING_SUB);
  });

  it('05. throws an error on missing username', async () => {
    s3MockClient.on(PutObjectCommand).rejects(s3PutResponse);
    ddbMockClient.on(PutCommand).resolves(dynamoPutResponse);
    cwMockClient.on(PutMetricDataCommand).resolves(cwSuccessResponse);
    await expect(handler(TestEventMissingUserName)).rejects.toThrowError(MISSING_NAME);
  });

  it('06. throws an error on missing email', async () => {
    s3MockClient.on(PutObjectCommand).rejects(s3PutResponse);
    cwMockClient.on(PutMetricDataCommand).resolves(cwSuccessResponse);
    await expect(handler(TestEventMissingEmail)).rejects.toThrowError(MISSING_EMAIL);
  });

  it('07. throws an error on missing email verified', async () => {
    s3MockClient.on(PutObjectCommand).rejects(s3PutResponse);
    cwMockClient.on(PutMetricDataCommand).resolves(cwSuccessResponse);
    await expect(handler(TestEventMissingEmailVerified)).rejects.toThrowError(MISSING_EMAIL_VERIFIED);
  });

  it('08. throws an error on missing given name', async () => {
    s3MockClient.on(PutObjectCommand).rejects(s3PutResponse);
    cwMockClient.on(PutMetricDataCommand).resolves(cwSuccessResponse);
    await expect(handler(TestEventMissingGivenName)).rejects.toThrowError(MISSING_GIVEN_NAME);
  });

  it('09. throws an error on missing family name', async () => {
    s3MockClient.on(PutObjectCommand).rejects(s3PutResponse);
    cwMockClient.on(PutMetricDataCommand).resolves(cwSuccessResponse);
    await expect(handler(TestEventMissingFamilyName)).rejects.toThrowError(MISSING_FAMILY_NAME);
  });

  it('10. throws an error on non 200 response code for s3', async () => {
    s3MockClient.on(PutObjectCommand).resolves(s3FailedResponse);
    cwMockClient.on(PutMetricDataCommand).resolves(cwSuccessResponse);
    await expect(handler(TestEvent)).rejects.toThrowError(S3_FAILED);
  });

  it('11. throws an error on non 200 response code for dynamoDb', async () => {
    s3MockClient.on(PutObjectCommand).resolves(s3PutResponse);
    ddbMockClient.on(PutCommand).resolves(dynamoFailedResponse);
    cwMockClient.on(PutMetricDataCommand).resolves(cwSuccessResponse);
    await expect(handler(TestEvent)).rejects.toThrowError(DYNAMO_FAILED);
  });

  it('12. throw failure but fails a CloudWatch event and continues', async () => {
    s3MockClient.on(PutObjectCommand).resolves(s3PutResponse);
    ddbMockClient.on(PutCommand).resolves(dynamoFailedResponse);
    cwMockClient.on(PutMetricDataCommand).rejects(cwSuccessResponse);
    await expect(handler(TestEvent)).rejects.toThrowError(DYNAMO_FAILED);
  });
});
