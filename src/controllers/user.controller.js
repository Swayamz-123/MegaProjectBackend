import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessandRefreshTokens  = async(userId)=>{
  try {
  const user=  await User.findById(userId)
  const accessToken =user.generateAccessToken()
  const refreshToken= user.generateRefreshToken()
  user.refreshToken=refreshToken
  await user.save({validateBeforeSave:false})
  return  {accessToken,refreshToken}
  } catch (error) {
      throw new ApiError(500,"spmething went wrong while generating access and refresh tokens")
  }
}
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation saara proper validation - !empty
  // check if user already exist: username and email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object (for data sending to db) - create entry in db // user data sent to db
  // remove password and refresh token  user ko nhi dena chahenge
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;

  if (!fullName || !email || !username || !password) {
    throw new ApiError(400, "All fields are required");
  }

  if (
    [fullName, email, username, password].some(
      (field) => typeof field !== "string" || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields must be non-empty strings");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();

  // 🔍 LOG: Inputs you're about to query
  console.log("Searching for existing user with:", normalizedEmail, normalizedUsername);

  const existedUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
  });

  // ✅ IF user already exists
  if (existedUser) {
    console.log("User found in DB:", existedUser);
    throw new ApiError(409, "user already exist for this username and email");
  }

  // safely access multer files with optional chaining
  const avatarLocalPath = req.files?.avatar?.[0]?.path; // multer middleware deta hai access
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is mandatory");
  }

  // upload avatar to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  // upload cover image only if it exists
  const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // database me entry
  const user = await User.create({
    fullName: fullName.trim(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email: normalizedEmail,
    password,
    username: normalizedUsername,
  });

  const createdUser = await User.findById(user._id).select(
    // isme likte hai kya kya nhi chahiye
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res.status(201).json(new ApiResponse(200, createdUser, "user registered Succesfully"));
});
const loginUser = asyncHandler(async(req,res)=>{
  //req.body=> data
  //username or email
  //find the user
  //check password
  //access and refresh token
  //send cookies
  //response : successfully logined

  const {email,username,password}= req.body

  if(!username && !email){
    throw new ApiError(400," username or email is required");
  }
  const user =await  User.findOne({
    $or:[{username},{email}]
  })
    if(!user){
      throw new ApiError(404,"user not found")
    }   //user has been checked where it is registered or not

    //now check password
   const isPasswordValid=await user.isPasswordmyCorrect(password)
   if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentals")
   }
 const {accessToken,refreshToken}= await generateAccessandRefreshTokens(user._id)
 const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
 //sending cookies
 const options = {
  httpOnly:true,
  secure:true   //koi bhi modify kar sakta hai cookies ko so secure kar diya
 }

 return res.status(200)
 .cookie("accessToken",accessToken,options)
 .cookie("refreshToken",refreshToken,options)
 .json(
  new ApiResponse(
    200,
    {
      user:loggedInUser,accessToken,refreshToken
    },
    "User logged In successfully"
  )
 )

})
const logoutUser = asyncHandler(async(req,res)=>{
 await User.findByIdAndUpdate(
    req.user._id,{
      $set : {
        refreshToken:undefined
      }
    },
    {
      new:true
    }
  )
  const options = {
  httpOnly:true,
  secure:true   //koi bhi modify kar sakta hai cookies ko so secure kar diya
 }

 return res
 .status(200)
 .clearCookie("accessToken",options)
 .clearCookie("refreshToken",options)
 .json(new ApiResponse(200,{},"user logged out succcessfully"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
  const incomingRefreshToken =  req.cookies.refreshToken  || req.body.refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(401 , "unauthorised request ")
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.ACCESS_REFRESH_TOKEN
    )
    const user= await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401,"Invalid refresh token")
    }
    if(incomingRefreshToken!==user?.refreshToken){
      throw new ApiError(401,"refresh token is expired or used")
    }
    const options = {
      httpOnly:true,
      secure:true
    }
    const {accessToken,newRefreshToken}=await generateAccessandRefreshTokens(user._id)
    return res
    .status(200)
    .cookie("access token",accessToken,options)
    .cookie("refresh token",newRefreshToken,options)
    .json (
      new ApiResponse(
        200,
        {accessToken,refreshToken:newRefreshToken},
        "access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
  }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}= req.body
  const user = await User.findById(req.user?._id)
  const isPaaswordCorrect =await user.isPaaswordCorrect(oldPassword)
  if(!isPaaswordCorrect){
    throw new ApiError(400,"invalid old password")
  }
  user.password= newPassword
  await user.save({validateBeforeSave:false})
  return res
  .status(200)
  .json(new ApiResponse(200,{},"Password changed succesfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res.status(200).json(200,req.user,"Current user fetched successfully")
})
const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullName,email}  = req.body
  if(!fullName || !email){
    throw new ApiError(400,"all field are required")
  }
  const user=await User.findByIdAndUpdate(
    req.user?._id,
  {
    $set:{
      fullName,
      email:email
    }
  },
  {new:true}).select("-password")
  return res
  .status(200)
  .json(new ApiResponse(200,user,"Account details updated successfully"))
})

//todo: delete old image = assignment

const updateUserAvatar= asyncHandler(async(req,res)=>{
  const avatarLocalPath= req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing")
  }

 const avatar= await uploadOnCloudinary(avatarLocalPath)
 if(!avatar.url){
  throw new ApiError(400,"error while uploading on avatar")
 }
 const user=await User.findById(
  req.user?._id,
  {
    $set:{
      avatar:avatar.url
    }
  },
  {new:true}
 ).select("-password")
 res.status(200).json(new ApiResponse(200,user,"avatar image updated succesfully"))
})

const updateUserCoverImage= asyncHandler(async(req,res)=>{
  const coverImageLocalPath= req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover Image file is missing")
  }

 const coverImage= await uploadOnCloudinary(coverImageLocalPath)
 if(!coverImage.url){
  throw new ApiError(400,"error while uploading on coverImage")
 }
 const user=await User.findById(
  req.user?._id,
  {
    $set:{
     coverImage:coverImage.url
    }
  },
  {new:true}
 ).select("-password")
 res.status(200).json(new ApiResponse(200,user,"coverImage updated succesfully"))
})
//getCurrentUserschannelProfile
const getCurrentUserChannelProfile= asyncHandler(async(req,res)=>{
  const {username}=req.params
  if(!username?.trim()){
    throw new ApiError(400,)
  }
  const channel=await User.aggregate([
    {
      $match:{
        username : username?.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size: "$subscribers"
        } ,
        channelsSubscribedToCount : {
          $size: " $subscribedTo"
        },
        isSubscibed:{
          $cond:{
            if:{$in : [req.user?._id, "$subscribers.subscriber"]},
            then : true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullName:1,
        username : 1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        isSubscibed:1,
        avatar:1,
        coverImage : 1,
        email: 1
      }
    }
  ])  // match kisi particular ko lega aur match karega
  if(!channel?.length){
    return new ApiError(404,"channel doesnt exist")
  }

  return res
  .status(200)
  .json(new ApiResponse(200,channel[0],"user channel fetched successfully"))
})
const getWatchHistory = asyncHandler(async(req,res)=>{
 const user = await  User.aggregate([
  {
    $match:{
      _id:new mongoose.Types.ObjectId(req.user._id)  //direct req.user._id  nhi use kar sakte kyunki waha se string return hota  hai jisko mongoose automatic karta hai convert
    }
  }
 ])
})
export { registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
    ,changeCurrentPassword
    ,getCurrentUser
    ,updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getCurrentUserChannelProfile,
    getWatchHistory
    
};
