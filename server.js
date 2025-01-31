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
  databaseURL: "https://<tu-proyecto>.firebaseio.com"
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

  

app.post('/api/recojos', async (req, res) => {
  const nuevoRecojo = req.body;

  // Validate and convert fechaCreacionPedido
  if (nuevoRecojo.fechaCreacionPedido) {
    const fechaCreacionLocal = new Date(nuevoRecojo.fechaCreacionPedido);
    if (!isNaN(fechaCreacionLocal.getTime())) { // Check if the date is valid
      nuevoRecojo.fechaCreacionPedido = admin.firestore.Timestamp.fromDate(fechaCreacionLocal);
    } else {
      console.error('Invalid fechaCreacionPedido:', nuevoRecojo.fechaCreacionPedido);
      return res.status(400).json({ error: 'Invalid fechaCreacionPedido' });
    }
  }

  // Validate and convert fechaEntregaPedido
  if (nuevoRecojo.fechaEntregaPedido) {
    const fechaEntregaLocal = new Date(nuevoRecojo.fechaEntregaPedido);
    if (!isNaN(fechaEntregaLocal.getTime())) { // Check if the date is valid
      fechaEntregaLocal.setHours(fechaEntregaLocal.getHours() + 5);
      nuevoRecojo.fechaEntregaPedido = admin.firestore.Timestamp.fromDate(fechaEntregaLocal);
    } else {
      console.error('Invalid fechaEntregaPedido:', nuevoRecojo.fechaEntregaPedido);
      return res.status(400).json({ error: 'Invalid fechaEntregaPedido' });
    }
  }

  // Generate a unique ID
  const uniqueId = generateUniqueId();
  console.log('Generated Unique ID:', uniqueId); // Verificación

  // Assign the unique ID to the recojo
  const recojoConId = { 
    ...nuevoRecojo, 
    id: uniqueId 
  };

  // Add the new recojo with the manually generated ID
  await db.collection('recojos').doc(uniqueId).set(recojoConId);

  res.json({ id: uniqueId });
});


app.put('/api/recojos/:id', async (req, res) => {
  const { id } = req.params;
  const datosActualizados = req.body;

  try {
      // Obtener el documento existente de Firestore
      const recojoRef = db.collection('recojos').doc(id);
      const recojoDoc = await recojoRef.get();

      if (!recojoDoc.exists) {
          return res.status(404).json({ error: 'Recojo no encontrado' });
      }

      // Mantener el valor original de fechaCreacionPedido
      datosActualizados.fechaCreacionPedido = recojoDoc.data().fechaCreacionPedido;

      // Convertir fechaEntregaPedido a Timestamp si está presente
      if (datosActualizados.fechaEntregaPedido) {
          const fechaEntregaLocal = new Date(datosActualizados.fechaEntregaPedido);
          if (!isNaN(fechaEntregaLocal.getTime())) { // Verificar si la fecha es válida
              fechaEntregaLocal.setHours(fechaEntregaLocal.getHours() + 5); // Ajustar zona horaria
              datosActualizados.fechaEntregaPedido = admin.firestore.Timestamp.fromDate(fechaEntregaLocal);
          } else {
              console.error('Invalid fechaEntregaPedido:', datosActualizados.fechaEntregaPedido);
              return res.status(400).json({ error: 'Invalid fechaEntregaPedido' });
          }
      }

      // Actualizar el documento en Firestore
      await recojoRef.update(datosActualizados);

      res.json({ id });
  } catch (error) {
      console.error('Error al actualizar el recojo:', error);
      res.status(500).json({ error: 'Error al actualizar el recojo' });
  }
});
  
  

app.delete('/api/recojos/:id', async (req, res) => {
  const { id } = req.params;
  await db.collection('recojos').doc(id).delete();
  res.json({ id });
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
