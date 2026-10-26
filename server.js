import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Hostinger inyecta el puerto en la variable de entorno PORT
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let habitacionActual = {
  largo: 5,
  ancho: 4,
  alto: 2.7,
  colorPared: '#e8e0d5'
};

app.get('/api/habitacion', (req, res) => {
  res.json(habitacionActual);
});

app.post('/api/habitacion', (req, res) => {
  const { largo, ancho, alto, colorPared } = req.body;

  const errores = [];
  if (typeof largo !== 'number' || largo <= 0 || largo > 50) errores.push('Largo inválido (0-50 m)');
  if (typeof ancho !== 'number' || ancho <= 0 || ancho > 50) errores.push('Ancho inválido (0-50 m)');
  if (typeof alto !== 'number' || alto <= 0 || alto > 10) errores.push('Alto inválido (0-10 m)');

  if (errores.length > 0) {
    return res.status(400).json({ ok: false, errores });
  }

  habitacionActual = {
    largo,
    ancho,
    alto,
    colorPared: colorPared || habitacionActual.colorPared
  };

  res.json({ ok: true, habitacion: habitacionActual });
});

// Fallback para SPA (opcional pero recomendado)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
});