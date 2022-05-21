import express from 'express';
import bodyParser from 'body-parser'; 
import tokenRoutes from './tokens/tokens.js';
import reserveRoutes from './reserves/reserves.js';
import dbCred from './creds.js';
import mysql from 'mysql';


const app = express()
const PORT = 5000;

app.set('view engine', 'ejs')
app.use(bodyParser.json());
app.use('/token', tokenRoutes);
app.use('/reserve', reserveRoutes);

var connection = mysql.createConnection({
    host:dbCred['host'],
    port:dbCred['port'],
    user:dbCred['user'],
    password:dbCred['password'],
    database:dbCred['database'],
    multipleStatements: true
});

function connectDB(){
    connection.connect(function(err) {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database.');
    });
}


app.listen(PORT, function(){
    console.log("Listening on port 5000 Localhost");
    connectDB();
})

app.get('/', (req,res) => {
    res.send("The Smart Server is Running!");
})


