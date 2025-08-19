import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addTweet,
    getAllTweets,
    getTweetById,
    getUserTweets,
    updateTweet,
    deleteTweet,
    searchTweets,
    getTweetsByDateRange,
    getTweetStats
} from '../controllers/tweet.controller.js'
const router=Router()
export default router
router.route('/addTweet').post(verifyJWT,addTweet)
router.route('/getAllTweets').get(verifyJWT,getAllTweets)
router.route('/getTweetById/:tweetId').get(verifyJWT,getTweetById)
router.route('/getUsersTweet/:userId').post(verifyJWT,getUserTweets)
router.route('/updateTweet/:tweetId').patch(verifyJWT,updateTweet)
router.route('/deleteTweet/:tweetId').patch(verifyJWT,deleteTweet).delete(verifyJWT,deleteTweet)
router.route('/searchTweets').post(searchTweets)
router.route('/getTweetByDateRange').get(getTweetsByDateRange)
router.route('/getTweetStats').get(verifyJWT,getTweetStats)
