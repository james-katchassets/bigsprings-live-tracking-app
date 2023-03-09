import { ALLOWED_LOGIN } from '$env/static/private';

/** @type {import('@sveltejs/kit').Handle } */
export const handle = async ({ event, resolve }) => {
	const auth = event.request.headers.get('Authorization');
	const encoded = Buffer.from(ALLOWED_LOGIN).toString('base64');
	if (auth !== `Basic ` + encoded) {
		return new Response('Not authorized', {
			status: 401,
			headers: {
				'WWW-Authenticate': 'Basic realm="User Visible Realm", charset="UTF-8"'
			}
		});
	}
	const res = await resolve(event);
	return res;
};
