import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


//yeh code ko barbar likhne se acha hum isse ek async handler me daal dete hai
const connectDB = async()=>{   //database is in another continent   //await returns the resolved value of promise
  try {
   const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)  //yaha se ek object return aayeha jo connectioninstance me store hoga
   console.log(`\nMongo db connected!! DB host : ${connectionInstance.connection.host}`);
   
  } catch (error) {    
    console.log("mongo db connection failed: ",error);
    process.exit(1)   //process ek method hai jo exit kar rha with code 1
  }
}

export default connectDB