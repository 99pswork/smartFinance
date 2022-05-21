import express from 'express';
import mysql from 'mysql';
import dbCred from '../creds.js';
import errorMessage from '../errorMessage.js';
import loginService from '../services/loginservice.js';

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

// All routes start from /tokens in this JS

// Return 25 Priority Tokens | Return token with filter string
router.get('/', (req,res) => {
    // Check for filter
    const filters = req.query;
    if(filters['filter'] != undefined)
    {
        console.log(filters['filter']);
        if(specialChars.test(filters['filter'])){
            res.status(400).send({ error: errorMessage.input_invalid_special});
            return;
        }
        else if(filters['filter'].length < 3){
            res.status(400).send({ error: "Filter length needs to be minimum 3!"});
            return;
        }
        var sqlFilter =  "Select token_symbol from token_data where ((token_symbol like '%" + filters['filter'] + "%') OR (token_name like '%" + filters['filter'] + "%') OR (contract_address like '%" + filters['filter'] + "%'))";
        connection.query(sqlFilter, function(err, result){
            if(err){
                console.log(err);
                res.status(500).send({ error: errorMessage.internal_error});
            }
            else if(result.length == 0){
                res.status(200).send({message: errorMessage.no_data});
            }
            else{
                res.send(result);
            }
        })
    }
    else{
        var sqlPriority = "SELECT token_symbol from token_data where priority=1";
        connection.query(sqlPriority, function(err, result){
            if(err){
                console.log(err);
                res.status(500).send({ error: errorMessage.internal_error});
                return;
            }
            else{
                console.log(result);
                res.send(result);
            }
        })
    }
    return;
})


// Return Single Token which matches symbol name
router.get('/:symbol', (req,res) => {
    const tokenSymbol = req.params['symbol'];
    console.log(tokenSymbol);
    // Input Sanity
    if(specialChars.test(tokenSymbol)){
        res.status(400).send({ error: errorMessage.input_invalid_special});
        return;
    }
    var sqlSymbol = "Select * from token_data where token_symbol='" + tokenSymbol + "'";
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

router.post('/', (req,res) => {
    // Validate Authorisation
    console.log(req.headers.authorization);
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
    console.log("Login ", login);
    console.log("Password ", password);
    var result = Promise.resolve(loginService(login,password));
    result.then((responseLoginService)=>{
        console.log("Login Service Response:",responseLoginService);
        console.log(req.body);
        if(responseLoginService=="Login Successful"){
            var requestBody = Object.values(JSON.parse(JSON.stringify(req.body)));
            if(requestBody.length != 11){
                res.status(400).send("Invalid Body Format");
                return;
            }
            const [priority, token_symbol, token_name, contract_address, pair_address, chain_name, swap_name, decimals, numerator, denominator, slot] = [...requestBody];
            var sqlPostQueryData = `INSERT into token_data VALUES ('${priority}', '${token_symbol}' , '${token_name}', '${contract_address}', '${pair_address}', '${chain_name}', '${swap_name}', '${decimals}'); `; 
            var sqlPostQueryReserveData = `INSERT into token_reserve VALUES ('${token_symbol}', '${numerator}', '${denominator}', '${slot}');`;
            connection.query(sqlPostQueryData + sqlPostQueryReserveData, function(err, result){
                if(err){
                    console.log(err);
                    res.status(500).send({ error: errorMessage.internal_error});
                }else{
                    console.log(result);
                    res.status(201).send({message: "Token Added Successfully!"});
                }
            })
        }
        else if(responseLoginService==errorMessage.internal_error){
            res.status(500).send({error : errorMessage.internal_error});
        }
        else{
            res.status(401).send({error: errorMessage.invalid_login});
        }
    })
})

export default router;