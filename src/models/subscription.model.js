import mongoose , {Schema} from "mongoose";
const subscriptionSchema  = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,   //one  who  is subscibing
        ref: "User"
    },
    channel:{
     type:  Schema.Types.ObjectId,  //to whom it is subscribing
     ref:"User"
    }
},{timestamps:true})

export const Subscription= mongoose.model("Subscription",subscriptionSchema)