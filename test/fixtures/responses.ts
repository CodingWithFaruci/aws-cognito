import { PutCommandOutput } from '@aws-sdk/lib-dynamodb';
import { PutObjectCommandOutput } from '@aws-sdk/client-s3';
import { PutMetricDataCommandOutput } from '@aws-sdk/client-cloudwatch';

export const s3PutResponse: PutObjectCommandOutput = {
  $metadata: {
    httpStatusCode: 200,
  },
};

export const s3FailedResponse: PutObjectCommandOutput = {
  $metadata: {
    httpStatusCode: 500,
  },
};

export const dynamoPutResponse: PutCommandOutput = {
  $metadata: {
    httpStatusCode: 200,
  },
  Attributes: {
    sub: '0123456789',
    email: 'test@domain.com',
  },
  ConsumedCapacity: {
    TableName: 'test-table',
    CapacityUnits: 1,
  },
  ItemCollectionMetrics: {
    ItemCollectionKey: {
      id: 'user-id',
    },
    SizeEstimateRangeGB: [0.5, 1],
  },
};

export const dynamoFailedResponse: PutCommandOutput = {
  $metadata: {
    httpStatusCode: 500,
  },
};

export const cwSuccessResponse: PutMetricDataCommandOutput = {
  $metadata: {
    httpStatusCode: 200,
  },
};