import express from 'express';
import mysql from 'mysql2';
import pg from 'pg'; // Import 'pg' without curly braces
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// MySQL configuration
const db_mysql = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'user',
    port: 3306,
});

db_mysql.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// PostgreSQL configuration
const { Pool } = pg; // Use a default import

const dbConfigPostgreSQL = {
    user: 'postgres',
    host: 'localhost',
    database: 'order',
    password: 'root',
    port: 5432,
};

const db_postgresql = new Pool(dbConfigPostgreSQL);

db_postgresql.connect()
    .then(() => {
        console.log('Connected to PostgreSQL database');
    })
    .catch((err) => {
        console.error('Error connecting to PostgreSQL database:', err);
    });

app.get('/user',(req,res)=>{
    const sql = "SELECT * FROM user";
    db.query(sql,(err,result) => {
        if(err) return res.json({Message: "Error inside server..."});
        return res.json(result);
    });
})

app.post('/user/add',(req,res)=>{
    const sql = "INSERT INTO user (`name`,`age`) VALUES (?)";
    const values = [
        req.body.name,
        req.body.age
    ]
    db.query(sql,[values],(err,result) => {
        if(err) return res.json(err)
        return res.json(result)
    })
})

app.get('/user/read/:id',(req,res)=>{
    const sql = "SELECT * FROM user WHERE id = ?";
    const id = req.params.id;
    db.query(sql,[id],(err,result) => {
        if(err) return res.json({Message: "Error inside server..."});
        return res.json(result);
    });
})

app.put('/user/update/:id',(req,res)=>{
    const sql = "UPDATE user SET `name`=?,`age`=? WHERE id = ?";
    const id = req.params.id;
    db.query(sql,[req.body.name,req.body.age,id],(err,result) => {
        if(err) return res.json({Message: "Error inside server..."});
        return res.json(result);
    });
})

app.delete(`/user/delete/:id`,(req,res) => {
    const sql = "DELETE FROM user WHERE id=?"
    const id = req.params.id;
    db.query(sql,[id],(err,result) => {
        if(err) return res.json({Message: "Error inside server..."});
        return res.json(result);
    });
});

app.listen(8000,() => {
    console.log("listening on port : 8000");
})