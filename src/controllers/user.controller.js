import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };
