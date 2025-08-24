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
router.route('/addTweet').post(verifyJWT,addTweet) //working
router.route('/getAllTweets').get(verifyJWT,getAllTweets) //working
router.route('/getTweetById/:tweetId').get(verifyJWT,getTweetById) //working
router.route('/getUsersTweet/:userId').post(verifyJWT,getUserTweets) //working
router.route('/updateTweet/:tweetId').patch(verifyJWT,updateTweet)  //working
router.route('/deleteTweet/:tweetId').patch(verifyJWT,deleteTweet).delete(verifyJWT,deleteTweet) //working
router.route('/searchTweets').post(searchTweets) //working
router.route('/getTweetByDateRange').get(getTweetsByDateRange) //working
router.route('/getTweetStats').get(verifyJWT,getTweetStats) //working
