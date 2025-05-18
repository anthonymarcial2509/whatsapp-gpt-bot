// 📦 servidor-gpt.js
const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/preguntar', async (req, res) => {
  const { pregunta } = req.body;
  if (!pregunta) return res.status(400).json({ error: 'Falta el campo pregunta' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Establecer cookies
    await page.setCookie({
      name: '__Secure-next-auth.session-token',
      value: process.env.GPT_SESSION_TOKEN,
      domain: '.chatgpt.com',
      path: '/',
      httpOnly: true,
      secure: true
    });

    console.log('🌐 Navegando a tu GPT personalizado...');
    await page.goto(process.env.GPT_CHAT_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('textarea', { timeout: 30000 });
    await page.type('textarea', pregunta);
    await page.keyboard.press('Enter');

    console.log('⌛ Esperando respuesta del GPT...');
    await page.waitForSelector('[data-message-author-role="assistant"]', { timeout: 60000 });

    const respuesta = await page.evaluate(() => {
      const elementos = document.querySelectorAll('[data-message-author-role="assistant"]');
      return elementos[elementos.length - 1]?.innerText || 'Sin respuesta';
    });

    console.log('✅ GPT respondió');
    await browser.close();
    res.json({ respuesta });

  } catch (err) {
    console.error('❌ Error al usar el GPT personalizado:', err.message);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Error al obtener respuesta del GPT' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor intermedio corriendo en http://localhost:${PORT}`);
});
