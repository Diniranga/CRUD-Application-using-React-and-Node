const express = require('express');
const pg = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;

const dbConfigPostgreSQL = {
    user: 'postgres',
    host: 'localhost',
    database: 'orders',
    password: 'root',
    port: 5432,
};

const db = new Pool(dbConfigPostgreSQL);

db.connect()
    .then(() => {
        console.log('Connected to PostgreSQL database');
    })
    .catch((err) => {
        console.error('Error connecting to PostgreSQL database:', err);
    });

app.get('/orders/check/all', (req, res) => {
    const sql = 'SELECT * FROM orders';
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ message: 'Error inside server...' });
        const rows = result.rows;
        return res.json(rows);
    });
});

app.get('/orders/check/:orderID', (req, res) => {
    const sql = 'SELECT * FROM orders WHERE "orderID" = $1';
    const id = req.params.orderID;
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error inside server...' + err });
        return res.json(result.rows[0]);
    });
});

app.delete('/orders/delete/:orderID', (req, res) => {
    const orderID = req.params.orderID;
    const getOrderQuery = 'SELECT * FROM orders WHERE "orderID" = $1';

    db.query(getOrderQuery, [orderID], (getOrderErr, getOrderResult) => {
        if (getOrderErr) {
            return res.status(500).json({ message: 'Error inside server...' + getOrderErr });
        }

        // Check if the order with the given orderID exists
        if (getOrderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const productID = getOrderResult.rows[0].productID;
        const quantity = getOrderResult.rows[0].quantity;

        // Now update the product table by adding the quantity back to the existing value using the provided API
        const updateProductAPI = `http://localhost:9000/inventory/update/productQuantity/${productID}`;

        const updateProductRequest = fetch(updateProductAPI, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "quantity": quantity, // Pass the quantity to add to the existing quantity
            }),
        });

        updateProductRequest
            .then((updateProductResponse) => {
                if (updateProductResponse.status === 200) {
                    // Successfully updated the product, now delete the order
                    const deleteOrderQuery = 'DELETE FROM orders WHERE "orderID" = $1';
                    db.query(deleteOrderQuery, [orderID], (deleteOrderErr, deleteOrderResult) => {
                        if (deleteOrderErr) {
                            return res.status(500).json({ message: 'Error inside server...' + deleteOrderErr });
                        }
                        return res.json({ message: 'Order deleted successfully' });
                    });
                } else {
                    return res.status(500).json({ message: 'Error updating product' });
                }
            })
            .catch((updateProductError) => {
                return res.status(500).json({ message: 'Error updating product' });
            });
    });
});

app.put('/orders/update/:orderID', async (req, res) => {
    const orderID = req.params.orderID;
    const quantity  = req.body.quantity;

    // Fetch the existing order to get the productID and previous quantity
    const getOrderQuery = 'SELECT "productID", "quantity","cost" FROM orders WHERE "orderID" = $1';
    db.query(getOrderQuery, [orderID], async (getOrderErr, getOrderResult) => {
        if (getOrderErr) {
            return res.status(500).json({ message: 'Error inside server...' + getOrderErr });
        }

        // Check if the order with the given orderID exists
        if (getOrderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const { productID, quantity: previousQuantity,cost} = getOrderResult.rows[0];

        // Calculate the difference between the new quantity and the previous quantity
        const quantityDifference = quantity - previousQuantity;

        if (quantityDifference > 0) {
            // If the new quantity is greater, check if the extra quantity is available for purchase
            try {
                const purchaseResponse = await fetch('http://localhost:9000/inventory/purchase', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        productID,
                        "quantity": quantityDifference, // Calculate the extra quantity to purchase
                    }),
                });

                const purchaseResult = await purchaseResponse.json();

                if (purchaseResult.success) {
                    // Extra purchase was successful, update the order with the new quantity and cost
                    const updateOrderQuery = 'UPDATE orders SET quantity=$1, cost=cost + $2 WHERE "orderID" = $3';
                    db.query(updateOrderQuery, [quantity, purchaseResult.cost, orderID], async (updateOrderErr, updateOrderResult) => {
                        if (updateOrderErr) {
                            return res.status(500).json({ message: 'Error inside server...' + updateOrderErr });
                        }
                        return res.json({ message: 'Order updated successfully' });
                    });
                } else {
                    return res.status(400).json({ message: 'Extra purchase was not successful' });
                }
            } catch (error) {
                return res.status(500).json({ message: 'Error making request to /inventory/purchase' });
            }
        } else if (quantityDifference < 0) {
            // If the new quantity is lower, update the product quantity using the API
            const updateProductResponse = await fetch(`http://localhost:9000/inventory/update/productQuantity/${productID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "quantity": -quantityDifference, // Calculate the extra quantity to add to the product
                }),
            });


            const updateProductResult = await updateProductResponse.json();
            const unitPrice = updateProductResult.unitPrice; // Access the unitPrice from the response

            if (updateProductResponse.status !== 200) {
                return res.status(500).json({message: 'Error updating product quantity'});
            }

            // Update the order with the new quantity and adjusted cost
            const adjustedCost = cost - (quantityDifference * unitPrice); // Adjust the cost
            console.log("adjusted cost is: "+ adjustedCost)
            const updateOrderQuery = 'UPDATE orders SET quantity=$1, cost=$2 WHERE "orderID" = $3';
            db.query(updateOrderQuery, [quantity, adjustedCost, orderID], async (updateOrderErr, updateOrderResult) => {
                if (updateOrderErr) {
                    return res.status(500).json({message: 'Error inside server...' + updateOrderErr});
                }
                return res.json({message: 'Order updated successfully'});
            });
        }

    });
});



app.post('/orders/add', async (req, res) => {
    const userID = req.body.userID;
    const productID = req.body.productID;
    const quantity = req.body.quantity;

    try {
        const userExistsResponse = await fetch(`http://localhost:7000/users/check/${userID}`);
        const userExists = await userExistsResponse.json();

        if (!userExists) {
            return res.status(400).json({ success: false, message: 'User does not exist' });
        }

        const purchaseResponse = await fetch(`http://localhost:9000/inventory/purchase`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "productID": productID,
                "quantity": quantity,
            }),
        });

        const purchaseResult = await purchaseResponse.json();

        if (purchaseResult.success) {
            const cost = purchaseResult.cost;

            const maxIdQuery = 'SELECT MAX("orderID") AS maxId FROM orders';

            db.query(maxIdQuery, (err, result) => {
                if (err) return res.status(500).json(err);

                let nextId = 1;
                if (result?.rows?.[0]?.maxid) {
                    const maxId = result.rows[0].maxid;
                    const numericPart = parseInt(maxId.substring(1));
                    nextId = numericPart + 1;
                }

                const newOrderID = 'O' + nextId;

                const sql = 'INSERT INTO orders ("orderID", "userID", "productID", "quantity", "cost", "date") VALUES ($1, $2, $3, $4, $5, NOW())';
                const values = [newOrderID, userID, productID, quantity, cost];

                db.query(sql, values, (err, result) => {
                    if (err) return res.status(500).json(err);
                    return res.json(purchaseResult);
                });
            });
        } else {
            return res.status(400).json(purchaseResult);
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.listen(8000, () => {
    console.log('Order Placement is listening on port 8000');
});
