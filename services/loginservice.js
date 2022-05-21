import mysql from 'mysql';
import dbCred from '../creds.js';
import errorMessage from '../errorMessage.js';

var connection = mysql.createConnection({
    host:dbCred['host'],
    port:dbCred['port'],
    user:dbCred['user'],
    password:dbCred['password'],
    database:dbCred['database'],
    multipleStatements: true
});

function validateUserName(username){
    var usernameRegex = /^[a-zA-Z0-9]+$/;
    return usernameRegex.test(username);
}

function validatePassword(password){
    var passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
    return passwordRegex.test(password);
}


function passwordSanityTest(username,password){
    if(!validateUserName(username)){
        console.log(errorMessage.invalid_username);
        return errorMessage.invalid_username;
    }
    console.log("Valid Username!");
    if(!validatePassword(password)){
        console.log(errorMessage.invalid_password);
        return errorMessage.invalid_password;
    }
    console.log("Valid password!");
}



export default async function basicAuth(username, password){
    return new Promise(function (resolve,reject){
        var sanityReponse = passwordSanityTest(username,password);
        if(sanityReponse == errorMessage.invalid_username || sanityReponse == errorMessage.invalid_password){
            resolve("Sanity Test Failed!");
        }
        var sqlUserValidator = "Select pass_login from user_data where user_login='" + username + "'";
        connection.query(sqlUserValidator, function(err, result){
            if(err){
                console.log(err);
                resolve(errorMessage.internal_error);
            }
            else if(result.length == 0){
                console.log(errorMessage.invalid_login);
                resolve(errorMessage.invalid_login);
            }
            else if(result.length > 1){
                console.log(errorMessage.invalid_login);
                resolve(errorMessage.invalid_login);
            }
            else{
                var secretKey = Object.values(JSON.parse(JSON.stringify(result)));
                if(password == secretKey[0]['pass_login']){
                    console.log("YES!");
                    resolve("Login Successful");
                }
                else{
                    console.log("NO!");
                    resolve(errorMessage.invalid_login);
                }
            }
        })
    })
};

