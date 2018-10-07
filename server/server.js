"use strict";
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const fs = require("fs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
 
var mc;

// connection configurations

fs.readFile("dbConnectionString.txt", "utf8", function(err, data) {
    if(err){
        console.log(err);
    }
    mc = mysql.createConnection({
        host: data.toString(),
        user: 'todo',
        password: 'todopassword',
        database: 'todo'})
    mc.connect();
 }); 
     
// default 
app.get('/', function (req, res) {
    try{
        mc.query("SELECT count(*) as users_count from user", function (error, results, fields) {
            if (error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
            return res.send({ error: false, data: results[0], message: 'Everything Ok!!' });
        });
    }
    catch(error){
        return res.send({ error: true, message: error.toString() })
    }
});

// Add a new item  
app.post('/user', function (req, res) {
    let user = req.body.user;
    if (!user) {
        return res.status(400).send({ error:true, message: 'Please provide user details' });
    }
    try{  
        mc.query('SELECT * FROM user where mobile = ?',user.mobile, function (error, results, fields) {
            if(error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
            if (results.length > 0) {
               return res.send({ error: false, data: results[0], message: 'UserAlreadyExists' });
            }
            else{
                   mc.query("INSERT INTO user SET ? ", user, function (error, results, fields) {
                    if (error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
                    let insertedId = results.insertId;
                    mc.query('SELECT * FROM user where id=?',insertedId, function (error, results, fields) {
                    if (error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
                    return res.send({ error: false, data: results[0], message: 'NewUserCreated' });
            });
        });
            }
                
        });
    }
    catch(error){
        return res.status(500).send({ error:true, message: 'UNKNOWN_ERROR' });
    }
   
});


// Add a new item  
app.post('/login', function (req, res) {
 
    let user = req.body.user;
   var passwordFromDb ='';
    if (!user) {
        return res.status(400).send({ error:true, message: 'Please provide user details' });
    }
    try{  
        mc.query('SELECT password FROM user where mobile = ?',user.mobile, function (error, results, fields) {
            if(error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
            if (results.length > 0) {
                if (results[0].password==user.password) {
                    return res.send({ error: false, data: "Success", message: 'Login successfully' });
                }  else{
                    return res.send({ error: false, data: "Fail", message: 'Login failed' });
                }
            }
            else{
                return res.send({ error: false, data: "UserNotFound", message: 'User not found' });
            }
                
        });
    }
    catch(error){
        return res.status(500).send({ error:true, message: 'UNKNOWN_ERROR' });
    }
});



// Add a new list  
app.post('/list', function (req, res) {
 
    let list = req.body.list;
 
    if (!list) {
        return res.status(400).send({ error:true, message: 'Please provide list details' });
    }
    try{
        mc.query("INSERT INTO list SET ? ", list, function (error, results, fields) {
            if (error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
            let insertedId = results.insertId;
            mc.query('SELECT * FROM list where id=?',insertedId, function (error, results, fields) {
            if (error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
            return res.send({ error: false, data: results[0], message: 'New list has been created successfully.' });
            });
        });
    }
    catch(error){
        return res.status(500).send({ error:true, message: 'UNKNOWN_ERROR' });
    }

});

// complete a item  
app.post('/item/:id/status/:status', function (req, res) {
 
    let id = req.params.id;
    let status = req.params.status;
 
    try{
        mc.query("UPDATE item SET isCompleted =? where id=? ", [status, id], function (error, results, fields) {
            if (error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
            mc.query('SELECT * FROM item where id=?',id, function (error, results, fields) {
            if (error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
            return res.send({ error: false, data: results[0], message: 'Item has been marked complete successfully.' });
            });

        });
    }
    catch(error){
        return res.status(500).send({ error:true, message: 'UNKNOWN_ERROR' });
    }
 
});

// Add a new item  
app.delete('/item/:id', function (req, res) {
 
    let id = req.params.id;
 
    try{
        mc.query("DELETE from item where id=? ", id, function (error, results, fields) {
            if (error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
            return res.send({ error: false, data: null, message: 'Item has been deleted successfully.' });

        });
    }
    catch(error){
        return res.status(500).send({ error:true, message: 'UNKNOWN_ERROR' });
    }
 
});

// Add a new item  
app.post('/item', function (req, res) {
 
    let item = req.body.item;
 
    if (!item) {
        return res.status(400).send({ error:true, message: 'Please provide item details' });
    }
    try{
        mc.query("INSERT INTO item SET ? ", item, function (error, results, fields) {
            if (error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
            let insertedId = results.insertId;
            mc.query('SELECT * FROM item where id=?',insertedId, function (error, results, fields) {
            if (error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
            return res.send({ error: false, data: results[0], message: 'New item has been created successfully.' });
            });

        });
    }
    catch(error){
        return res.status(500).send({ error:true, message: 'UNKNOWN_ERROR' });
    }
 
});

// Get all lists 
app.get('/list', function (req, res) {
    try{  
        mc.query('SELECT list.id, name, category, count(*) as count FROM list join item where list.id=item.listId group by list.id,name,category', function (error, results, fields) {
        if(error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
        return res.send({ error: false, data: results, message: 'Lists' });
        });
    }
    catch(error){
        return res.status(500).send({ error:true, message: 'UNKNOWN_ERROR' });
    }
});

// Retrieve all items in a list 
app.get('/list/:id', function (req, res) {
    let id = req.params.id;
    try{
        mc.query('SELECT * FROM item where listId=?',id, function (error, results, fields) {
        if(error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
        return res.send({ error: false, data: results, message: 'Lists' });
        });
    }
    catch(error){
        return res.status(500).send({ error:true, message: 'UNKNOWN_ERROR' });
    }    
});

// Retrieve all items in a list 
app.get('/list/:userId/completed', function (req, res) {
    let id = req.params.userId;
    try{
        mc.query('SELECT * FROM item where userId=? and isCompleted = true limit 10',id, function (error, results, fields) {
        if(error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
        return res.send({ error: false, data: results, message: 'Completed list' });
        });
    }
    catch(error){
        return res.status(500).send({ error:true, message: 'UNKNOWN_ERROR' });
    }    
});

// Retrieve all items in a list 
app.get('/list/:userId/todo', function (req, res) {
    let id = req.params.userId;
    try{
        mc.query('SELECT * FROM item where userId=? and isCompleted = false order by dueDate',id, function (error, results, fields) {
        if(error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
        return res.send({ error: false, data: results, message: 'Todo list' });
        });
    }
    catch(error){
        return res.status(500).send({ error:true, message: 'UNKNOWN_ERROR' });
    }    
});

// Retrieve all nonlist items 
app.get('/nonlistitems', function (req, res) {
    try{
        mc.query('SELECT * FROM item where listId is null', function (error, results, fields) {
        if (error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
        return res.send({ error: false, data: results, message: 'Non list items' });
        });
    }
    catch(error)
    {
        return res.status(500).send({ error:true, message: 'UNKNOWN_ERROR' });
    } 
});



// Retrieve all items in a list 
app.get('/items/:userId', function (req, res) {
    let id = req.params.userId;
    try{
        mc.query('SELECT * FROM item where userId=?',id, function (error, results, fields) {
        if(error) return res.status(500).send({ error:true, message: 'DB_ERROR' });
        
        var activeItem =[];
        var completedItem = [];

            for (var i = 0; i < results.length; i++) {
              var item = results[i];
              if(item.isCompleted === 0){
                activeItem.push(item);
              }else{
                completedItem.push(item);
              }
            }

          var itemsList = {}; 
          itemsList["active"] = activeItem;
          itemsList["completed"] = completedItem;

        return res.status(200).send({ error:false, data:itemsList, message: 'list of items' });

        });
    }
    catch(error){
        return res.status(500).send({ error:true, message: 'UNKNOWN_ERROR' });
    }    
});


app.listen(8080, function () {
    console.log('Node app is running on port 8080');
});
// allows "grunt dev" to create a development server with livereload
module.exports = app;