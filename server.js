require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');
const handlebars = require('handlebars');


const app = express();
// Aumentar límites para JSON y datos de formulario
app.use(bodyParser.json({ 
    limit: '50mb',
    type: 'application/json'
  }));
  
  app.use(bodyParser.urlencoded({ 
    limit: '50mb',
    extended: true,
    parameterLimit: 100000  // Aumenta el número de parámetros permitidos
  }));
  
  // Configurar CORS después de body-parser
  app.use(cors());
app.use(bodyParser.json());


// Cargar plantillas
const templatePath = path.join(__dirname, 'frontend/templates', 'email-template.hbs');
const templateContent = fs.readFileSync(templatePath, 'utf8');
const template = handlebars.compile(templateContent);

// Cargar estilos
const stylesPath = path.join(__dirname, 'frontend/templates', 'email-styles.css');
const styles = fs.readFileSync(stylesPath, 'utf8');

handlebars.registerPartial('email-styles', styles);

app.post('/api/send-email', async (req, res) => {
  // 1. Validación inicial de los datos de entrada
  if (!req.body || !req.body.to || !req.body.pdf) {
      console.error('Datos incompletos recibidos:', {
          to: !!req.body?.to,
          pdf: !!req.body?.pdf,
          proveedor: !!req.body?.proveedor
      });
      return res.status(400).json({ 
          error: 'Datos incompletos',
          required: ['to', 'pdf'],
          received: Object.keys(req.body || {})
      });
  }

  // 2. Configuración inicial
  const { to, pdf, filename = `Reporte_${Date.now()}.pdf`, proveedor = 'Proveedor', totalPedidos = 0 } = req.body;
  
  try {
      // 3. Validar formato del email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
          throw new Error('Formato de email inválido');
      }

      // 4. Verificar variables de entorno
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
          throw new Error('Configuración de email incompleta');
      }

      // 5. Configurar transporte con manejo de errores detallado
      const transporterConfig = {
          service: process.env.EMAIL_SERVICE || 'Gmail',
          host: process.env.EMAIL_SERVICE === 'Gmail' ? 'smtp.gmail.com' : process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT) || 587,
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD
          },
          tls: {
              // Solo en desarrollo permitimos certificados no autorizados
              rejectUnauthorized: process.env.NODE_ENV === 'production'
          },
          logger: true, // Habilita logging interno
          debug: process.env.NODE_ENV !== 'production' // Habilita debug en desarrollo
      };

      // Configuración DKIM si está disponible
      if (process.env.DKIM_PRIVATE_KEY) {
          transporterConfig.dkim = {
              domainName: process.env.DOMINIO,
              keySelector: process.env.DKIM_SELECTOR || 'default',
              privateKey: process.env.DKIM_PRIVATE_KEY.replace(/\\n/g, '\n')
          };
      }

      const transporter = nodemailer.createTransport(transporterConfig);

      // 6. Verificar conexión con el servidor SMTP
      try {
          await transporter.verify();
          console.log('Conexión SMTP verificada correctamente');
      } catch (verifyError) {
          console.error('Error verificando conexión SMTP:', verifyError);
          throw new Error('No se pudo conectar al servidor de correo');
      }

      // 7. Renderizar plantilla con manejo de errores
      let emailHtml;
      try {
          emailHtml = template({
              proveedor,
              fecha: new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
              }),
              totalPedidos,
              empresa: process.env.EMAIL_FROM_NAME || "Ñanpi Courier"
          });
      } catch (templateError) {
          console.error('Error renderizando plantilla:', templateError);
          emailHtml = `
              <h1>Reporte de entregas</h1>
              <p>Proveedor: ${proveedor}</p>
              <p>Total de pedidos: ${totalPedidos}</p>
              <p>Fecha: ${new Date().toLocaleDateString()}</p>
          `;
      }

      // 8. Configurar email con opciones adicionales
      const mailOptions = {
          from: process.env.EMAIL_FROM || `"Ñanpi Courier" <${process.env.EMAIL_USER}>`,
          to,
          replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
          subject: `Reporte de entregas - ${proveedor}`,
          html: emailHtml,
          text: `Estimado ${proveedor},\n\nAdjunto encontrará el reporte de entregas con ${totalPedidos} pedidos.\n\nAtentamente,\nEl equipo de Ñanpi Courier`,
          attachments: [{
              filename: filename.replace(/[^a-zA-Z0-9._-]/g, '_'), // Sanitizar nombre de archivo
              content: pdf,
              encoding: 'base64',
              contentType: 'application/pdf'
          }],
          priority: 'high',
          headers: {
              'X-Priority': '1',
              'X-MSMail-Priority': 'High',
              'Importance': 'high'
          }
      };

      // 9. Enviar email con timeout
      const sendPromise = transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout al enviar email')), 30000)
      );

      const info = await Promise.race([sendPromise, timeoutPromise]);

      //console.log('Email enviado correctamente:', info.messageId);
      
      // 10. Respuesta exitosa
      return res.json({ 
          success: true,
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected
      });

  } catch (error) {
      console.error('Error detallado al enviar email:', {
          error: error.message,
          stack: error.stack,
          body: { to, proveedor, filename: filename?.length, pdfSize: pdf?.length }
      });

      // Determinar código de estado apropiado
      const statusCode = error.message.includes('No se pudo conectar') ? 502 
                       : error.message.includes('Timeout') ? 504 
                       : 500;

      return res.status(statusCode).json({ 
          error: 'Error al enviar el email',
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
  }
});

