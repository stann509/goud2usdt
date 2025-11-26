const Transaction = require('../models/Transaction');
const tronService = require('../services/tronService');

// --- ROBOT 1 : EXTRAIRE LE MONTANT ---
function extraireMontant(message) {
    // Cherche un nombre suivi de HTG (ex: "100 HTG")
    const regex = /(\d+)\s*(HTG|Gourdes|Gdes)/i;
    const resultat = message.match(regex);
    if (resultat && resultat[1]) {
        return parseInt(resultat[1]);
    }
    return null;
}

// --- ROBOT 2 : EXTRAIRE LE NUMÉRO DU CLIENT (Nouveau !) ---
function extraireNumeroClient(message) {
    // Cherche "de" suivi de 8 chiffres (avec ou sans 509 devant)
    // Ex: "de 37123456" ou "de 50937123456"
    const regexPhone = /(?:de|from)\s*(?:\+?509)?(\d{8})/i; 
    const match = message.match(regexPhone);
    
    if (match && match[1]) {
        console.log(`🕵️ Numéro trouvé dans le SMS : ${match[1]}`);
        return match[1]; // Retourne juste les 8 chiffres (ex: 37123456)
    }
    return null;
}

// --- LA FONCTION PRINCIPALE ---
exports.handleIncomingSMS = async (req, res) => {
    try {
        console.log("📩 SMS REÇU DU TÉLÉPHONE ANDROID...");
        console.log("📦 CONTENU JSON :", JSON.stringify(req.body, null, 2));

        const rawMessage = req.body.message_content || req.body.msg || req.body.text || "";
        const transaction_id = req.body.transaction_id || Date.now().toString();

        console.log(`📜 Texte à analyser : "${rawMessage}"`);

        // 1. Analyse intelligente
        const amount = extraireMontant(rawMessage);
        const clientPhoneInText = extraireNumeroClient(rawMessage); // On cherche le numéro

        if (!amount) {
            console.log("⚠️ Ignoré : Montant illisible.");
            return res.status(400).json({ message: "Montant illisible" });
        }

        console.log(`💰 Montant: ${amount} HTG | 📱 Client présumé: ${clientPhoneInText || "Non trouvé"}`);

        // 2. Construction du Filtre de Recherche
        const criteres = {
            amountHTG: amount,
            status: 'PENDING'
        };

        // SÉCURITÉ MAXIMALE :
        // Si on a réussi à lire le numéro dans le SMS, on oblige la commande à avoir le même numéro !
        if (clientPhoneInText) {
            criteres.senderPhone = clientPhoneInText;
        } else {
            console.log("⚠️ Attention : Numéro non détecté dans le texte. Validation basée sur le montant uniquement.");
        }

        // 3. Recherche de la commande
        const foundTransaction = await Transaction.findOne(criteres);

        if (!foundTransaction) {
            console.log(`❌ AUCUNE COMMANDE TROUVÉE (Montant: ${amount}, Tel: ${clientPhoneInText})`);
            return res.status(404).json({ message: "Paiement orphelin ou Numéro incorrect" });
        }

        // 4. Succès
        console.log(`✅ MATCH PARFAIT ! Commande trouvée (ID: ${foundTransaction._id})`);

        foundTransaction.status = 'PAID'; 
        foundTransaction.moncashTransactionId = transaction_id;
        await foundTransaction.save();

        console.log("💰 STATUT -> PAID. Lancement Crypto...");

        try {
            const txHash = await tronService.sendUSDT(foundTransaction.walletAddress, foundTransaction.amountUSDT);
            foundTransaction.status = 'COMPLETED';
            foundTransaction.cryptoTxHash = txHash;
            await foundTransaction.save();
            console.log("🚀 CRYPTO ENVOYÉE !");
            return res.status(200).json({ message: "Succès total" });
        } catch (cryptoError) {
            console.error("⚠️ Erreur Crypto (Normal en test):", cryptoError.message);
            return res.status(200).json({ message: "Paiement validé, Crypto bloquée" });
        }

    } catch (error) {
        console.error("Erreur serveur:", error);
        res.status(500).send("Erreur interne");
    }
};