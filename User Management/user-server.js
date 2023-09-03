// import express from 'express';
// import mysql from 'mysql2';
// import cors from 'cors';
//
// const app = express();
//
// // Middleware
// app.use(cors());
// app.use(express.json());
//
// const db_mysql = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'root',
//     database: 'user',
//     port: 3306,
// });
//
// db_mysql.connect((err) => {
//     if (err) {
//         console.error('Database connection error:', err);
//         return;
//     }
//     console.log('Connected to the database');
// });
//
// // Routes for the 'user' resource
//
// app.get('/users', (req, res) => {
//     const sql = 'SELECT * FROM user';
//     db_mysql.query(sql, (err, result) => {
//         if (err) return res.status(500).json({ message: 'Server error' });
//         return res.json(result);
//     });
// });
//
// app.post('/users/add', (req, res) => {
//     const maxIdQuery = 'SELECT MAX(id) AS maxId FROM user';
//
//     db_mysql.query(maxIdQuery, (err, result) => {
//         if (err) {
//             return res.status(500).json(err);
//         }
//
//         // Calculate the next ID
//         let nextId = 1;
//         if (result?.[0]?.maxId) {
//             const maxId = result[0].maxId;
//             const numericPart = parseInt(maxId.substring(1));
//             nextId = numericPart + 1;
//         }
//
//         const newUserId = 'U' + nextId;
//
//         const sql = 'INSERT INTO user (id, name, address, phoneNumber) VALUES (?, ?, ?, ?)';
//         const values = [newUserId, req.body.name, req.body.address, req.body.phoneNumber];
//
//         db_mysql.query(sql, values, (err, result) => {
//             if (err) {
//                 return res.status(500).json(err);
//             }
//
//             return res.json(result);
//         });
//     });
// });
//
// app.get('/users/read/:id', (req, res) => {
//     const sql = 'SELECT * FROM user WHERE id = ?';
//     const id = req.params.id;
//     db_mysql.query(sql, [id], (err, result) => {
//         if (err) return res.status(500).json({ message: 'Server error' });
//         return res.json(result);
//     });
// });
//
// app.put('/users/update/:id', (req, res) => {
//     const sql = 'UPDATE user SET name=?, address=?, phoneNumber=? WHERE id = ?';
//     const id = req.params.id;
//     const { name, address, phoneNumber } = req.body;
//     db_mysql.query(sql, [name, address, phoneNumber, id], (err, result) => {
//         if (err) return res.status(500).json({ message: 'Server error' });
//         return res.json(result);
//     });
// });
//
// app.delete('/users/delete/:id', (req, res) => {
//     const sql = 'DELETE FROM user WHERE id=?';
//     const id = req.params.id;
//     db_mysql.query(sql, [id], (err, result) => {
//         if (err) return res.status(500).json({ message: 'Server error' });
//         return res.json(result);
//     });
// });
//
// app.listen(7000, () => {
//     console.log('User Server is listening on port 7000');
// });
