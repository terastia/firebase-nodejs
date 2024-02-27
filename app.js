const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./key/lnco-artifacts-firebase-adminsdk-llblk-d3308ac0f5.json');

const app = express();

// Initialize Firebase with the service account key
const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://lnco-artifacts.firebaseio.com/',
};

admin.initializeApp(firebaseConfig);
const database = admin.database();

// Example data to save
const newData = {
  key1: 'value1',
  key2: 'value2',
};

// Route to save data to Firebase
app.get('/saveData', (req, res) => {
  // Save data to a specific node
  database.ref('/your/node/path').set(newData)
    .then(() => {
      res.send('Data saved successfully');
    })
    .catch((error) => {
      res.status(500).send('Error saving data: ' + error);
    });
});

// Route to read data from Firebase
app.get('/readData', (req, res) => {
  // Read data once from a specific node
  database.ref('/your/node/path').once('value')
    .then((snapshot) => {
      const readData = snapshot.val();
      res.json(readData);
    })
    .catch((error) => {
      res.status(500).send('Error reading data: ' + error);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
