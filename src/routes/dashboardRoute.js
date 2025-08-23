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

router.route('/channel-stats').get(getChannelStats);
router.route('/video-analytics').get(getVideoAnalytics);
router.route('/upload-summary').get(getUploadSummary);
router.route('/admin-stats').get(getAdminStats);

export default router;