/* eslint-disable complexity, max-statements */
import { PostConfirmationTriggerEvent } from 'aws-lambda';

// clients.
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';

// helpers.
import { validateEvent } from './untils/validate';
import { handleBucketDirectory } from './untils/bucket';
import { handleTableEntry } from './untils/table';
import { handleCloudwatchEvent } from './untils/cloudwatch';

// error messages.
import {
  DYNAMO_FAILED,
  MISSING_BUCKET_OR_TABLE_NAME,
  MISSING_EMAIL,
  MISSING_EMAIL_VERIFIED,
  MISSING_FAMILY_NAME,
  MISSING_GIVEN_NAME,
  MISSING_NAME,
  MISSING_SUB,
  S3_FAILED,
} from './untils/errors';

// lazy loading clients.
let s3: S3Client;
let ddb: DynamoDBDocumentClient;
let cw: CloudWatchClient;

export const handler = async (event: PostConfirmationTriggerEvent) => {
  if (!s3) s3 = new S3Client({ region: process.env.REGION });
  if (!ddb) ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }));
  if (!cw) cw = new CloudWatchClient({ region: process.env.REGION });

  const bucketName = process.env.BUCKET_NAME || '';
  const tableName = process.env.TABLE_NAME || '';

  if (!bucketName || !tableName) throw new Error(MISSING_BUCKET_OR_TABLE_NAME);

  const sub = event.request.userAttributes.sub;
  const userName = event.userName;
  const email = event.request.userAttributes.email;
  const emailVerified = event.request.userAttributes.email_verified;
  const givenName = event.request.userAttributes.given_name;
  const familyName = event.request.userAttributes.family_name;

  try {
    const validSub = validateEvent(sub);
    if (!validSub) throw new Error(MISSING_SUB);

    const validName = validateEvent(userName);
    if (!validName) throw new Error(MISSING_NAME);

    const validEmail = validateEvent(email);
    if (!validEmail) throw new Error(MISSING_EMAIL);

    const validEmailVerified = validateEvent(emailVerified);
    if (!validEmailVerified) throw new Error(MISSING_EMAIL_VERIFIED);

    const validGivenName = validateEvent(givenName);
    if (!validGivenName) throw new Error(MISSING_GIVEN_NAME);

    const validFamilyName = validateEvent(familyName);
    if (!validFamilyName) throw new Error(MISSING_FAMILY_NAME);

    const tableEntry = {
      account_id: sub,
      account_name: userName,
      account_email: email,
      email_verified: emailVerified,
      given_name: givenName,
      family_name: familyName,
    };

    const bucketSucces = await handleBucketDirectory({ sub, bucketName, s3 });
    if (bucketSucces != 200) throw new Error(S3_FAILED);

    const tableSuccess = await handleTableEntry({ tableEntry, tableName, ddb });
    if (tableSuccess != 200) throw new Error(DYNAMO_FAILED);

  } catch (err: any) {
    await handleCloudwatchEvent({ sub, err, cw });
    throw err;
  }

  return event;
};
