const express = require('express');
const router = express.Router();
const { pool1 } = require('../db');
const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');
const fs = require('fs');

router.post('/listInventaire', async (req, res) => {
    let connection;
    try {
        const {
            title, quantitySt, unit, categorie, location, quantitySecurity,
            dispositionA, dispositionB, articleType,typeMachine, imagePath, currentUser
        } = req.body;

        // Validate required fields
        if (!title || !quantitySt || !unit || !categorie || !location  || !quantitySecurity ||
            !dispositionA || !dispositionB || !articleType || !typeMachine|| !imagePath ||  !currentUser || !currentUser.idUser) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get a connection from the pool
        connection = await pool1.getConnection();

        // Calculate values for `isCritic`
        const isCritic = quantitySt == 0 || quantitySt <= quantitySecurity ? 1 : 0;

        // Insert the article into the database
        const query = `
            INSERT INTO rguig_inventaire_afg.articles 
            (title, quantitySt, unit, categorie, location,is_critic, quantitySecurity, 
             dispositionA, dispositionB, articleType, image, typeMachine, dateCreationArticle, idUsr)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `;
        const [result] = await connection.query(query, [
            title, quantitySt, unit, categorie, location, isCritic, quantitySecurity,
            dispositionA, dispositionB, articleType,imagePath, typeMachine, currentUser.idUser
        ]);

      // Get the current date
   // const today = new Date();
//const formattedDate = today.toISOString().split('T')[0].replace(/-/g, ''); // Format: YYYYMMDD
           // Get the automatically generated idArticle
        const idArticle = result.insertId;

        // Generate the reference using location and idArticle
        const reference = `${location}-${idArticle}-${typeMachine}`;

        // Generate the barcode using the reference
        const canvas = createCanvas();
        JsBarcode(canvas, reference, { format: 'CODE128' });

        // Save the barcode as an image
        const barcodePath = `./public/barcodes/${reference}.png`;
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(barcodePath, buffer);

        // Update the article with the generated reference and barcode path
        await connection.query(`
            UPDATE rguig_inventaire_afg.articles 
            SET reference = ?, codeBarre = ? 
            WHERE idArticle = ?
        `, [reference, barcodePath, idArticle]);

        res.status(201).send('Article registered successfully, barcode generated.');
        console.log(imagePath);
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    } finally {
        // Ensure the connection is released
        if (connection) connection.release();
    }
});




router.post('/getuserorders', async (req, res) => {
    let pool;
    try {
        const { currentUser } = req.body;

        if (!currentUser || !currentUser.idUser) {
            return res.status(400).json({ message: 'User ID is missing or undefined' });
        }

        pool = await poolPromise;
        const request = pool.request();

        request.input('userid', sql.Int, currentUser.idUser);

        const query = `
            SELECT * FROM topclass.SORDER WHERE [USER] = @userid
        `;

        const result = await request.query(query);

        res.status(200).json(result.recordset);
    } catch (error) {
        if (pool) {
            try {
                await pool.close();
            } catch (e) {
                console.error('Error closing MSSQL pool', e);
            }
        }
        console.error('Error getting user orders:', error);
        return res.status(400).json({ message: 'Something went wrong', error: error.message });
    }
});


module.exports = router;
