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
router.route('/subscribeChannel/:channelId').post(verifyJWT,subscribeChannel)
router.route('/unsubscribeChannel/:channelId').post(verifyJWT,unsubscribeChannel)
router.route('/getMySubscribers').post(verifyJWT,getMySubscribers)
router.route('/getMySubscribedChannel/').post(verifyJWT,getMySubscribedChannels)
router.route('/getSubscriberCount/:channelId').post(getSubscriberCount) 
router.route('/getSubscriptionStatus/:channelId').post(verifyJWT,getSubscriptionStatus) 
export default router