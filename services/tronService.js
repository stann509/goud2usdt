// CORRECTION : On gère la nouvelle version de TronWeb
const TronWebLib = require('tronweb');
// Si TronWebLib contient une propriété .TronWeb, on l'utilise, sinon on utilise l'objet direct
const TronWeb = TronWebLib.TronWeb || TronWebLib;

require('dotenv').config();

// Configuration du réseau TRON
// Note : Si tu n'as pas d'API Key, TronWeb peut être lent ou limiter les requêtes, 
// mais pour le test ça ira.
const tronWeb = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io',
    headers: { "TRON-PRO-API-KEY": process.env.TRON_API_KEY || '' },
    privateKey: process.env.TRON_PRIVATE_KEY
});

const USDT_CONTRACT = process.env.USDT_CONTRACT;

// --- FONCTION : ENVOYER USDT ---
exports.sendUSDT = async (receiverAddress, amount) => {
    try {
        console.log(`⚙️ Démarrage du transfert de ${amount} USDT vers ${receiverAddress}...`);

        // 1. Se connecter au contrat USDT
        const contract = await tronWeb.contract().at(USDT_CONTRACT);

        // 2. Convertir le montant (USDT a 6 décimales)
        const amountInSun = Math.floor(amount * 1000000); // Math.floor pour éviter les virgules bizarres

        // 3. Lancer la transaction
        const transactionID = await contract.methods.transfer(
            receiverAddress, 
            amountInSun
        ).send();

        console.log(`✅ TRANSACTION RÉUSSIE ! Hash: ${transactionID}`);
        return transactionID;

    } catch (error) {
        console.error("❌ ÉCHEC DU TRANSFERT CRYPTO :", error);
        // On relance l'erreur pour que le Controller sache que ça a échoué
        throw new Error(error.message || "Erreur Blockchain");
    }
};

// --- FONCTION DE TEST (Solde) ---
exports.checkMyBalance = async () => {
    try {
        // TronWeb v6 gère l'adresse différemment parfois, on sécurise
        const myAddress = tronWeb.address.fromPrivateKey(process.env.TRON_PRIVATE_KEY);
        console.log(`🔍 Mon adresse dérivée : ${myAddress}`);
        
        const contract = await tronWeb.contract().at(USDT_CONTRACT);
        const balance = await contract.methods.balanceOf(myAddress).call();
        console.log(`💰 MON SOLDE ACTUEL : ${balance / 1000000} USDT`);
    } catch (error) {
        console.log("Impossible de lire le solde :", error.message);
    }
};