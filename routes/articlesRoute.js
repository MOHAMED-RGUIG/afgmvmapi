const express = require("express");
const router = express.Router();
const { pool1 } = require('../db'); 

router.get('/getallarticles', async (req, res) => {
    let connection;
    try {
      connection = await pool1.getConnection();
      const [rows] = await connection.query(`SELECT  rguig_inventaire_afg.articles.*, rguig_inventaire_afg.users.NOMUSR  FROM rguig_inventaire_afg.articles
      JOIN rguig_inventaire_afg.users ON rguig_inventaire_afg.articles.idUsr = rguig_inventaire_afg.users.idUser
            ORDER BY dateCreationArticle DESC`);
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error getting articles:', error);
      res.status(500).json({ message: 'Something went wrong', error: error.message });
    } finally {
      if (connection) connection.release();
    }
  });
  
router.get("/getallimgproducts",async(req,res)=>
{
    try{
            const products = await Product.find({});
            res.send(products);
    } catch(error){
        return res.status(400).json({message: error});
    }   
}
)

router.put('/updatearticles/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title,
    quantitySt,
    unit,
    categorie,
    quantitySecurity,
    dispositionA,
    dispositionB,
    articleType,
    image,
    typeMachine,
  } = req.body;

  let connection;
  try {
    connection = await pool1.getConnection();

    // Validation des données entrantes
    if (!id ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Calcul du champ isCritic
    const isCritic = quantitySt == 0 || quantitySt <= quantitySecurity ? 1 : 0;

    const query = `
      UPDATE rguig_inventaire_afg.articles
      SET title = ?, 
          quantitySt = ?, 
          unit = ?, 
          categorie = ?, 
          is_critic = ?, 
          quantitySecurity = ?, 
          dispositionA = ?, 
          dispositionB = ?, 
          articleType = ?, 
          image = ?, 
          typeMachine = ?
      WHERE idArticle = ?
    `;

    await connection.query(query, [
      title,
      quantitySt,
      unit,
      categorie,
      isCritic,
      quantitySecurity,
      dispositionA,
      dispositionB,
      articleType,
      image,
      typeMachine,
      id,
    ]);

    res.status(200).json({ message: 'Article updated successfully' });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

router.delete('/deletearticle/:id', async (req, res) => {
  const { id } = req.params; // Récupère l'identifiant de l'article à supprimer

  let connection;
  try {
    connection = await pool1.getConnection();

    // Vérification de l'existence de l'article
    const [rows] = await connection.query(
      'SELECT idArticle FROM rguig_inventaire_afg.articles WHERE idArticle = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "L'article n'existe pas." });
    }

    // Suppression de l'article
    const query = 'DELETE FROM rguig_inventaire_afg.articles WHERE idArticle = ?';
    await connection.query(query, [id]);

    res.status(200).json({ message: 'Article supprimé avec succès.' });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article :", error);
    res.status(500).json({ message: 'Une erreur est survenue.', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});



module.exports = router;

