const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    // Le numéro MonCash qui envoie l'argent
    senderPhone: {
        type: String,
        required: true,
        trim: true
    },
    // Combien de Gourdes le client paie
    amountHTG: {
        type: Number,
        required: true
    },
    // Combien d'USDT il va recevoir
    amountUSDT: {
        type: Number,
        required: true
    },
    // Son adresse Tron (TRC20) où on envoie les sous
    walletAddress: {
        type: String,
        required: true,
        trim: true
    },
    // L'état de la commande
    // PENDING = En attente du paiement MonCash
    // PAID = Paiement reçu, en attente d'envoi crypto
    // COMPLETED = Crypto envoyée, tout est fini
    status: {
        type: String,
        enum: ['PENDING', 'PAID', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
    },
    // L'ID unique de la transaction MonCash (pour éviter les doublons)
    // On le remplit seulement quand le SMS arrive
    moncashTransactionId: {
        type: String,
        unique: true, 
        sparse: true // Permet d'avoir ce champ vide au début
    },
    // Date de création automatique
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Transaction', TransactionSchema);