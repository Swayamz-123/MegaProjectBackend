import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
     checkCommentOwnership,
    getCommentCount,
    getVideoComments,
    getUserComments,
    updateComment,
    deleteComment,
    addComment,
    getLatestComment

} from '../controllers/comment.controller.js'
import { Router } from "express";
const router = Router()
router.use(verifyJWT)
router.route('/commentowner/:commentId').post(verifyJWT,checkCommentOwnership)
router.route('/commentcount/:videoId').post(getCommentCount)
router.route('/getvideocomments/:videoId').post(getVideoComments)
router.route('/getusercomments').post(verifyJWT,getUserComments)
router.route('/updatecomment/:commentId').post(verifyJWT,updateComment)
router.route('/deletecomment/:commentId').post(verifyJWT,deleteComment)
router.route('/addcomment/:videoId').post(verifyJWT,addComment)
router.route('/getlatestcomment/:videoId').post(getLatestComment)
export default router