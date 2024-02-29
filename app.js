const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./key/lnco-artifacts-firebase-adminsdk-llblk-d3308ac0f5.json');

const app = express();

// Initialize Firebase with the service account key
const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://lnco-artifacts.firebaseio.com/',
  projectId: 'lnco-artifacts',
};

admin.initializeApp(firebaseConfig);
const firestore = admin.firestore();
app.use(express.json());
  
app.post('/publish', async (req, res) => {
try {
    const db = admin.firestore();
    const collectionRef = db.collection('artifacts'); // replace with your desired collection name

    const jsonData = req.body;
    console.log(jsonData)

    // Add a new document to the specified collection
    const docRef = await collectionRef.add(jsonData);

    console.log('Document written with ID: ', docRef.id);

    return res.status(201).json({ message: 'Data stored successfully', documentId: docRef.id });
} catch (error) {
    console.error('Error storing data:', error);
    return res.status(500).json({ error: 'Internal server error' });
}
});
  

// Route to read data from Firestore
app.get('/view', async (req, res) => {
  try {
    // Read data from Firestore collection
    const snapshot = await firestore.collection('artifacts').get();
    const readData = [];
    snapshot.forEach((doc) => {
      readData.push(doc.data());
    });
    res.json(readData);
  } catch (error) {
    res.status(500).send('Error reading data: ' + error.message);
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});