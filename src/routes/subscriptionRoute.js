import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import {
subscribeChannel,
  unsubscribeChannel,
  getMySubscribers,
  getMySubscribedChannels,
  getSubscriberCount,
  getSubscriptionStatus,
} from '../controllers/subscription.controller.js'

const router = Router()
router.route('/subscribeChannel/:channelId').post(verifyJWT,subscribeChannel) //working
router.route('/unsubscribeChannel/:channelId').post(verifyJWT,unsubscribeChannel) //working
router.route('/getMySubscribers').get(verifyJWT,getMySubscribers)    //working 
router.route('/getMySubscribedChannel').get(verifyJWT,getMySubscribedChannels)  //working 
router.route('/getSubscriberCount/:channelId').get(getSubscriberCount)   //working
router.route('/getSubscriptionStatus/:channelId').get(verifyJWT,getSubscriptionStatus) //working 
export default router