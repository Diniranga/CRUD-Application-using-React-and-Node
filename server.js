import express from 'express'
import mysql from 'mysql2'
import cors from 'cors'

const app = express();
app.use(cors());
app.use(express.json())

const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"root",
    database:"user"
})

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

app.get('/student',(req,res)=>{
    const sql = "SELECT * FROM student";
    db.query(sql,(err,result) => {
        if(err) return res.json({Message: "Error inside server..."});
        return res.json(result);
    });
})

app.post('/student/add',(req,res)=>{
        const sql = "INSERT INTO student (`name`,`age`) VALUES (?)";
        const values = [
            req.body.name,
            req.body.age
        ]
    db.query(sql,[values],(err,result) => {
        if(err) return res.json(err)
        return res.json(result)
    })
})

app.get('/student/read/:id',(req,res)=>{
    const sql = "SELECT * FROM student WHERE id = ?";
    const id = req.params.id;
    db.query(sql,[id],(err,result) => {
        if(err) return res.json({Message: "Error inside server..."});
        return res.json(result);
    });
})

app.put('/student/update/:id',(req,res)=>{
    const sql = "UPDATE student SET `name`=?,`age`=? WHERE id = ?";
    const id = req.params.id;
    db.query(sql,[req.body.name,req.body.age,id],(err,result) => {
        if(err) return res.json({Message: "Error inside server..."});
        return res.json(result);
    });
})

app.delete(`/student/delete/:id`,(req,res) => {
    const sql = "DELETE FROM student WHERE id=?"
    const id = req.params.id;
    db.query(sql,[id],(err,result) => {
        if(err) return res.json({Message: "Error inside server..."});
        return res.json(result);
    });
});

app.listen(8000,() => {
    console.log("listening on port : 8000");
})