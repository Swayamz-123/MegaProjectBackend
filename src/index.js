// Import dotenv for environment variable management
// require('dotenv') .config({path : './env'})  //more improved   ek taraf require aur ek taraf import code ki consistency ko kharab karta hai
import dotenv from "dotenv"   //alternate import then config
import { app } from "./app.js";

// Import database connection function
import connectDB from "./db/index.js";

// Configure dotenv to load environment variables from ./env file
dotenv.config({
    path: './env'   
})

// Connect to database and start server
connectDB()   //to connectdb   async function always return a promise chahe return ho ya na ho wo automatic sabko promise me wrap kar deta hai on calling we will get a promise
// Handle successful database connection
.then(()=>{
    // Start Express server after successful database connection
    app.listen(process.env.PORT || 8000,()=>{   //database connect toh ho gya par app ne listen karna chalu nhi kiya //kuch nhi mila toh 8000 use kar lo
        // Log server start message with port number
        console.log(`Server is runnning at port : ${process.env.PORT}`);
        
    })
})
// Handle database connection failure
.catch((err)=>{
    // Log database connection error
    console.log("mongodb connection failed !!!" , err);
    
})








//approach 1
/*
import express from "express";
const app = express()
;(async ()=>{   //ifee   async function hi likhenge taki dusra kaam ruke na
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/     /// data aane me time lagta hai wait kro
            ${DB_NAME}`)
            app.on("error",(error)=>{    // to know whether there is any error in express
                console.log("ERR : ",error);
                throw error
            })

            app.listen(process.env.PORT,()=>{   //process ke andar env se port ko uthao
                console.log(`App is listening on ${process.env.PORT}`);
                
            })
        
    } catch (error) {
        console.log("ERROR : ",error)
        throw error
    }
})()  */