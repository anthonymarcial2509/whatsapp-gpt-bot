const venom = require('venom-bot');
const fetch = require('node-fetch');
require('dotenv').config();

venom
  .create({
    session: 'mi-sesion-bot',
    headless: false,
    useChrome: true,
    browserPath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    logQR: false,
    disableWelcome: true
  })
  .then((client) => start(client))
  .catch((error) => {
    console.error('❌ Error al iniciar Venom:', error);
    process.exit(1);
  });

function start(client) {
  console.log('🤖 Bot conectado y listo para usar');

  client.onMessage(async (message) => {
    if (!message.isGroupMsg && message.body) {
      try {
        const respuesta = await enviarPreguntaAGPT(message.body);
        await client.sendText(message.from, respuesta);
      } catch (err) {
        console.error('❌ Error comunicando con GPT:', err);
        await client.sendText(message.from, '❌ Error al contactar con la IA.');
      }
    }
  });
}

async function enviarPreguntaAGPT(pregunta) {
  const res = await fetch('http://localhost:3000/preguntar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pregunta })
  });
  const data = await res.json();
  return data.respuesta || 'Sin respuesta';
}
