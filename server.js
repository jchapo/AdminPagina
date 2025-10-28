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
    parameterLimit: 100000
}));

// Configurar CORS después de body-parser
app.use(cors());

// Cargar plantillas
const templatePath = path.join(__dirname, 'frontend/templates', 'email-template.hbs');
const templateContent = fs.readFileSync(templatePath, 'utf8');
const template = handlebars.compile(templateContent);

// Cargar estilos
const stylesPath = path.join(__dirname, 'frontend/templates', 'email-styles.css');
const styles = fs.readFileSync(stylesPath, 'utf8');

handlebars.registerPartial('email-styles', styles);

// Inicializar Firebase Admin SDK
const serviceAccount = require('./nanpi-courier-firebase.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "nanpi-courier.appspot.com"
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Middleware para verificar autenticación
const verifyAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autorización requerido' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;
        
        // Verificar rol del usuario
        const userDoc = await db.collection('usuarios').doc(uid).get();
        
        if (!userDoc.exists) {
            return res.status(403).json({ error: 'Usuario no encontrado' });
        }
        
        const userData = userDoc.data();
        const userRole = userData.rol;
        
        if (userRole !== 'Admin' && userRole !== 'Motorizado') {
            return res.status(403).json({ error: 'Permisos insuficientes' });
        }
        
        req.user = {
            uid: uid,
            role: userRole,
            email: decodedToken.email,
            ...userData
        };
        
        next();
    } catch (error) {
        console.error('Error verificando token:', error);
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// Configurar express para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'frontend')));

// Endpoint para login (página estática)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

// Servir el archivo index.html en la raíz (protegido)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Endpoint para verificar autenticación del cliente
app.get('/api/verify-auth', verifyAuth, (req, res) => {
    res.json({ 
        success: true, 
        user: {
            uid: req.user.uid,
            role: req.user.role,
            email: req.user.email,
            name: req.user.nombreEmpresa || req.user.nombre
        }
    });
});

// Rutas protegidas con autenticación
app.get('/api/recojos', verifyAuth, async (req, res) => {
    try {
        const snapshot = await db.collection('recojos').get();
        const recojos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(recojos);
    } catch (error) {
        console.error('Error obteniendo recojos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/google-maps-key', verifyAuth, (req, res) => {
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY, mapId: process.env.MAP_ID });
});

app.get('/api/proveedores', verifyAuth, async (req, res) => {
    try {
        const snapshot = await db.collection('usuarios').where('rol', '==', 'Proveedor').get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'No se encontraron proveedores' });
        }

        const proveedores = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(proveedores);

    } catch (error) {
        console.error('Error obteniendo los proveedores:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Función para generar ID único
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
                delete objeto[campo];
            }
        }
    });
}

app.post('/api/recojos', verifyAuth, async (req, res) => {
    const nuevoRecojo = req.body;

    if (!nuevoRecojo || Object.keys(nuevoRecojo).length === 0) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    try {
        convertirFechaFirebase(nuevoRecojo, [
            'fechaCreacionPedido',
            'fechaEntregaPedido'
        ]);

        const uniqueId = generateUniqueId();
        nuevoRecojo.id = uniqueId;
        nuevoRecojo.creadoPor = req.user.uid; // Agregar información del usuario que creó el registro

        await db.collection('recojos').doc(uniqueId).set(nuevoRecojo);

        res.json({ message: 'Recojo guardado exitosamente', id: uniqueId });

    } catch (error) {
        console.error('Error al guardar el recojo:', error);
        res.status(500).json({ error: 'Error al guardar el recojo' });
    }
});

app.put('/api/recojos/:id', verifyAuth, async (req, res) => {
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

        convertirFechaFirebase(datosActualizados, [
            'fechaAnulacionPedido',
            'fechaEntregaPedido'
        ]);

        datosActualizados.modificadoPor = req.user.uid; // Agregar información del usuario que modificó
        datosActualizados.fechaModificacion = admin.firestore.FieldValue.serverTimestamp();

        await recojoRef.update(datosActualizados);
        res.json({ id, message: 'Recojo actualizado exitosamente' });

    } catch (error) {
        console.error('Error al actualizar el recojo:', error);
        res.status(500).json({ error: 'Error al actualizar el recojo' });
    }
});

app.delete('/api/recojos/:id', verifyAuth, async (req, res) => {
    const { id } = req.params;
    try {
        // Solo los admins pueden eliminar registros
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Solo los administradores pueden eliminar registros' });
        }

        await db.collection('recojos').doc(id).delete();
        res.json({ message: 'Recojo eliminado', id });
    } catch (error) {
        console.error('Error al eliminar el recojo:', error);
        res.status(500).json({ error: 'Error al eliminar el recojo' });
    }
});

