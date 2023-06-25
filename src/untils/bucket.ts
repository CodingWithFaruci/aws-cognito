import {
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';

interface IBucketDirectory {
  sub:string,
  bucketName:string,
  s3: S3Client
}

export const handleBucketDirectory = async (values: IBucketDirectory) => {
  const input: PutObjectCommandInput = {
    Bucket: values.bucketName,
    Key: `users/${values.sub}/`,
  };
  const command: PutObjectCommand = new PutObjectCommand(input);
  const result: PutObjectCommandOutput = await values.s3.send(command);
  return result.$metadata.httpStatusCode;
};