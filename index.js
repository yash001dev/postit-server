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
    const rooms = []; // define the rooms array

    //Join a Image Room
    socket.on("join-image-room",async({imageId})=>{
        socket.join(`image-${imageId}`);
    });

    //Get All Comments
    socket.on("get-all-comments",async({imageId})=>{
        console.log("IT IS WORKING::")
        let comments=prisma.comment.findMany({
            where:{
                Image:{
                    id:Number(imageId)
                }
            },
        })
        const currentComments=await comments;
        console.log("CURRENT COMMENTS:",currentComments)
        io.to(`image-${imageId}`).emit("receive-all-comments",currentComments)
    })

    //For Creating Comment
    socket.on('new-comment',async({body,author,imageId,x,y})=>{
        const newComment=prisma.comment.create({
            data:{
                body,
                x,
                y,
                User:{
                    connect:{
                        email:author?.email
                    }
                },
                Image:{
                    connect:{
                        id:Number(imageId)
                    }
                },
                updatedAt: new Date(),
            },
            select:{
                id:true,
                body:true,
                x:true,
                y:true,
                updatedAt:true,
                User:{
                    select:{
                        email:true,
                        name:true,
                        id:true,
                    }
                }
            }
        })
        const comment=await newComment;
        console.log("Latest Comment:",comment)
        io.to(`image-${imageId}`).emit("new-comment",comment)

        socket.on("disconnect",()=>{
            socket.leave(`image-${imageId}`)
        })
    })

    //For Editing Comment
    socket.on('edit-comment',async({body,imageId,commentId})=>{
        const newComment=prisma.comment.update({
            where:{
                id:Number(commentId)
            },
            data:{
                body,
                updatedAt: new Date(),
            },
            select:{
                id:true,
                body:true,
                x:true,
                y:true,
                updatedAt:true,
                User:{
                    select:{
                        email:true,
                        name:true,
                        id:true,
                    }
                }
            }
        })  
        const comment=await newComment;
        console.log("Updated Comment:",comment)
        io.to(`image-${imageId}`).emit("edit-comment",comment)
    })

    //For Deleting Comment
    socket.on('delete-comment',async({imageId,commentId})=>{
        const newComment=prisma.comment.delete({
            where:{
                id:Number(commentId)
            },
        })
        const comment=await newComment;
        console.log("Deleted Comment:",comment)
        io.to(`image-${imageId}`).emit("delete-comment",comment)
    })
    




    //FIXME: For Testing
    // For Get All Comments
    socket.on("getAllComments",async(imageId)=>{
        console.log("IT IS WORKING::")
        let comments=await prisma.comment.findMany({
            where:{
                Image:{
                    id:Number(imageId)
                }
            },
        })
        socket.emit("receiveAllComments",comments)
    })

    //For Creating Comment
    socket.on("sendComment",async({body,author,imageId,x,y
    })=>{
        console.log("BODY:",x,y,body,author,imageId)
        let currentUser=await prisma.user.findUnique({
            where:{
                email:author?.email
            }
        })
        //For Creating Comment
        let latestComment=prisma.comment.create({
            data:{
                body,
                x,
                y,
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
            },
            select:{
                id:true,
                body:true,
                x:true,
                y:true,
                updatedAt:true,
                User:{
                    select:{
                        email:true,
                        name:true,
                        id:true,
                    }
                }
            }
        })
        const comment=await latestComment;
        console.log("Latest Comment:",comment)
        socket.broadcast.emit("receiveComment",comment)
    })

    socket.on("editComment",async({body,imageId,commentId})=>{
       
        //For Creating Comment
        let latestComment=prisma.comment.update({
            where:{
                id:Number(commentId)
            },
            data:{
                body,
                updatedAt: new Date(),
            },
            select:{
                id:true,
                body:true,
                x:true,
                y:true,
                updatedAt:true,
                User:{
                    select:{
                        email:true,
                        name:true,
                        id:true,
                    }
                }
            }
        })
        const comment=await latestComment;
        console.log("Latest Comment:",comment)
        socket.broadcast.emit("receiveComment",comment)
    })
    


    //Add a user to a room
    socket.on("joinRoom",(data)=>{
        const {email,room}=data;
        socket.join(room);

        //Send a message to the room that a new user has joined
        socket.to(room).emit("newUser",email);
    })
})

server.listen(3001,()=>{
    console.log("listening on *:3001");
});