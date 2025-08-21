// Import Cloudinary v2 SDK with alias
import {v2 as cloudinary} from "cloudinary"
// Import file system module for file operations
import fs from "fs"





    // Configuration
    // Configure Cloudinary with environment variables
    cloudinary.config({ 
        // Set cloud name from environment variable
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        // Set API key from environment variable
        api_key: process.env.CLOUDINARY_CLOUD_KEY, 
        // Set API secret from environment variable
        api_secret: process.env.CLOUDINARY_CLOUD_SECRET // Click 'View API Keys' above to copy your API secret
    });
    
    // Async function to upload file to Cloudinary
    const uploadOnCloudinary = async (localFilePath)=>{
        // Try-catch block to handle upload errors
        try {
            // Return null if no file path provided
            if(!localFilePath) return null
            //upload the file on cloudinary
            // Upload file to Cloudinary with auto resource type detection
           const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type :"auto" // Automatically detect file type
            })
            //file has been uploaded succesfully
            // Log successful upload with file URL
            // console.log("File is uploaded on cloudinary",response.url);
            fs.unlinkSync(localFilePath)
            // Return the complete upload response
            // console.log(response);
            
            return response
            
        } catch (error) {
            // Remove local file if upload fails to clean up temporary files
            fs.unlinkSync(localFilePath)  //remove the locally saved temprorary file as the upload operation failed
            // Return null if upload fails
            return null;
        }
    }
    // First, configure Cloudinary with your cloud name, API key, and API secret.
// This is typically done in a separate configuration file.





// Assuming you have the public_id of the image you want to delete

// Call the destroy method
  const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { 
      resource_type: 'video' 
    });
    return result;
  } catch (error) {
    console.error('Cloudinary deletion failed:', error);
    throw new Error('Failed to delete video from Cloudinary.');
  }
};

    // Export the upload function
    export {uploadOnCloudinary,deleteFromCloudinary}