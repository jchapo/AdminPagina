const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configurar express para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'frontend')));  // Sirve todo lo que está en la carpeta 'frontend'

// Inicializar Firebase Admin SDK
const serviceAccount = require('./nanpi-courier-firebase.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();


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
          'fechaEntregaPedidoMotorizado',
          'fechaCreacionPedido',
          'fechaAnulacionPedido',
          'fechaRecojoPedidoMotorizado',
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

      // Convertir fechas a Timestamp si existen
      convertirFechaFirebase(datosActualizados, [
          'fechaEntregaPedidoMotorizado',
          'fechaCreacionPedido',
          'fechaAnulacionPedido',
          'fechaRecojoPedidoMotorizado',
          'fechaEntregaPedido'
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
  

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
