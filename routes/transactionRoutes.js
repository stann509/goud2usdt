const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const transactionController = require('../controllers/transactionController'); // <--- Import du cerveau

// ROUTE 1 : Créer une commande (Site Web)
router.post('/create', async (req, res) => {
    try {
        const { phone, amountHTG, amountUSDT, wallet } = req.body;
        const newTransaction = new Transaction({
            senderPhone: phone,
            amountHTG: amountHTG,
            amountUSDT: amountUSDT,
            walletAddress: wallet,
            status: 'PENDING'
        });
        const savedTransaction = await newTransaction.save();
        res.status(201).json({ message: "✅ Commande créée !", data: savedTransaction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ROUTE 2 : Recevoir le SMS (Android -> Serveur)
router.post('/webhook-sms', transactionController.handleIncomingSMS); // <--- La nouvelle route

// ROUTE 3 : Vérifier le statut d'une commande (Le site va l'appeler toutes les 5 sec)
router.get('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: "Non trouvé" });
        
        res.json({ 
            status: transaction.status, 
            txHash: transaction.cryptoTxHash 
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// ROUTE 4 : ADMIN - Voir toutes les transactions (Protégée par mot de passe)
router.get('/admin/all', async (req, res) => {
    try {
        // Sécurité simple : On vérifie si le mot de passe est bon
        const adminPassword = req.headers['x-admin-pass'];
        
        // REMPLACE '1234' PAR UN VRAI MOT DE PASSE COMPLIQUÉ PLUS TARD
        if (adminPassword !== 'PoufeBiznis509$$') {
            return res.status(403).json({ message: "Accès interdit ! Mauvais mot de passe." });
        }

        // On récupère tout, trié du plus récent au plus vieux
        const transactions = await Transaction.find().sort({ createdAt: -1 });
        
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;