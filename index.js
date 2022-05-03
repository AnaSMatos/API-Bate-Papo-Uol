import express from "express";
import cors from "cors";
import {MongoClient, ObjectId} from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import Joi from "joi";

dotenv.config();

const port = 5000;

const MONGO_URL = process.env.MONGO_URL;
const mongoClient = new MongoClient(MONGO_URL);
let db;

const promise = mongoClient.connect();
promise.then(()=>{
    db = mongoClient.db("bate_papo_uol");
    console.log("banco conectado")
})
promise.catch(e => console.log("erro na conexão"))

const app = express();
app.use(express.json())
app.use(cors())

//JOI

const userSchema = Joi.object({
    name: Joi.string().required()
})

const messageSchema = Joi.object({
    to: Joi.string().required(),
    text: Joi.string().required(),
    type: Joi.string().required().valid("message", "private_message"),
    from: Joi.string().required,
    time: Joi.string().required()
})

app.post("/participants", async(req, res) => {
    const validation = userSchema.validate(req.body);
    const {name} = req.body;
    const lastStatus = Date.now();

    const message = {from: name, to: 'Todos', 
    text: 'entra na sala...', type: 'status',
    time: dayjs().format('HH:mm:ss')}

    try{
        const nameExists = await db.collection("participants").findOne({
            name: name
        })
        if(nameExists){
            return res.sendStatus(409)
        }

        if(!validation.error){
            await db.collection("participants").insertOne({name, lastStatus})
            await db.collection("messages").insertOne(message)
            res.sendStatus(201)
        }
    }catch{
        res.sendStatus(422)
    }
})

app.get("/participants", async (req, res) => {
    try{
        const users = await db.collection("participants").find({}).toArray();
        res.send(users)
    }catch{
        res.sendStatus(404)
    }
})

app.post("/messages", async(req, res)=>{
    const {to, text, type} = req.body
    const {user} = req.headers
    const time = dayjs().format('HH:mm:ss');
    const message = {from: user, to, text, type, time}
    const validation = messageSchema.validate(message);

    try{
        const userOnline = await db.collection("participants").findOne({
            name: to
        })

        if(!userOnline){
            return res.sendStatus(422)
        }

        if(!validation.error){
            await db.collection("messages").insertOne(message);
            res.send(201)
        }else{
            res.sendStatus(422)
        }

    }catch{
        res.sendStatus(422)
    }
})

app.get("/messages", async(req, res)=>{
    const {limit} = req.query;
    const {user} = req.headers;

    try{
        if(!limit){
            const allMessages = await db.collection("messages").find({}).toArray();
            res.send(allMessages)
        }
    }catch{
        res.sendStatus(404)
    }
})

app.post("/status", async (req, res)=>{
    const {user} = req.headers
})


app.listen(port)