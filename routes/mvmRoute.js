const express = require("express");
const router = express.Router();
const { pool1 } = require('../db'); 
/*
router.get('/getallmouvements', async (req, res) => {
    let connection;
    try {
        connection = await pool1.getConnection();
        const [rows] = await connection.query(`SELECT * FROM mouvement ORDER BY mvmDate DESC`);

        console.log('Fetched mouvements:', rows); // ✅ Check if rows have data
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error getting mouvement:', error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});*/
router.get('/getallmouvements', async (req, res) => {
    let connection;
    try {
        connection = await pool1.getConnection();

        // JOIN the tables to get NOMUSR instead of idUsr
        const [rows] = await connection.query(`
            SELECT rguig_inventaire_afg.mouvement.*, rguig_inventaire_afg.users.NOMUSR 
            FROM rguig_inventaire_afg.mouvement 
            JOIN rguig_inventaire_afg.users ON rguig_inventaire_afg.mouvement.idUsr = users.idUser
            ORDER BY mvmDate DESC
        `);

        console.log('Fetched mouvements with NOMUSR:', rows); // ✅ Check if rows have data
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error getting mouvement:', error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

router.get('/getallmouvementsgraphique', async (req, res) => {
    const { reference } = req.query; // Récupérer la référence depuis les paramètres
    let connection;

    try {
        connection = await pool1.getConnection();

        // Construire la requête SQL avec ou sans filtre
        const query = reference
            ? `
                SELECT *
                FROM rguig_inventaire_afg.mouvement 
              
                WHERE rguig_inventaire_afg.mouvement.referenceArticle = ?
                ORDER BY mvmDate DESC
            `
            : `
                SELECT*
                FROM rguig_inventaire_afg.mouvement 
             
                ORDER BY mvmDate DESC
            `;

        const [rows] = reference
            ? await connection.query(query, [reference]) // Utiliser la référence si présente
            : await connection.query(query);

        console.log('Fetched mouvements:', rows);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error getting mouvement:', error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});


router.post('/creationMvm', async (req, res) => {
    let connection;
    try {
        const { typeMvm, quantityMvm, referenceArticle, nOrdre, currentUser } = req.body;

        // Validate required fields
        if (!typeMvm || !quantityMvm || !referenceArticle || !nOrdre || !currentUser) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get a connection from the pool
        connection = await pool1.getConnection();

        // Vérifie si l'article existe et récupère la quantité actuelle
        const [article] = await connection.query(
            `SELECT quantitySt FROM rguig_inventaire_afg.articles WHERE reference = ?`,
            [referenceArticle]
        );
        

        if (!article || article.length === 0) {
            return res.status(404).json({ message: "L'article spécifié n'existe pas." });
        }

        const quantitySt = article[0].quantitySt;

        // Vérification de la quantité
        if (typeMvm === 'Sortie' && quantityMvm > quantitySt) {
            return res.status(400).json({
                message: 'Veuillez saisir une quantité égale ou inférieure à la quantité disponible.',
                availableQuantity: quantitySt
            });
        }

        // Calcul des quantités pour le mouvement
        let quantityEntree = 0;
        let quantitySortie = 0;

        if (typeMvm === 'Entree') {
            quantityEntree = quantityMvm;
        } else {
            quantitySortie = quantityMvm;
        }

        // Insérer le mouvement dans la table `mouvement`
        const insertQuery = `
            INSERT INTO rguig_inventaire_afg.mouvement 
            (mvmDate, typeMvm, quantityMvm, referenceArticle, nOrdre, quantityEntree, quantitySortie, idUsr)
            VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(insertQuery, [
            typeMvm, quantityMvm, referenceArticle, nOrdre, quantityEntree, quantitySortie, currentUser.idUser
        ]);

        // Mise à jour de la quantité dans la table `articles`
        let newQuantitySt;
        const quantityStNumber = Number(quantitySt); // Convertir quantitySt en nombre
        const quantityMvmNumber = Number(quantityMvm); // Convertir quantityMvm en nombre
        
        if (typeMvm === 'Entree') {
            newQuantitySt = quantityStNumber + quantityMvmNumber; // Additionner comme des nombres
        } else {
            newQuantitySt = quantityStNumber - quantityMvmNumber; // Soustraire comme des nombres
        }
        await connection.query(
            `UPDATE rguig_inventaire_afg.articles SET quantitySt = ? WHERE reference = ?`,
            [newQuantitySt, referenceArticle]
        );

        res.status(201).json({
            message: 'Mouvement enregistré avec succès.',
            newQuantitySt
        });
    } catch (error) {
        console.error('Error placing Mvm:', error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    } finally {
        // Ensure the connection is released
        if (connection) connection.release();
    }
});





router.get('/getRefMvm', async (req, res) => {
    let connection;
    try {
        // Obtenir une connexion depuis le pool
        connection = await pool1.getConnection();

        // Exécuter la requête pour récupérer les articles
        const [rows] = await connection.query(`
            SELECT reference,title FROM rguig_inventaire_afg.articles
        `);
        console.log('Données récupérées:', rows);
        // Retourner les données dans la réponse
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error getting reference:', error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    } finally {
        // Libérer la connexion pour éviter les fuites
        if (connection) connection.release();
    }
});

router.get('/qtstbyref', async (req, res) => {
    let connection;
    try {
        const { reference } = req.query; // Récupérer la référence depuis les paramètres
        connection = await pool1.getConnection();

        // Requête SQL pour récupérer la quantité en stock
        const query = `
            SELECT quantitySt 
            FROM rguig_inventaire_afg.articles
            WHERE reference LIKE ?
        `;
        const [rows] = await connection.query(query, [`${reference}%`]);

        res.status(200).json(rows); // Retourner les données au frontend
    } catch (error) {
        console.error('Error getting data:', error);
        res.status(400).json({ message: 'Something went wrong', error: error.message });
    } finally {
        if (connection) connection.release(); // Libérer la connexion
    }
});


router.delete('/deletemouvement/:id', async (req, res) => {
    const { id } = req.params; // Récupère l'identifiant de l'article à supprimer
  
    let connection;
    try {
      connection = await pool1.getConnection();
  
      // Vérification de l'existence de l'article
      const [rows] = await connection.query(
        'SELECT idMvm FROM rguig_inventaire_afg.mouvement WHERE idMvm = ?',
        [id]
      );
  
      if (rows.length === 0) {
        return res.status(404).json({ message: "Le mouvement n'existe pas." });
      }
  
      // Suppression de l'article
      const query = 'DELETE FROM rguig_inventaire_afg.mouvement WHERE idMvm = ?';
      await connection.query(query, [id]);
  
      res.status(200).json({ message: 'Article supprimé avec succès.' });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'article :", error);
      res.status(500).json({ message: 'Une erreur est survenue.', error: error.message });
    } finally {
      if (connection) connection.release();
    }
  });

  router.put('/updatemouvements/:id', async (req, res) => {
    const { id } = req.params;
    const {
      typeMvm,
      quantityMvm,
      nOrdre
    } = req.body;
  
    let connection;
    try {
      connection = await pool1.getConnection();
  
      // Validation des données entrantes
      if (!id ) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
  
   // Calcul des quantités pour le mouvement
   let quantityEntree = 0;
   let quantitySortie = 0;

   if (typeMvm === 'Entree') {
       quantityEntree = quantityMvm;
       quantitySortie = 0;
   } else {
       quantitySortie = quantityMvm;
       quantityEntree = 0;
   }

      const query = `
        UPDATE rguig_inventaire_afg.mouvement
        SET typeMvm = ?, 
        quantityMvm = ?, 
        nOrdre = ?, 
        quantityEntree = ?, 
        quantitySortie = ?        
        WHERE idMvm = ?
      `;
  
      await connection.query(query, [
        typeMvm,
        quantityMvm,
        nOrdre,
        quantityEntree,
        quantitySortie,   
        id,
      ]);
  
      res.status(200).json({ message: 'Mouvement updated successfully' });
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ message: 'Something went wrong', error: error.message });
    } finally {
      if (connection) connection.release();
    }
  });




module.exports = router;
