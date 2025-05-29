import { Promise } from "mongoose"

const asyncHandler = (requestHandler)=>{     
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
    }
}


export {asyncHandler}

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

