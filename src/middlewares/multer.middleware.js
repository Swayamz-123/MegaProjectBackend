// Import multer library for handling multipart/form-data (file uploads)
import multer from "multer";

// Configure disk storage for multer to define where and how files are stored
const storage = multer.diskStorage({
  // Define destination directory where uploaded files will be stored
  destination: function (req, file, cb) {
    // Set destination to ./public/temp directory using callback
    cb(null, "./public/temp")
  },
  // Define how uploaded files should be named
  filename: function (req, file, cb) {
    // Keep the original filename of the uploaded file
    cb(null, file.originalname)
  }
})

// Create and export multer instance with the configured storage
export const upload = multer(
    { storage ,}
)