// Configurar express para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'frontend')));  // Sirve todo lo que está en la carpeta 'frontend'

// Inicializar Firebase Admin SDK
const serviceAccount = require('./nanpi-courier-firebase.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "nanpi-courier.appspot.com"
});

const db = admin.firestore();
const bucket = admin.storage().bucket();


// Endpoint para obtener la imagen desde Firebase Storage
app.get("/get-image", async (req, res) => {
  try {
      const { url } = req.query;
      if (!url) return res.status(400).send("Falta la URL");

      // Extraer el path de la imagen desde la URL
      const match = url.match(/\/o\/([^?]*)/);
      if (!match) return res.status(400).send("URL no válida");

      const filePath = decodeURIComponent(match[1]); // Decodificar el path

      //console.log("Obteniendo la imagen desde Firebase Storage:", filePath);

      // Obtener la imagen desde Firebase Storage
      const file = bucket.file(filePath);
      const [exists] = await file.exists();

      if (!exists) return res.status(404).send("Imagen no encontrada");

      res.setHeader("Content-Type", "image/jpeg"); // Ajusta el tipo MIME según el tipo de archivo
      file.createReadStream().pipe(res);
  } catch (error) {
      console.error("Error obteniendo la imagen:", error);
      res.status(500).send("Error en el servidor");
  }
});


const axios = require('axios');

app.get('/proxy-image', async (req, res) => {
    try {
        const imageUrl = req.query.url;
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        res.set('Content-Type', 'image/jpeg');
        res.send(response.data);
    } catch (error) {
        res.status(500).send("Error al cargar la imagen");
    }
});


// Servir el archivo index.html en la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Rutas para obtener y modificar datos
app.get('/api/recojos', async (req, res) => {
  const snapshot = await db.collection('recojos').get();
  const recojos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(recojos);
});

app.get('/api/google-maps-key', (req, res) => {
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
});

app.get('/api/proveedores', async (req, res) => {
  try {
      // Obtener solo los usuarios cuyo rol sea "Proveedor"
      const snapshot = await db.collection('usuarios').where('rol', '==', 'Proveedor').get();

      if (snapshot.empty) {
          return res.status(404).json({ error: 'No se encontraron proveedores' });
      }

      // Mapear los documentos a un array de objetos con la información de cada proveedor
      const proveedores = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      }));

      res.json(proveedores); // Enviar la lista completa de proveedores

  } catch (error) {
      console.error('Error obteniendo los proveedores:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
  }
});




