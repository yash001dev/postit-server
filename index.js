const express=require("express");
const {PrismaClient}=require("@prisma/client");
const http=require("http");
const { Server } = require("socket.io");
const app=express();
const server=http.createServer(app);

const prisma=new PrismaClient();

const io=new Server(server,{
    cors:{
        origin:"http://localhost:3000",
    }
});

io.on("connection",(socket)=>{
    socket.on("sendComment",async({body,author,imageId
    })=>{
        console.log("BODY",author)
        let currentUser=await prisma.user.findUnique({
            where:{
                email:author?.email
            }
        })
        console.log("CURRENT USER",currentUser)
        await prisma.comment.create({
            data:{
                body,
                User:{
                    connect:{
                        id:currentUser?.id
                    }
                },
                Image:{
                    connect:{
                        id:Number(imageId)
                    }
                },
                updatedAt: new Date(),
            }
        })
        let comments=await prisma.comment.findMany({
            where:{
                Image:{
                    id:Number(imageId)
                }
            },
        })
        console.log("COMMENTS",comments)
        socket.broadcast.emit("receiveComment",comments)
    })
})

server.listen(3001,()=>{
    console.log("listening on *:3001");
});