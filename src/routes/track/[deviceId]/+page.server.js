import { MY_AWS_ACCESS_KEY_ID, MY_AWS_SECRET_ACCESS_KEY, MY_HEREMAPS_API_KEY, MY_REDIS_PASSWORD } from '$env/static/private';
import { ddbClient } from '$lib/ddbclient';
import moment from 'moment';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createClient } from 'redis';
import { positioning, revgeocoding } from '$lib/heremaps';
import md5 from 'blueimp-md5';


/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch }) => {
	const cred = {
		accessKeyId: MY_AWS_ACCESS_KEY_ID,
		secretAccessKey: MY_AWS_SECRET_ACCESS_KEY
	};

	const client = ddbClient;
	const start_time = moment().utc().subtract(3, 'days');
	const parameters = {
		TableName: 'kegcat-dev-eu',
		KeyConditionExpression: 'id = :mac AND #c >= :s',
		ScanIndexForward: false,
		ExpressionAttributeNames: {
			'#c': 'timestamp'
		},
		ExpressionAttributeValues: {
			':mac': params.deviceId,
			':s': start_time.toISOString(),
		},
		ProjectionExpression: 'id, #c, battery, config, entries, firmware_version, hardware_version, iccid, imei, message_topic, mobile, scan_results',
	};

	const run = async () => {
		try {
			const data = await client.send(new QueryCommand(parameters));
			/** @type any */
			const obj = structuredClone(data.Items);
			return obj;
		} catch (err) {
			console.log('Error', err);
		}
	};
	const logs = await run();
	let monit_logs = [];
	/**
	 * @type {any[]}
	 */
	let scan_logs = [];
	let reset_logs = [];



	const /** @type {import("@redis/client").RedisClientType} */ redis_client = createClient({
		password: MY_REDIS_PASSWORD,
		socket: {
			host: 'redis-14990.c291.ap-southeast-2-1.ec2.cloud.redislabs.com',
			port: 14990
		}
	});
	
	
	/** @type  { Map<number, any> } */
	let tempTx = new Map();

	for (const msg of logs) {
		switch (msg.message_topic) {
			case 'monit':
				monit_logs.push(msg);
				break;
			case 'scan':
				// const loc = await positioning(msg);
				// if ( loc != null ) {
				// 	msg.location = loc.location;
				// } else {
				// 	msg.location = null;
				// }
				// scan_logs.push(msg);
				/** @type Number */
				let timestampMsec = moment(msg.timestamp).valueOf();
				timestampMsec = Math.round(timestampMsec / 1000 / 60 / 5) * 5 * 60;
				tempTx.set(timestampMsec, msg);
				break;
			case 'reset':
				reset_logs.push(msg);
				break;
			default:
				break;
		}
	}

	const delay = (/** @type number */ time) => {
		return new Promise(resolve => setTimeout(resolve, time));
	};
	
	const keys = Array.from(tempTx.keys());
	await redis_client.connect();
	for (let i of keys) {
		const v = tempTx.get(i);
		const loc = await positioning(v, redis_client);
		if (loc != null && JSON.stringify(loc) !== '{}') {
			v.location = loc.location;
			const places = await revgeocoding(loc, redis_client);
			v.places = places;
		} else {
			v.location = null
		}
		scan_logs.push(v);
	}
	redis_client.quit();
	


	return {
		device_id: params.deviceId,
		monit_logs: monit_logs,
		scan_logs: scan_logs,
		reset_logs: reset_logs
	}
};