app.get('/api/recojos/:id', verifyAuth, async (req, res) => {
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

// Endpoint para obtener la imagen desde Firebase Storage (protegido)
app.get("/get-image", verifyAuth, async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).send("Falta la URL");

        const match = url.match(/\/o\/([^?]*)/);
        if (!match) return res.status(400).send("URL no válida");

        const filePath = decodeURIComponent(match[1]);

        const file = bucket.file(filePath);
        const [exists] = await file.exists();

        if (!exists) return res.status(404).send("Imagen no encontrada");

        res.setHeader("Content-Type", "image/jpeg");
        file.createReadStream().pipe(res);
    } catch (error) {
        console.error("Error obteniendo la imagen:", error);
        res.status(500).send("Error en el servidor");
    }
});

// Proxy para imágenes (protegido)
const axios = require('axios');

app.get('/proxy-image', verifyAuth, async (req, res) => {
    try {
        const imageUrl = req.query.url;
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        res.set('Content-Type', 'image/jpeg');
        res.send(response.data);
    } catch (error) {
        res.status(500).send("Error al cargar la imagen");
    }
});

// Endpoint para enviar email (protegido)
app.post('/api/send-email', verifyAuth, async (req, res) => {
    // Solo los admins pueden enviar emails
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden enviar emails' });
    }

    // ... resto del código del endpoint de email (mantenlo igual)
    // El código existente para enviar emails...
    
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
            logger: false, // Habilita logging interno
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

// Otros endpoints protegidos...
app.post('/api/proveedores', verifyAuth, async (req, res) => {
    // Solo los admins pueden crear proveedores
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden crear proveedores' });
    }

     try {
        const { phone, nombreEmpresa, email, rol = 'Proveedor' } = req.body;

        // Validaciones básicas
        if (!phone || !nombreEmpresa) {
            return res.status(400).json({ 
                success: false,
                status: 'validation_error',
                message: 'Teléfono y nombre son requeridos',
                data: null
            });
        }

        // Verificar si el proveedor ya existe usando el phone como ID
        const docRef = db.collection('usuarios').doc(phone);
        const docSnapshot = await docRef.get();

        if (docSnapshot.exists) {
            return res.status(409).json({ 
                success: false,
                status: 'already_exists',
                message: 'El proveedor ya existe',
                data: docSnapshot.data()
            });
        }

        // Crear nuevo proveedor
        const newProvider = {
            phone: phone,
            nombreEmpresa: nombreEmpresa,
            email: email,
            rol: rol
        };

        // Guardar en Firestore usando el phone como ID
        await docRef.set(newProvider);

        res.json({
            success: true,
            status: 'created',
            message: 'Proveedor registrado exitosamente',
            data: {
                id: phone,
                ...newProvider
            }
        });

    } catch (error) {
        console.error('Error registrando proveedor:', error);
        res.status(500).json({ 
            success: false,
            status: 'server_error',
            message: 'Error al registrar el proveedor',
            error: error.message || 'Error desconocido',
            data: null
        });
    }
});

app.post('/api/mover-a-historial', verifyAuth, async (req, res) => {
    // Solo los admins pueden mover al historial
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden mover documentos al historial' });
    }

    try {
      const documentos = req.body.documentos;
  
      if (!Array.isArray(documentos) || documentos.length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron documentos válidos' });
      }
  
      const batch = db.batch();
      let cantidadMovidos = 0;
  
      for (const doc of documentos) {
        const id = doc.id;
  
        // Verificamos si el documento realmente existe en 'recojos'
        const recojoRef = db.collection('recojos').doc(id);
        const recojoDoc = await recojoRef.get();
  
        if (recojoDoc.exists) {
          const data = recojoDoc.data();
  
          // Copiar a historial
          const historialRef = db.collection('historial').doc(id);
          batch.set(historialRef, data);
  
          // Eliminar de recojos
          batch.delete(recojoRef);
  
          cantidadMovidos++;
        } else {
          console.warn(`Documento con ID ${id} no encontrado en recojos`);
        }
      }
  
      await batch.commit();
  
      res.json({
        success: true,
        message: `${cantidadMovidos} documentos fueron movidos a historial exitosamente`,
        cantidadMovidos
      });
  
    } catch (error) {
      console.error('Error al mover los documentos a historial:', error);
      res.status(500).json({
        success: false,
        message: 'Error al mover documentos a historial',
        error: error.message
      });
    }

});

// Servir el worker (protegido)
app.get('/js/pdf-worker.js', verifyAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/assets/js', 'pdf-worker.js'), {
        headers: {
            'Content-Type': 'application/javascript'
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
