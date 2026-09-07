const express = require("express");
const cors = require("cors");
const http = require("http");
const {Server} = require("socket.io");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());


const server = http.createServer(app);


const io = new Server(server,{
    cors:{
        origin:"*"
    }
});


let rooms = {};


function createCode(){

    return Math.floor(
        10000 + Math.random()*90000
    ).toString();

}


app.post("/create-room",(req,res)=>{

    const {
        name,
        avatar
    } = req.body;


    const code=createCode();


    rooms[code]={
        owner:name,
        users:[
            {
                name,
                avatar
            }
        ],
        messages:[],
        closed:false
    };


    res.json({
        code
    });

});



app.post("/join-room",(req,res)=>{

    const {
        code
    }=req.body;


    if(!rooms[code])
    {
        return res.status(404).json({
            error:"Room not found"
        });
    }


    if(rooms[code].closed)
    {
        return res.status(403).json({
            error:"Room closed"
        });
    }


    res.json(
        rooms[code]
    );

});





io.on("connection",(socket)=>{


socket.on("join",({code,user})=>{


    socket.join(code);


    if(rooms[code]){

        rooms[code].users.push(user);


        io.to(code).emit(
            "users",
            rooms[code].users
        );

    }


});



socket.on("message",({code,message})=>{


    if(rooms[code]){


        rooms[code].messages.push(message);


        io.to(code).emit(
            "message",
            message
        );


    }

});



socket.on("close-room",(code)=>{


    if(rooms[code]){

        rooms[code].closed=true;


        io.to(code).emit(
            "closed"
        );

    }


});


});




server.listen(
    process.env.PORT || 3001,
    ()=>{
        console.log("Roomali server running")
    }
);
