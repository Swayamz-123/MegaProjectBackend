import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getChannelStats,
    getVideoAnalytics,
    getAdminStats,
    getUploadSummary
} from '../controllers/dashboard.controller.js';

const router = Router();

router.use(verifyJWT);

router.route('/channel-stats').get(getChannelStats);  //working
router.route('/video-analytics').get(getVideoAnalytics); //working
router.route('/upload-summary').get(getUploadSummary); //working
router.route('/admin-stats').get(getAdminStats); //working

export default router;