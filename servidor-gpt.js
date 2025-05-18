const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const puppeteer = require('puppeteer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Ruta GET para probar si el endpoint está activo
app.get('/preguntar', (req, res) => {
  res.send('✅ El endpoint /preguntar está activo, pero solo acepta solicitudes POST.');
});

// Ruta POST que recibe la pregunta desde el cliente
app.post('/preguntar', async (req, res) => {
  const pregunta = req.body.pregunta;
  if (!pregunta) return res.status(400).json({ error: 'Falta el campo pregunta' });

  try {
    const respuesta = await obtenerRespuestaDesdeGPT(pregunta);
    res.json({ respuesta });
  } catch (error) {
    console.error('❌ Error al contactar con GPT:', error);
    res.status(500).json({ error: 'Error al contactar con el modelo GPT' });
  }
});

// Lógica simulada para conectarse al GPT personalizado
async function obtenerRespuestaDesdeGPT(pregunta) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(process.env.GPT_CHAT_URL, { waitUntil: 'networkidle2' });

  await page.evaluate((msg) => {
    const input = document.querySelector('textarea');
    input.value = msg;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const button = document.querySelector('button[type="submit"]');
    button.click();
  }, pregunta);

  await page.waitForTimeout(8000); // esperar respuesta

  const respuesta = await page.evaluate(() => {
    const respuestas = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
    return respuestas.pop()?.innerText || 'Sin respuesta';
  });

  await browser.close();
  return respuesta;
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor escuchando en http://0.0.0.0:${PORT}`);
});
