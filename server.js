const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
    res.send("Dynamic Path Scraper is Online.");
});

app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: "Missing 'url' parameter" });
    }

    let browser;
    try {
        // Look everywhere Render or Puppeteer could have stored the browser binary
        const possiblePaths = [
            process.env.PUPPETEER_EXECUTABLE_PATH,
            '/opt/render/.cache/puppeteer/chrome/linux-127.0.6533.88/chrome-linux64/chrome',
            '/opt/render/project/src/.cache/puppeteer/chrome/linux-127.0.6533.88/chrome-linux64/chrome',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser'
        ];

        let chromePath = '';
        for (const path of possiblePaths) {
            if (path && fs.existsSync(path)) {
                chromePath = path;
                break;
            }
        }

        // Ultimate fallback: if no path exists, look for any executable inside the cache directory recursively
        if (!chromePath) {
            console.log("Standard paths missed. Searching cache directory...");
            const searchCache = (dir) => {
                if (!fs.existsSync(dir)) return null;
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const fullPath = `${dir}/${file}`;
                    if (fs.statSync(fullPath).isDirectory()) {
                        const found = searchCache(fullPath);
                        if (found) return found;
                    } else if (file === 'chrome' || file === 'chromium') {
                        return fullPath;
                    }
                }
                return null;
            };
            chromePath = searchCache('/opt/render/.cache/puppeteer') || '/usr/bin/google-chrome';
        }

        console.log(`Final Executable Choice: ${chromePath}`);
        
                // Hardcode the path to match the directory mapped by your shell script
        const stableChromePath = '/opt/render/.cache/puppeteer/chrome/linux-127.0.6533.88/chrome-linux64/chrome';
        
        browser = await puppeteer.launch({
            executablePath: stableChromePath,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-extensions'
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        const rawText = await page.evaluate(() => document.body.innerText);
        const data = JSON.parse(rawText);

        await browser.close();
        res.json(data);

    } catch (error) {
        if (browser) {
            try { await browser.close(); } catch(e) {}
        }
        console.error(error);
        res.status(500).json({ error: "Scraper execution error.", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Scraper listening on port ${PORT}`);
});
