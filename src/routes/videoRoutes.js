import { Router } from "express";
import { upload} from "../middlewares/multer.middleware.js";
import {
    uploadVideo,
    deleteVideo,
    updateVideo,
    getAllVideos,
    getVideoById,
    getUserVideos,
    togglePublishStatus
} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router=Router();
export default router
router.route('/uploadVideo')
  .post(
    verifyJWT,
    upload.fields([
      { name: "videoFile", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 }
    ]),
    uploadVideo
  );

router.route('/deleteVideo/:videoId').delete(verifyJWT,deleteVideo)  //working
router.route('/updateVideo/:videoId').patch(verifyJWT,updateVideo)   //working
router.route('/getAllVideos').get(getAllVideos)  //working
router.route('/getVideosById/:videoId').get(getVideoById)  //working
router.route('/getUserVideos/:userId').get(verifyJWT,getUserVideos)  //working
router.route('/togglePublishStatus/:videoId').patch(verifyJWT,togglePublishStatus)  //working

