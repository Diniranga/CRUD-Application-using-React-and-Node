const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const db_mysql = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'inventory',
    port: 3306,
});

db_mysql.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Connected to the database');
});

app.get('/inventory/all', (req, res) => {
    const sql = 'SELECT * FROM products';
    db_mysql.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        return res.json(result);
    });
});

app.post('/inventory/add', (req, res) => {
    const maxIdQuery = 'SELECT MAX(productID) AS maxId FROM products';

    db_mysql.query(maxIdQuery, (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }

        let nextId = 1;
        if (result?.[0]?.maxId) {
            const maxId = result[0].maxId;
            const numericPart = parseInt(maxId.substring(1));
            nextId = numericPart + 1;
        }

        const newProductID = 'P' + nextId;

        const sql = 'INSERT INTO products (productID, productName, qty, unitPrice) VALUES (?, ?, ?, ?)';
        const values = [newProductID, req.body.productName, req.body.qty, req.body.unitPrice];

        db_mysql.query(sql, values, (err, result) => {
            if (err) {
                return res.status(500).json(err);
            }

            return res.json(result);
        });
    });
});

app.get('/inventory/check/:productID', (req, res) => {
    const sql = 'SELECT * FROM products WHERE productID = ?';
    const productID = req.params.productID;
    db_mysql.query(sql, [productID], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        return res.json(result);
    });
});

app.put('/inventory/update/productDetails/:productID', (req, res) => {
    const sql = 'UPDATE products SET productName=?, qty=?, unitPrice=? WHERE productID = ?';
    const productID = req.params.productID;
    const { productName, qty, unitPrice } = req.body;
    db_mysql.query(sql, [productName, qty, unitPrice, productID], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        return res.json(result);
    });
});

app.put('/inventory/update/productQuantity/:productID', (req, res) => {
    const updateProductQuery = 'UPDATE products SET qty = qty + ? WHERE productID = ?';
    const productID = req.params.productID;
    const qty = req.body.quantity;

    const unitPriceQuery = 'SELECT unitPrice FROM products where productID = ?';
    db_mysql.query(unitPriceQuery, [productID], (uniterr, unitResult) => {
        if (uniterr) {
            return res.status(500).json({ message: 'Unable to find productID' });
        }
        db_mysql.query(updateProductQuery, [qty, productID], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Server error' });
            }
            const unitPrice = unitResult[0].unitPrice; // Get the unitPrice from the query result
            return res.json({ unitPrice });
        });
    });
});


app.delete('/inventory/delete/:productID', (req, res) => {
    const sql = 'DELETE FROM products WHERE productID=?';
    const productID = req.params.productID;
    db_mysql.query(sql, [productID], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        return res.json(result);
    });
});

app.put('/inventory/purchase', (req, res) => {
    const productID = req.body.productID;
    const quantityToPurchase = req.body.quantity;

    if (!quantityToPurchase || isNaN(quantityToPurchase) || quantityToPurchase <= 0) {
        return res.status(400).json({ success: false, message: 'Enter a valid quantity' });
    }

    const checkProductQuery = 'SELECT * FROM products WHERE productID = ?';
    db_mysql.query(checkProductQuery, [productID], (checkErr, productResult) => {
        if (checkErr) {
            console.log(checkErr)
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (productResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const product = productResult[0];
        const availableQuantity = product.qty;
        const unitPrice = product.unitPrice;

        if (availableQuantity < quantityToPurchase) {
            return res.status(400).json({ success: false, message: 'Insufficient quantity available' });
        }

        const cost = quantityToPurchase * unitPrice;

        const updateQuery = 'UPDATE products SET qty = ? WHERE productID = ?';
        const newQuantity = availableQuantity - quantityToPurchase;
        db_mysql.query(updateQuery, [newQuantity, productID], (updateErr, updateResult) => {
            if (updateErr) {
                return res.status(500).json({ success: false, message: 'Server error' });
            }

            return res.json({ success: true, message: 'Purchase successful', cost });
        });
    });
});

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    console.log(`Inventory Server is listening on port ${PORT}`);
});
