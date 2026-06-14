const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Activate the stealth plugin to hide from Cloudflare
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

// Completely open CORS so InfinityFree can read the data
app.use(cors());

app.get('/', (req, res) => {
    res.send("Stealth Scraper is Online.");
});

// The dynamic API endpoint
app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: "Missing 'url' parameter" });
    }

    let browser;
    try {
        console.log(`Spinning up stealth browser for: ${targetUrl}`);
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        const page = await browser.newPage();
        
        // Wait until the network is quiet (meaning Cloudflare is done loading)
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Extract the raw JSON from the browser window
        const rawText = await page.evaluate(() => document.body.innerText);
        const data = JSON.parse(rawText);

        await browser.close();
        res.json(data);

    } catch (error) {
        if (browser) await browser.close();
        console.error(error);
        res.status(500).json({ error: "Scraping failed or blocked by firewall.", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Stealth Scraper running on port ${PORT}`);
});