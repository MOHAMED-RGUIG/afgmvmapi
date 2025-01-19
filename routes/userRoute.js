const express = require('express');
const router = express.Router();
const {sql, poolPromise} = require('../db');
const { pool1 } = require('../db');

/*
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if a user with the provided email already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            // User already exists with the same email
            return res.status(400).send('User already registered with this email');
        }else{
                 const newUser = new User({ name, email, password });
        await newUser.save();

        res.status(201).send('User registered successfully');    
        }

        // Create a new user
   
    } catch (error) {
        // Handle any errors
        res.status(500).json({ message: 'Internal server error' });
    }
});
*/
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Reçu du client :', { email, password }); // Log des données reçues

    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    try {
        const [rows] = await pool1.query(
            'SELECT * FROM rguig_inventaire_afg.USERS WHERE EMAILUSR = ? AND MotDePasse = ?',
            [email, password]
        );

        if (rows.length > 0) {
            const user = rows[0];
            const currentUser = {
                EMAILUSR: user.EMAILUSR,
                idUser: user.idUser,
                NOMUSR: user.NOMUSR,
                TELEP: user.TELEP,
                TYPUSR:user.TYPUSR
            };
            return res.json(currentUser);
        } else {
            return res.status(400).json({ message: 'Nom d’utilisateur ou mot de passe incorrect' });
        }
    } catch (error) {
        console.error('Erreur pendant la connexion :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur', error: error.message });
    }
});

module.exports = router;