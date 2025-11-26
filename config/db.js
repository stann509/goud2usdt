const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // On essaie de se connecter avec le lien secret
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`-------------------------------------------`);
        console.log(`✅ MONGODB CONNECTÉ : ${conn.connection.host}`);
        console.log(`-------------------------------------------`);
    } catch (error) {
        // Si ça échoue, on affiche l'erreur et on coupe tout
        console.error(`❌ ERREUR DE CONNEXION : ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;