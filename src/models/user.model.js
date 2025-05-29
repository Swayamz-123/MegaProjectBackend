import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const userSchema = new Schema(
    {
        username:{
            type:String,
            required: true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true,   // for searcching in optimised away
        },
        username:{
            type:String,
            required: true,
            unique:true,
            lowercase:true,
            trim:true,
            
        },
        email:{
            type:String,
            required: true,
            unique:true,
            lowercase:true,
            trim:true,
            
        },
        fullName:{
            type:String,
            required: true,
            index:true,
            trim:true,
            
        },
       avatar:{
            type:String,    //cloudinary url
            required: true,
            
            
        },
        coverImage:{
            type:String,    
            
            
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"video"
            }
        ],
        password:{
          type:String,
          required:[true,'password is required']
        },
        refreshTokens:{
       type:String
        },
       
    },
    {
    timestamps:true
    }
)
userSchema.pre("save",async function(next){
    if(!this.isModified("password"))  return next();
     this.password = bcrypt.hash(this.password,10)   //no of hash round
     next()
})    //do not use arrown fn because no reference of this   next for middleware

//custom hooks
userSchema.methods.isPasswordCorrect = async function
(password){
  return  await bcrypt.compare(password,this.password)     //return true or false 
}

userSchema.methods.generateAccessToken = function(){   // yaha time nhi lagta hai uthna so no async
    return jwt.sign({
        _id:this._id,
        email : this.email,
        username: this.username,
        fullName:this.fullname,
    },
process.env.ACCESS_TOKEN_SECRET,
{
expiresIn:process.env.ACCESS_TOKEN_EXPIRY
}
)
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id:this._id,
       
    },
process.env.REFRESH_TOKEN_SECRET,
{
expiresIn:process.env.REFRESH_TOKEN_EXPIRY
}
)
}
export const User = mongoose.model("User",userSchema)