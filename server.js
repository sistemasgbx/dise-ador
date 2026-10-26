const express = require('express');
const path = require('path');

const app = express();
// Hostinger inyecta el puerto dinámicamente en process.env.PORT
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Datos en memoria (puedes cambiarlo a base de datos luego)
let habitacionActual = {
  largo: 5,
  ancho: 4,
  alto: 2.7,
  colorPared: '#e8e0d5'
};

// API: Obtener medidas
app.get('/api/habitacion', (req, res) => {
  res.json(habitacionActual);
});

// API: Guardar medidas
app.post('/api/habitacion', (req, res) => {
  const { largo, ancho, alto, colorPared } = req.body;

  const errores = [];
  if (typeof largo !== 'number' || largo <= 0 || largo > 50) errores.push('Largo invalido (0-50 m)');
  if (typeof ancho !== 'number' || ancho <= 0 || ancho > 50) errores.push('Ancho invalido (0-50 m)');
  if (typeof alto !== 'number' || alto <= 0 || alto > 10) errores.push('Alto invalido (0-10 m)');

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

// Fallback para SPA: cualquier otra ruta devuelve el index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});