// Import Promise from mongoose (though this seems unnecessary)
import { Promise } from "mongoose"

// Higher-order function to wrap async route handlers and catch errors
const asyncHandler = (requestHandler)=>{     
    // Return middleware function that handles async operations
    (req,res,next)=>{
        // Resolve the async request handler and catch any errors
        Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
    }
}

// Export the asyncHandler function
export {asyncHandler}

// Alternative implementation (commented out)
// const asyncHandler=(fn)=>async (req,res,next)=>{     //ek fn ko dusre fn me pass kiya
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(err.code ||500).json({
//             success:false,
//             message : err.message
        
//         })
//     }
// }