// Create service client module using ES6 syntax.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '$env/static/private';

// Set the AWS Region.
const REGION = 'ap-southeast-2'; //e.g. "us-east-1"
const cred = {
	accessKeyId: AWS_ACCESS_KEY_ID,
	secretAccessKey: AWS_SECRET_ACCESS_KEY
};
// Create an Amazon DynamoDB service client object.
const ddbClient = new DynamoDBClient({ region: REGION, credentials: cred });
export { ddbClient };
