const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
    res.send("Smart Path Scraper is Online.");
});

// Helper function to scan the cache directory for any Chrome executable
function findChromeExecutable() {
    const baseCacheDir = '/opt/render/.cache/puppeteer/chrome';
    
    if (!fs.existsSync(baseCacheDir)) {
        return null;
    }

    // Read the folders inside (e.g., 'linux-127.0.6533.88' or similar)
    const folders = fs.readdirSync(baseCacheDir);
    for (const folder of folders) {
        const expectedPath = path.join(baseCacheDir, folder, 'chrome-linux64', 'chrome');
        if (fs.existsSync(expectedPath)) {
            return expectedPath;
        }
    }
    return null;
}

app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: "Missing 'url' parameter" });
    }

    let browser;
    try {
        const chromePath = findChromeExecutable();
        
        if (!chromePath) {
            throw new Error(`Chrome binary not found anywhere inside /opt/render/.cache/puppeteer/chrome`);
        }

        console.log(`Launching browser using auto-detected path: ${chromePath}`);
        
        browser = await puppeteer.launch({
            executablePath: chromePath,
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
