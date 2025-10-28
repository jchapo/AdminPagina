require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

// Cargar tus credenciales igual que en server.js
const serviceAccount = require(path.join(__dirname, '../nanpi-courier-firebase.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function inferSchema(collectionPath) {
  const snapshot = await db.collection(collectionPath).get();
  const schema = {};

  snapshot.forEach((doc) => {
    const data = doc.data();
    for (const [key, value] of Object.entries(data)) {
      const type = Array.isArray(value)
        ? "array"
        : value instanceof admin.firestore.Timestamp
        ? "timestamp"
        : value === null
        ? "null"
        : typeof value;

      schema[key] = schema[key] || new Set();
      schema[key].add(type);
    }
  });

  // Convertir los Sets a arrays legibles
  const result = {};
  for (const [key, types] of Object.entries(schema)) {
    result[key] = [...types];
  }

  console.log(`📘 Esquema de ${collectionPath}:`);
  console.log(JSON.stringify(result, null, 2));
}

// Leer el nombre de la colección desde los argumentos
const collection = process.argv[2];
if (!collection) {
  console.error("⚠️  Usa: node scripts/inferSchema.js <nombre_coleccion>");
  process.exit(1);
}

inferSchema(collection).then(() => process.exit(0));
