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
router.route('/commentowner/:commentId').get(verifyJWT,checkCommentOwnership) //working
router.route('/commentcount/:videoId').get(getCommentCount) //working
router.route('/getvideocomments/:videoId').get(getVideoComments) //working
router.route('/getusercomments').get(verifyJWT,getUserComments)  //working
router.route('/updatecomment/:commentId').post(verifyJWT,updateComment)  //working
router.route('/deletecomment/:commentId').delete(verifyJWT,deleteComment) //working
router.route('/addcomment/:videoId').post(verifyJWT,addComment) //working
router.route('/getlatestcomment/:videoId').get(getLatestComment)  //working
export default router