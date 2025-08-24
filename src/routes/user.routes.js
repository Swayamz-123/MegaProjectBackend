import { Router } from "express";
import { changeCurrentPassword,
    getCurrentUser,
    getCurrentUserChannelProfile,
    getWatchHistory,
    loginUser,
     logoutUser, 
    refreshAccessToken,
     registerUser,
    updateAccountDetails, 
    updateUserAvatar,
    updateUserCoverImage
     }
      from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },{
            name: "coverImage",
            maxCount:1
        }
    ]),
    registerUser
)      
router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,logoutUser)
export default router

router.route("/refresh-token").post(refreshAccessToken)  //working
router.route("/change-password").post(verifyJWT,changeCurrentPassword)  //working
router.route("/current-user").get(verifyJWT,getCurrentUser)   //working
router.route("/update-account").patch(verifyJWT,updateAccountDetails)   //patch to update single detail //working
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar) //working
router.route("/cover-Image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)  //working
router.route("/c/:username").get(verifyJWT,getCurrentUserChannelProfile)  //working
router.route("/history").get(verifyJWT,getWatchHistory)  //working
