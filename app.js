const express = require('express');
const admin = require('firebase-admin');
const saltedMd5 = require('salted-md5');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { auth } = require('express-oauth2-jwt-bearer');
const path = require('path');
const compression = require('compression');

const serviceAccount = require('./key/lnco-artifacts-firebase-adminsdk-llblk-d3308ac0f5.json');
const app = express();

// Initialize Firebase with the service account key
const firebaseConfig = {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://lnco-artifacts.firebaseio.com/',
    projectId: 'lnco-artifacts',
    storageBucket: 'lnco-artifacts.appspot.com',
};

const jwtCheck = auth({
    audience: '"https://auth.lnco.in/"',
    issuerBaseURL: 'https://lnco.eu.auth0.com/',
    tokenSigningAlg: 'RS256',
});

admin.initializeApp(firebaseConfig);
app.locals.bucket = admin.storage().bucket();

app.use(express.urlencoded());
app.use(express.json());
app.set('views', path.join(__dirname, 'static', 'views'));
app.set('view engine', 'ejs');
app.use(compression());
app.use('/public', express.static(path.join(__dirname, 'static', 'public')));
  console.log(jwtCheck)
app.use(jwtCheck);

const firestore = admin.firestore();

// Endpoint to add a new document to Firestore
app.post('/publish', publishHandler);

// Endpoint to handle file uploads
app.post('/upload', upload.single('file'), uploadHandler);

// Endpoint to retrieve data from Firestore
app.get('/view', viewHandler);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Handler for '/publish' endpoint
async function publishHandler(req, res) {
    try {
        const db = admin.firestore();
        const collectionRef = db.collection('artifacts');
        const jsonData = req.body;
        const docRef = await collectionRef.add(jsonData);
        console.log('Document written with ID: ', docRef.id);
        return res.status(201).json({ message: 'Data stored successfully', documentId: docRef.id });
    } catch (error) {
        console.error('Error storing data:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Handler for '/upload' endpoint
async function uploadHandler(req, res) {
    const name = saltedMd5(req.file.originalname, 'SUPER-S@LT!');
    const fileName = name + path.extname(req.file.originalname);
    const fileStream = await app.locals.bucket.file(fileName).createWriteStream({
        metadata: {
            contentType: req.file.mimetype,
            cacheControl: 'public, max-age=31536000',
        },
        predefinedAcl: 'publicRead',
    });

    fileStream.on('error', (error) => {
        console.error('Error uploading file:', error);
        return res.status(500).json({ error: 'Internal server error' });
    });

    fileStream.on('finish', () => {
        const imageUrl = `https://storage.googleapis.com/${app.locals.bucket.name}/${fileName}`;
        return res.status(201).json({ message: 'Image uploaded successfully', imageUrl });
    });

    fileStream.end(req.file.buffer);
}

// Handler for '/view' endpoint
async function viewHandler(req, res) {
    try {
        const snapshot = await firestore.collection('artifacts').get();
        const readData = [];
        snapshot.forEach((doc) => {
            readData.push(doc.data());
        });
        res.json(readData);
    } catch (error) {
        res.status(500).send('Error reading data: ' + error.message);
    }
}
