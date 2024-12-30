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
    
    // Obtener los componentes de la fecha y hora
    const day = String(now.getDate()).padStart(2, '0'); // Día con dos dígitos
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Mes con dos dígitos
    const year = now.getFullYear(); // Año
    const hours = String(now.getHours()).padStart(2, '0'); // Hora con dos dígitos
    const minutes = String(now.getMinutes()).padStart(2, '0'); // Minutos con dos dígitos
    const seconds = String(now.getSeconds()).padStart(2, '0'); // Segundos con dos dígitos
  
    // Formatear el ID en el formato DD-MM-YYYY-HHMMSS
    return `${day}-${month}-${year}-${hours}${minutes}${seconds}`;
}
  

app.post('/api/recojos', async (req, res) => {
  const nuevoRecojo = req.body;

    if (nuevoRecojo.fechaCreacionPedido) {
    const fechaCreacionLocal = new Date(nuevoRecojo.fechaCreacionPedido);
    const fechaEntregaLocal = new Date(nuevoRecojo.fechaEntregaPedido);  
    // console.log("Fecha de Entrega Pedido (local):", fechaEntregaLocal);
    fechaEntregaLocal.setHours(fechaEntregaLocal.getHours() + 5);
    // console.log("Fecha de Entrega Pedido (ajustada sumando 5 horas):", fechaEntregaLocal);
    nuevoRecojo.fechaCreacionPedido = admin.firestore.Timestamp.fromDate(fechaCreacionLocal);
    nuevoRecojo.fechaEntregaPedido = admin.firestore.Timestamp.fromDate(fechaEntregaLocal);
    }

  // Generar un ID único usando la función generateUniqueId
  const uniqueId = generateUniqueId();

  // Asignar el ID único al recojo
  const recojoConId = { 
    ...nuevoRecojo, 
    id: uniqueId 
  };

  // Agregar el nuevo recojo con el ID generado manualmente
  const ref = await db.collection('recojos').doc(uniqueId).set(recojoConId);

  res.json({ id: uniqueId });
});


app.put('/api/recojos/:id', async (req, res) => {
    const { id } = req.params;
    const datosActualizados = req.body;

    if (datosActualizados.fechaEntregaPedido) {
        // Convertir la fecha del picker (cadena) a un objeto Date
        const fechaEntregaLocal = new Date(datosActualizados.fechaEntregaPedido); // Fecha seleccionada
        // console.log("Fecha de Entrega Pedido (local):", fechaEntregaLocal);
        
        // Ajustar la hora sumando 5 horas (por la diferencia de zona horaria)
        fechaEntregaLocal.setHours(fechaEntregaLocal.getHours() + 5);
        
        // console.log("Fecha de Entrega Pedido (ajustada sumando 5 horas):", fechaEntregaLocal);

        // Convertir la fecha ajustada a un Timestamp de Firebase
        datosActualizados.fechaEntregaPedido = admin.firestore.Timestamp.fromDate(fechaEntregaLocal);
    }

    // Actualizar en Firestore
    await db.collection('recojos').doc(id).update(datosActualizados);
    res.json({ id });
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
