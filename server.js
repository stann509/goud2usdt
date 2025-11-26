require('dotenv').config();
const connectDB = require('./config/db'); // <--- AJOUTÉ
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Connexion à la Base de Données
connectDB(); // <--- AJOUTÉ

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARES ---
app.use(cors()); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 

// --- FICHIERS STATIQUES (Le Site Web) ---
app.use(express.static('public')); // <--- AJOUTE CETTE LIGNE

// --- ROUTE DE BASE ---
app.get('/', (req, res) => {
    res.send({
        message: "🚀 API Goud2USDT est en ligne",
        status: "OK",
        time: new Date()
    });
});

// --- IMPORTATION DES ROUTES ---
const transactionRoutes = require('./routes/transactionRoutes');
app.use('/api/transactions', transactionRoutes);

// --- DÉMARRAGE ---
app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`✅ LE SERVEUR TOURNE SUR LE PORT ${PORT}`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log(`-------------------------------------------`);
});