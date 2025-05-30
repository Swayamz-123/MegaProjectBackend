// Import mongoose and Schema from mongoose library
import mongoose,{Schema} from "mongoose";
// Import mongoose aggregate paginate plugin for pagination in aggregation queries
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Define video schema with all required fields
const videoSchema = new Schema(
    {
       // Video file URL field (stored as Cloudinary URL)
       videoFile:{
        type:String, // cloudnary url
        required : true, // Field is mandatory
       },
       // Thumbnail image URL field
       thumbnail :{
           type:String, // Data type is String
           required:true, // Field is mandatory
       },
       // Video title field
       title :{
           type:String, // Data type is String
           required:true, // Field is mandatory
       },
       // Video description field
       description :{
           type:String, // Data type is String
           required:true, // Field is mandatory
       },
      // Video duration in seconds/minutes
      duration :{
           type:Number, // Data type is Number
           required:true, // Field is mandatory
       },
       // View count with default value
       views:{
        type:Number, // Data type is Number
        default:0 // Default value is 0 views
       },
       // Publication status with default value
       isPublished:{
        type:Boolean, // Data type is Boolean
        default:true // Default value is true (published)
       },
       // Reference to the user who owns this video
       owner:{
        type:Schema.Types.ObjectId, // Reference to user document
        ref:"User" // Reference to User model
       }
    },
    {
    // Add createdAt and updatedAt timestamps automatically
    timestamps:true
    }
    
)

// Add aggregate pagination plugin to video schema for paginated queries
videoSchema.plugin(mongooseAggregatePaginate)

// Create and export Video model from the schema
export const Video = mongoose.model("Video",videoSchema)