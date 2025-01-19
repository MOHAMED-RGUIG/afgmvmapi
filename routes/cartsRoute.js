/*const express = require('express');
const router = express.Router();
const Cart = require('../models/cartModel');

router.post("/placecart", async (req, res) => {
    try {
        const { currentUser, product, quantity, varient } = req.body;

        const newcart = new Cart({
            name: currentUser[0].name,
            email: currentUser[0].email,
            userid: currentUser[0]._id,
            productname: product.name, // Fixed typo: 'productnameproduct' to 'productname'
            product_id: product._id,
            productimage: product.image,
            productvarient: varient,
            quantity: Number(quantity),
            prices: product.prices,
            
        });

        await newcart.save();
        return res.status(201).json({ message: 'Cart registered successfully', newcart });
    } catch (error) {
        console.error(error);
        return res.status(400).json({ message: 'Something went wrong' });
    }
});

module.exports = router;*/
