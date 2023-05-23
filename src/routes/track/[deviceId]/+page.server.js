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
	let topic = 'scan';
	let limit = 30;

	const run = async () => {
		try {
			const parameters = {
				TableName: 'kegcat-dev-eu',
				KeyConditionExpression: 'id = :mac',
				ScanIndexForward: false,
				ExpressionAttributeNames: {
					'#c': 'timestamp'
				},
				FilterExpression: 'message_topic = :t',
				ExpressionAttributeValues: {
					':mac': params.deviceId,
					// ':s': start_time.toISOString(),
					':t': topic,
				},
				Limit: limit,
				ProjectionExpression: 'id, #c, battery, config, entries, firmware_version, hardware_version, iccid, imei, message_topic, mobile, scan_results',
			};
			const data = await client.send(new QueryCommand(parameters));
			/** @type any */
			const obj = structuredClone(data.Items);
			return obj;
		} catch (err) {
			console.log('Error', err);
		}
	};
	// const logs = await run();
	// console.log(logs);
	let scan_logs = [];
	scan_logs = await run();
		/** @type { { message_topic: string, entries: {timestamp: String, temperature: number, orientation: string, tilted: boolean, moved: boolean}[], id: string, battery: number, timestamp: string }[] } */
	let monit_logs = [];
	topic = 'monit';
	monit_logs = await run();

	let reset_logs = [];
	topic = 'reset';
	reset_logs = await run();



	const /** @type {import("@redis/client").RedisClientType} */ redis_client = createClient({
		password: MY_REDIS_PASSWORD,
		socket: {
			host: 'redis-14990.c291.ap-southeast-2-1.ec2.cloud.redislabs.com',
			port: 14990
		}
	});


	/** @type  { Map<number, any> } */
	let tempTx = new Map();

	for (const msg of scan_logs) {
		let timestampMsec = moment(msg.timestamp).valueOf();
		// timestampMsec = Math.round(timestampMsec / 1000 / 60 / 5) * 5 * 60;
		tempTx.set(timestampMsec, msg);
	}

	scan_logs = [];

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


	/**
	 * @type {{group: string, date: string, key?: string, value: string | number }[]}
	 */
	let chart_data = [];
	// console.log(monit_logs);

	/**
	 * @type {undefined | boolean }
	 */
	let lastTilt = undefined;
	/**
	 * @type {undefined | boolean }
	 */
	let lastMove = undefined;
	/**
	 * @type {undefined | string }
	 */
	let lastOrientation = undefined;

	monit_logs.forEach((monit) => {
		for (let entry of monit.entries) {
			// const secs = Math.round(moment(entry.timestamp).valueOf() / 1000 / 15) * 1000 * 15;
			const ts = moment(entry.timestamp).toISOString();
			if (entry.temperature > -120) {
				chart_data.push({
					group: "Temperature",
					date: ts,
					key: "--",
					value: entry.temperature,
				});
			}
			if (lastOrientation !== entry.orientation) {
				chart_data.push({
					group: "Orientation",
					date: ts,
					key: entry.orientation,
					value: entry.orientation
				});
			}

			if (entry.tilted) {
				if (lastTilt === entry.tilted) {
					chart_data.push({
						group: "Tilt",
						date: ts,
						key: "tilted",
						value: "tilted"
					});
				}
			}
			if (entry.moved) {
				if (lastMove === entry.moved) {
					chart_data.push({
						group: "Movement",
						date: ts,
						key: "moved",
						value: "moved"
					});
				}
			}
			lastTilt = entry.tilted;
			lastMove = entry.moved;
			lastOrientation = entry.orientation;
		}
	});

	const compareTimestamp = ( /** @type {{ date: moment.MomentInput; }} */ a, /** @type {{ date: moment.MomentInput; }} */ b) => {
		if (moment.parseZone(a.date).isBefore(moment.parseZone(b.date))) {
			return -1;
		}
		if (moment.parseZone(a.date).isAfter(moment.parseZone(b.date))) {
			return 1;
		}
		return 0;
	}

	chart_data = chart_data.sort(compareTimestamp);

	return {
		device_id: params.deviceId,
		chart_data: chart_data,
		scan_logs: scan_logs,
		reset_logs: reset_logs
	}
};