function generateUniqueId() {
  const now = new Date();
  const padToTwoDigits = (num) => num.toString().padStart(2, '0');

  const day = padToTwoDigits(now.getDate());
  const month = padToTwoDigits(now.getMonth() + 1);
  const year = now.getFullYear();
  const hours = padToTwoDigits(now.getHours());
  const minutes = padToTwoDigits(now.getMinutes());
  const seconds = padToTwoDigits(now.getSeconds());
  const randomId = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

  return `${day}-${month}-${year}-${hours}${minutes}${seconds}-${randomId}`;
}

// Función para validar y convertir fechas a Timestamp de Firebase
function convertirFechaFirebase(objeto, camposFecha) {
  camposFecha.forEach(campo => {
      if (objeto[campo]) {
          const fecha = new Date(objeto[campo]);
          if (!isNaN(fecha.getTime())) {
              objeto[campo] = admin.firestore.Timestamp.fromDate(fecha);
          } else {
              console.error(`Fecha inválida en el campo: ${campo}`, objeto[campo]);
              delete objeto[campo]; // Eliminar la fecha inválida para evitar errores
          }
      }
  });
}
  

app.post('/api/recojos', async (req, res) => {
  const nuevoRecojo = req.body;

  if (!nuevoRecojo || Object.keys(nuevoRecojo).length === 0) {
      return res.status(400).json({ error: 'Datos inválidos' });
  }

  try {
      // Convertir fechas a Timestamp si existen
      convertirFechaFirebase(nuevoRecojo, [
          'fechaCreacionPedido',
          'fechaEntregaPedido'
      ]);

      // Generar un ID único
      const uniqueId = generateUniqueId();
      nuevoRecojo.id = uniqueId;

      // Guardar en Firestore
      await db.collection('recojos').doc(uniqueId).set(nuevoRecojo);

      res.json({ message: 'Recojo guardado exitosamente', id: uniqueId });

  } catch (error) {
      console.error('Error al guardar el recojo:', error);
      res.status(500).json({ error: 'Error al guardar el recojo' });
  }
});


app.put('/api/recojos/:id', async (req, res) => {
  const { id } = req.params;
  const datosActualizados = req.body;

  if (!datosActualizados || Object.keys(datosActualizados).length === 0) {
      return res.status(400).json({ error: 'Datos inválidos' });
  }

  try {
      const recojoRef = db.collection('recojos').doc(id);
      const recojoDoc = await recojoRef.get();

      if (!recojoDoc.exists) {
          return res.status(404).json({ error: 'Recojo no encontrado' });
      }

      delete datosActualizados.fechaCreacionPedido;

      // Convertir fechas a Timestamp si existen
      convertirFechaFirebase(datosActualizados, [
          'fechaAnulacionPedido',
          'fechaEntregaPedidoMotorizado',

      ]);

      await recojoRef.update(datosActualizados);
      res.json({ id, message: 'Recojo actualizado exitosamente' });

  } catch (error) {
      console.error('Error al actualizar el recojo:', error);
      res.status(500).json({ error: 'Error al actualizar el recojo' });
  }
});
  
  

app.delete('/api/recojos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('recojos').doc(id).delete();
    res.json({ message: 'Recojo eliminado', id });
  } catch (error) {
    console.error('Error al eliminar el recojo:', error);
    res.status(500).json({ error: 'Error al eliminar el recojo' });
  }
});


app.get('/api/recojos/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const recojoDoc = await db.collection('recojos').doc(id).get();
  
      if (!recojoDoc.exists) {
        return res.status(404).json({ message: 'Recojo no encontrado' });
      }
  
      res.json({ id: recojoDoc.id, ...recojoDoc.data() });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el recojo', error });
    }
  });
  


// Servir el worker
app.get('/js/pdf-worker.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/assets/js', 'pdf-worker.js'), {
    headers: {
      'Content-Type': 'application/javascript'
    }
  });
});


const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
