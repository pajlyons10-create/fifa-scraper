const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
    res.send("Dockerized Stealth Scraper is Online.");
});

app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: "Missing 'url' parameter" });
    }

    let browser;
    try {
        console.log(`Launching containerized Chromium for: ${targetUrl}`);
        
        browser = await puppeteer.launch({
            // Changed back to the official Docker Linux path
            executablePath: '/usr/bin/chromium',
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-zygote',
                '--single-process'
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
    console.log(`Docker scraper listening on port ${PORT}`);
});
