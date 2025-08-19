// Import Express framework
import express from "express"
// Import CORS middleware for cross-origin requests
import cors from 'cors'
// Import cookie parser middleware for handling cookies
import cookieParser from "cookie-parser"

// Create Express application instance
const app = express()    // ek app banate hai express ke through

// Configure CORS middleware with environment-based origin and credentials
app.use(cors({
    origin:process.env.CORS_ORIGIN, // Set allowed origin from environment variable
    credentials:true, // Allow credentials (cookies, headers) in CORS requests
}))

// Configure Express to parse JSON payloads with size limit
app.use(express.json({limit: "16kb"}))

// Configure Express to parse URL-encoded data with extended mode and size limit
app.use(express.urlencoded({extended:true ,limit : "16kb"}))

// Serve static files from public directory
app.use(express.static("public"))

// Enable cookie parsing middleware
app.use(cookieParser())

// Export the configured Express app
//import routes
import userRouter from './routes/user.routes.js'
import tweetRouter from './routes/tweetRoutes.js'

//routes declaration  
// app.use('/users' ,userRouter)   //router ka naam plus kisko activate karana hai     // ab https://localhost:8000/users/login likhte hi control user router ko milega aur wo fir register ko de dega
 
app.use("/api/v1/users",userRouter)   //good practice  https://localhost:8000/api/v1/users/register

app.use("/api/v1/tweets",tweetRouter) 
export {app}