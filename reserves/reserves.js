import express from 'express';
import mysql from 'mysql';
import dbCred from '../creds.js';
import errorMessage from '../errorMessage.js';

const router = express.Router();
const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;

var connection = mysql.createConnection({
    host:dbCred['host'],
    port:dbCred['port'],
    user:dbCred['user'],
    password:dbCred['password'],
    database:dbCred['database'],
    multipleStatements: true
});


router.get('/:symbol', (req,res) => {
    const tokenSymbol = req.params['symbol'];
    console.log(tokenSymbol);
    // Input Sanity
    if(specialChars.test(tokenSymbol)){
        res.status(400).send({ error: errorMessage.input_invalid_special});
        return;
    }
    var sqlSymbol = "Select * from token_reserve where token_symbol='" + tokenSymbol + "'";
    connection.query(sqlSymbol, function(err, result){
        if(err){
            console.log(err);
            res.status(500).send({ error: errorMessage.internal_error});
        }
        else if(result.length == 0){
            res.status(200).send({message: errorMessage.no_data});
        }
        else if(result.length == 1){
            res.send(result);
        }
    })
    return;
})

export default router;