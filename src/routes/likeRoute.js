import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleLike,
    toggleLikeonTweet,
    toggleCommentLikes,
    getLikedVideos,
    getLikeStatus,
    getLikesCount,
    getItemLikers
} from '../controllers/like.controller.js';

const router = Router();

router.use(verifyJWT);

router.route('/video/:videoId').post(toggleLike); //working
router.route('/tweet/:tweetId').post(toggleLikeonTweet); //working
router.route('/comment/:commentId').post(toggleCommentLikes); //working
router.route('/videos').get(getLikedVideos); //working
router.route('/status').get(getLikeStatus);  //working
router.route('/count/:itemType/:itemId').get(getLikesCount);  //working
router.route('/likers/:itemType/:itemId').get(getItemLikers); //working

export default router;