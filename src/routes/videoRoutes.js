import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
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

router.route('/deleteVideo/:videoId').delete(verifyJWT,deleteVideo)
router.route('/updateVideo').patch(verifyJWT,updateVideo)
router.route('/getAllVideos').get(getAllVideos)
router.route('/getVideosById/:videoId').get(getVideoById)
router.route('/getUserVideos').get(verifyJWT,getUserVideos)
router.route('/togglePublishStatus').patch(verifyJWT,togglePublishStatus)

