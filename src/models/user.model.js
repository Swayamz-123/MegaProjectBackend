// Import mongoose and Schema from mongoose library
import mongoose,{Schema} from "mongoose";
// Import JWT library for token generation
import jwt from "jsonwebtoken"
// Import bcrypt library for password hashing
import bcrypt from "bcrypt"

// Define user schema with all required fields and configurations
const userSchema = new Schema(
    {
        // Username field with validation and optimization settings
        username:{
            type:String, // Data type is String
            required: true, // Field is mandatory
            unique:true, // Must be unique across all users
            lowercase:true, // Convert to lowercase before saving
            trim:true, // Remove whitespace from beginning and end
            index:true,   // for searcching in optimised away
        },
        // Duplicate username field (this appears to be an error in original code)
        username:{
            type:String, // Data type is String
            required: true, // Field is mandatory
            unique:true, // Must be unique across all users
            lowercase:true, // Convert to lowercase before saving
            trim:true, // Remove whitespace from beginning and end
            
        },
        // Email field with validation settings
        email:{
            type:String, // Data type is String
            required: true, // Field is mandatory
            unique:true, // Must be unique across all users
            lowercase:true, // Convert to lowercase before saving
            trim:true, // Remove whitespace from beginning and end
            
        },
        // Full name field with indexing for search optimization
        fullName:{
            type:String, // Data type is String
            required: true, // Field is mandatory
            index:true, // Create index for faster searching
            trim:true, // Remove whitespace from beginning and end
            
        },
       // Avatar image URL field (stored as Cloudinary URL)
       avatar:{
            type:String,    //cloudinary url
            required: true, // Field is mandatory
            
            
        },
        // Cover image URL field (optional)
        coverImage:{
            type:String,    // Data type is String
            
            
        },
        // Array to store user's watch history as video references
        watchHistory:[
            {
                type:Schema.Types.ObjectId, // Reference to video document
                ref:"video" // Reference to Video model
            }
        ],
        // Password field with custom validation message
        password:{
          type:String, // Data type is String
          required:[true,'password is required'] // Field is mandatory with custom error message
        },
        // Refresh token field for JWT authentication
        refreshTokens:{
       type:String // Data type is String
        },
       
    },
    {
    // Add createdAt and updatedAt timestamps automatically
    timestamps:true
    }
)

// Pre-save middleware to hash password before saving to database
userSchema.pre("save",async function(next){
    // Only hash password if it has been modified
    if(!this.isModified("password"))  return next();
     // Hash the password with 10 salt rounds
     this.password = bcrypt.hash(this.password,10)   //no of hash round
     // Call next to continue with save operation
     next()
})    //do not use arrown fn because no reference of this   next for middleware

// Custom method to verify if provided password matches stored hash
//custom hooks
userSchema.methods.isPasswordCorrect = async function
(password){
  // Compare provided password with stored hash and return boolean result
  return  await bcrypt.compare(password,this.password)     //return true or false 
}

// Custom method to generate JWT access token
userSchema.methods.generateAccessToken = function(){   // yaha time nhi lagta hai uthna so no async
    // Create and return JWT token with user data and expiration
    return jwt.sign({
        _id:this._id, // User ID
        email : this.email, // User email
        username: this.username, // Username
        fullName:this.fullname, // Full name
    },
// Use access token secret from environment variables
process.env.ACCESS_TOKEN_SECRET,
{
// Set token expiration time from environment variables
expiresIn:process.env.ACCESS_TOKEN_EXPIRY
}
)
}

// Custom method to generate JWT refresh token
userSchema.methods.generateRefreshToken = function(){
    // Create and return JWT refresh token with minimal user data
    return jwt.sign({
        _id:this._id, // Only include user ID in refresh token
       
    },
// Use refresh token secret from environment variables
process.env.REFRESH_TOKEN_SECRET,
{
// Set refresh token expiration time from environment variables
expiresIn:process.env.REFRESH_TOKEN_EXPIRY
}
)
}

// Create and export User model from the schema
export const User = mongoose.model("User",userSchema)