import express from 'express';
import bodyParser from 'body-parser';
const cors = require('cors');
import * as escpos from 'escpos';
import escposUSB from 'escpos-usb';
import { config } from './config/config';
import { connectDatabase } from './config/database';
import { seedSeguridadBase } from './models';
import { errorHandler } from './middlewares/error.middleware';

// Configuración inicial de la impresora (si aplica para recibos de pensión/matrícula)
(escpos as any).USB = escposUSB;
let printerDevice: any = null;
let printerInitialized = false;
const PRINTER_VENDOR_ID = 0x0483;
const PRINTER_PRODUCT_ID = 0x5743;

try {
  printerDevice = new escpos.USB(PRINTER_VENDOR_ID, PRINTER_PRODUCT_ID);
  printerInitialized = true;
  console.log('Impresora inicializada correctamente');
} catch (_error) {
  printerInitialized = false;
}

const connectPrinter = async () => {
  try {
    if (printerDevice) {
      try {
        printerDevice.close();
      } catch (e) {
        console.warn('Error al cerrar conexión previa:', e);
      }
    }
    printerDevice = new (escpos as any).USB(PRINTER_VENDOR_ID, PRINTER_PRODUCT_ID);
    printerInitialized = true;
    return true;
  } catch (_error) {
    printerInitialized = false;
    return;
  }
};

const app = express();

app.use(
  cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.set('trust proxy', true);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '10mb' }));

// Configurar cabeceras y CORS
app.use((_req: any, res: any, next: any) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

// Importar rutas
import authRoutes from './routes/auth.router';
import loginRoutes from './routes/login.router';
const appRoutes = require('./routes/app.router');

// Rutas de la API
app.use('/', appRoutes);
app.use('/api/auth', authRoutes);
app.use('/login', loginRoutes); // Ruta de compatibilidad

// Middleware centralizado de manejo de errores HTTP
app.use(errorHandler);

export { app, printerDevice, printerInitialized, connectPrinter };

// Inicialización del servidor y conexión a PostgreSQL
const port = config.port;
app.listen(port, async () => {
  console.log(`[API] Servidor Escaleritas ERP escuchando en http://localhost:${port}`);
  await connectDatabase();
  await seedSeguridadBase();
});
