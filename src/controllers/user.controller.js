import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
const registerUser = asyncHandler(async (req,res)=>{
    //get user  detials from frontend
    //validation saara proper validation  validation - !empty
    //check if user already exist   : username and email
    //check for images,check for avatar
    //upload them to cloudinary,avatar
    //create user object (for data sending to db)-create entry in db   //user data sent to db
    //remove password and refresh token   user ko nhi dena chahenge
    //check for user creation
    //return res

    const { fullName,email,username,password}=req.body   //to get all user details
    console.log("fullname: " ,fullName)
    
  console.log("email :",email)

  // if(fullName==""){
  //   throw new ApiError(400,"fullname is required")
  // }  //bacche log

  //badelog
  if(
    [fullName,email,username,password].some((field)=>field?.trim()==="")
  ){
    throw new ApiError(400,"All fields are required")
  }
  const existedUser=User.findOne({
    $or:[{username},{email}]
  })

  if(existedUser){
    throw new ApiError(409,"user with email or username already exist")
  }

 const avatarLocalPath= req.files?.avatar[0]?.path  ;  //multer middleware deta hai access
 const coverImageLocalPath=req.files?.coverImage[0]?.path ;

 if(!avatarLocalPath){
      throw new ApiError(400,"Avatar file is mandatory")
 }
const avatar= await uploadOnCloudinary(avatarLocalPath)
const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    

if(!avatar){
  throw new ApiError(400,"Avatar file is required")
}


//database me entry
const  user= await User.create({
  fullName,
  avatar:avatar.url,
  coverImage:coverImage?.url || "",
  email,
  password,
  username:username.toLowerCase()
})
const createdUser=await User.findById(user._id).select(   //isme likte hai kya kya nhi chahiye
  "-password -refreshToken"
)
if(!createdUser){
  throw new ApiError(500,"Something went wrong  while registerring the user")
}

return res.status(201).json(
  new ApiResponse(200,createdUser,"user registered Succesfully")
)
    
})

export {registerUser,}