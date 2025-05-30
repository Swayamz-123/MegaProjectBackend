// Import mongoose for MongoDB database connection
import mongoose from "mongoose";
// Import database name constant from constants file
import { DB_NAME } from "../constants.js";


// Define async function to connect to MongoDB database
//yeh code ko barbar likhne se acha hum isse ek async handler me daal dete hai
const connectDB = async()=>{   //database is in another continent   //await returns the resolved value of promise
  // Use try-catch block to handle potential connection errors
  try {
   // Connect to MongoDB using connection string from environment variable and database name
   const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)  //yaha se ek object return aayeha jo connectioninstance me store hoga
   // Log successful connection with database host information
   console.log(`\nMongo db connected!! DB host : ${connectionInstance.connection.host}`);
   
  } catch (error) {    
    // Log any connection errors that occur
    console.log("mongo db connection failed: ",error);
    // Exit the process with error code 1 if connection fails
    process.exit(1)   //process ek method hai jo exit kar rha with code 1
  }
}

// Export the connectDB function as default export
export default connectDB