const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const chromium = require('@sparticuz/chromium-min');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
    res.send("Bundled Stealth Scraper is Online.");
});

app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: "Missing 'url' parameter" });
    }

    let browser;
    try {
        console.log(`Launching bundled browser for: ${targetUrl}`);
        
        // This grabs the stable pre-compiled path that survives deployments
        const executablePath = await chromium.executablePath(
            `https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`
        );

        browser = await puppeteer.launch({
            executablePath: executablePath,
            headless: true,
            args: [
                ...chromium.args,
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled'
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
        if (browser) await browser.close();
        console.error(error);
        res.status(500).json({ error: "Scraping deployment error.", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Scraper running on port ${PORT}`);
});
