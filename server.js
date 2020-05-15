const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex');

const postgres = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'havamacherie',
      database : 'smartBrain'
    }
  });

const app = express();
app.use(express.json())
app.use(cors());

//GET all user
app.get('/', (req,res)=> {
    res.json(database.user)
 })

//SIGNIN 
app.post('/signin', (req,res)=> {
    const {email, password} = req.body
    if(!email || !password){
        return res.status(400).json('invalid form')
    }
   postgres.select('email','hash').from('login')
     .where('email', '=', req.body.email)
     .then(data =>{
         const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        if(isValid){
             return(
                postgres.select('*').from('users')
                .where('email', '=', req.body.email)
                .then(user=> {
                   res.json(user[0])
                })
                .catch(err => res.status(400).json('Unable to get user'))
             )
        }else{
            res.status(400).json('wrong credentials')
        }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

//REGISTER
app.post('/register', (req,res) =>{
    const {email, name, password } = req.body;
    if(!email || !name || !password){
        return res.status(400).json('invalid form')
    }
    const hash = bcrypt.hashSync(password);
    postgres.transaction(trx => {
        trx.insert({
          hash: hash,
          email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
          return trx('users')
            .returning('*')
            .insert({
              email: loginEmail[0],
              name: name,
              joined: new Date()
            })
            .then(user => {
              res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
      })
      .catch(err => res.status(400).json('unable to register'))
  })

 //PROFILE
 app.get('/profile/:id', (req,res) =>{
    const { id } = req.params
    postgres
    .withSchema('public')
    .select('*')
    .from('users')
    .where({id: id})
    .then(user =>{ 
        if(user.length){
            res.json(user[0])
        }
        else{
            res.status(400).json('ID not found')            
        }})
 })
    


 // IMAGE
 app.put('/image', (req,res) =>{
    const { id } = req.body;
    postgres('users').where('id', '=', id)
    .increment('entrie', 1)
    .returning('entrie')
    .then(entries => {
      res.json(entries[0]);
    })
    .catch(err => res.status(400).json('unable to get entries'))   
 })

app.listen(80,() => {
  console.log('app runing on port 80')
})


