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

router.route('/video/:videoId').post(toggleLike);
router.route('/tweet/:tweetId').post(toggleLikeonTweet);
router.route('/comment/:commentId').post(toggleCommentLikes);
router.route('/videos').get(getLikedVideos);
router.route('/status').post(getLikeStatus);
router.route('/count/:itemType/:itemId').get(getLikesCount);
router.route('/likers/:itemType/:itemId').get(getItemLikers);

export default router;