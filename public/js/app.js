// Configuration
const API_URL = '/api/transactions';
const EXCHANGE_RATE = 145; // Nouveau Taux
const SERVICE_FEE = 50;    // Frais de service en Gourdes

// On récupère les éléments de la page
const inputHTG = document.getElementById('amountHTG');
const displayUSDT = document.getElementById('displayUSDT');
const form = document.getElementById('orderForm');
const statusBox = document.getElementById('statusBox');
const statusMessage = document.getElementById('statusMessage');

// Mise à jour visuelle du taux sur la page (si l'élément existe)
const rateDisplay = document.getElementById('rate');
if(rateDisplay) rateDisplay.innerText = EXCHANGE_RATE;

// --- 1. CALCULATRICE AUTOMATIQUE (Avec Frais) ---
inputHTG.addEventListener('input', (e) => {
    const totalHTG = parseFloat(e.target.value);
    
    // On retire les frais pour calculer la crypto
    // Ex: Client met 1500. On enlève 50 de frais = 1450 pour la crypto.
    const netAmount = totalHTG - SERVICE_FEE;

    if (isNaN(totalHTG) || netAmount <= 0) {
        displayUSDT.innerText = "0.00 USDT";
        displayUSDT.style.color = "white";
        // Petit message pour dire que c'est trop bas
        if(totalHTG > 0) {
             displayUSDT.innerHTML += `<br><small style='font-size:0.6em; color:#aaa'>Minimum ${SERVICE_FEE + 10} Gdes</small>`;
        }
    } else {
        // Formule : (Total - Frais) / Taux
        const usdt = (netAmount / EXCHANGE_RATE).toFixed(2); 
        
        displayUSDT.innerText = `${usdt} USDT`;
        displayUSDT.style.color = "#22c55e"; // Vert
        
        // On affiche les frais pour être transparent
        displayUSDT.innerHTML += `<br><small style='font-size:0.6em; color:#aaa'>Inclus ${SERVICE_FEE} Gdes de frais</small>`;
    }
});

// --- 2. ENVOI DE LA COMMANDE ---
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Empêche la page de se recharger

    const phone = document.getElementById('phone').value;
    const amount = parseFloat(inputHTG.value); // Montant TOTAL (celui du SMS)
    const wallet = document.getElementById('wallet').value;

    // Calcul du montant USDT réel qu'il va recevoir
    const estimatedUSDT = (amount - SERVICE_FEE) / EXCHANGE_RATE;

    if (estimatedUSDT <= 0) {
        alert("Le montant est trop faible pour couvrir les frais de service de 50 Gdes !");
        return;
    }

    // On change le bouton pour dire "Chargement..."
    const btn = document.querySelector('.btn-main');
    btn.innerText = "Création de la commande...";
    btn.disabled = true;

    try {
        // On envoie les données au serveur
        const response = await fetch(`${API_URL}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: phone,
                amountHTG: amount,      // Important: On envoie le montant TOTAL pour le matching SMS
                amountUSDT: estimatedUSDT, // On envoie le montant NET à recevoir en crypto
                wallet: wallet
            })
        });

        const result = await response.json();

        if (response.ok) {
            // SUCCÈS !
            showStatusScreen(result.data._id, phone, amount);
        } else {
            alert("Erreur : " + result.error);
            btn.innerText = "Lancer l'échange 🚀";
            btn.disabled = false;
        }

    } catch (error) {
        alert("Impossible de contacter le serveur.");
        console.error(error);
        btn.innerText = "Lancer l'échange 🚀";
        btn.disabled = false;
    }
});

// --- 3. ÉCRAN DE STATUT & SURVEILLANCE ---
function showStatusScreen(orderId, phone, amount) {
    // On cache le formulaire et on montre le statut
    document.querySelector('.card').style.display = 'none';
    statusBox.classList.remove('hidden');

    // On met à jour le message
    statusMessage.innerHTML = `
        Envoyez exactement <strong>${amount} HTG</strong><br>
        MonCash au : <span style="color:#22c55e; font-size:1.2em">3700-0000</span><br>
        <small>Ne fermez pas cette page, ça va se valider tout seul.</small>
    `;

    // On lance la surveillance (Polling) toutes les 3 secondes
    const interval = setInterval(async () => {
        const isFinished = await checkStatus(orderId);
        if (isFinished) {
            clearInterval(interval); // On arrête de vérifier quand c'est fini
        }
    }, 3000);
}

// Fonction qui demande au serveur "C'est payé ?"
async function checkStatus(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`);
        const data = await res.json();

        // Mise à jour des étapes visuelles
        if (data.status === 'PAID' || data.status === 'COMPLETED') {
            document.getElementById('step2').classList.add('active');
            statusMessage.innerText = "Paiement reçu ! Envoi des crypto en cours...";
        }

        if (data.status === 'COMPLETED') {
            document.getElementById('step3').classList.add('active');
            statusMessage.innerHTML = `
                🎉 SUCCÈS ! USDT ENVOYÉS.<br>
                Hash: <a href="https://tronscan.org/#/transaction/${data.txHash}" target="_blank" style="color:#22c55e">Voir sur TronScan</a>
            `;
            return true; // C'est fini
        }

    } catch (err) {
        console.log("Erreur check status", err);
    }
    return false; // Pas encore fini
}