import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '$env/static/private';
import { ddbClient } from '$lib/ddbclient';
import moment from 'moment';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

/** @type {import('./$types').PageServerLoad} */
export const load = ({ locals }) => {
	const cred = {
		accessKeyId: AWS_ACCESS_KEY_ID,
		secretAccessKey: AWS_SECRET_ACCESS_KEY
	};

	const client = ddbClient;
	const start_time = moment().subtract(1, 'days').valueOf();

	const params = {
		TableName: 'nmealogs',
		KeyConditionExpression: 'macaddr = :mac AND timestamp_msec >= :s',
		// FilterExpression: "ffamode = :mode",
		ExpressionAttributeValues: {
			':mac': '00:50:18:6B:EA:EB',
			':s': start_time
		},
		ProjectionExpression: 'macaddr, timestamp_msec, lat, lng, speed',
	};

	const run = async () => {
		try {
			const data = await client.send(new QueryCommand(params));
			// console.log (data);
			/** @type any */
			const obj = structuredClone(data.Items);
			return obj;
		} catch (err) {
			console.log('Error', err);
		}
	};
	return {
		logs: run()
	};
};
