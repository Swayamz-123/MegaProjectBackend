import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

// Get user's channel statistics
const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Get basic video statistics
    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
                publishedVideos: {
                    $sum: { $cond: [{ $eq: ["$isPublished", true] }, 1, 0] }
                },
                unpublishedVideos: {
                    $sum: { $cond: [{ $eq: ["$isPublished", false] }, 1, 0] }
                }
            }
        }
    ]);

    // Get most viewed video
    const mostViewedVideo = await Video.findOne({
        owner: userId,
        isPublished: true
    })
    .sort({ views: -1 })
    .select('title views thumbnail createdAt');

    // Get latest 5 videos
    const latestVideos = await Video.find({ owner: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title views isPublished createdAt thumbnail');

    const stats = videoStats[0] || {
        totalVideos: 0,
        totalViews: 0,
        publishedVideos: 0,
        unpublishedVideos: 0
    };

    const channelData = {
        ...stats,
        mostViewedVideo,
        latestVideos
    };

    return res.status(200).json(
        new ApiResponse(200, channelData, "Channel statistics fetched successfully")
    );
});

// Get video performance for last 30 days
const getVideoAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    // Last 30 days date
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Videos uploaded in last 30 days
    const recentVideos = await Video.find({
        owner: userId,
        createdAt: { $gte: thirtyDaysAgo }
    })
    .sort({ createdAt: -1 })
    .select('title views createdAt isPublished');

    // Total views in last 30 days
    const recentViewsStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                createdAt: { $gte: thirtyDaysAgo }
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
                totalVideos: { $sum: 1 }
            }
        }
    ]);

    // Top 5 performing videos (all time)
    const topVideos = await Video.find({
        owner: userId,
        isPublished: true
    })
    .sort({ views: -1 })
    .limit(5)
    .select('title views createdAt thumbnail');

    const analytics = {
        last30Days: {
            totalVideos: recentViewsStats[0]?.totalVideos || 0,
            totalViews: recentViewsStats[0]?.totalViews || 0,
            videos: recentVideos
        },
        topPerformingVideos: topVideos
    };

    return res.status(200).json(
        new ApiResponse(200, analytics, "Video analytics fetched successfully")
    );
});

// Get basic platform statistics (for admin)
const getAdminStats = asyncHandler(async (req, res) => {
    // Simple admin check
    if (req.user.role !== 'admin') {
        throw new ApiError(403, "Admin access required");
    }

    // Basic platform statistics
    const [totalUsers, totalVideos, totalViews] = await Promise.all([
        User.countDocuments(),
        Video.countDocuments(),
        Video.aggregate([
            { $group: { _id: null, total: { $sum: "$views" } } }
        ])
    ]);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [newUsers, newVideos] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        Video.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    ]);

    // Most active users (by video count)
    const activeUsers = await User.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos"
            }
        },
        {
            $addFields: {
                videoCount: { $size: "$videos" }
            }
        },
        {
            $sort: { videoCount: -1 }
        },
        {
            $limit: 5
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                videoCount: 1,
                createdAt: 1
            }
        }
    ]);

    const adminData = {
        platform: {
            totalUsers,
            totalVideos,
            totalViews: totalViews[0]?.total || 0
        },
        recentActivity: {
            newUsersThisWeek: newUsers,
            newVideosThisWeek: newVideos
        },
        topCreators: activeUsers
    };

    return res.status(200).json(
        new ApiResponse(200, adminData, "Admin statistics fetched successfully")
    );
});

// Get user's video upload summary
const getUploadSummary = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Monthly upload count for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyUploads = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                createdAt: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                },
                count: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        },
        {
            $sort: { "_id.year": 1, "_id.month": 1 }
        }
    ]);

    // Video status breakdown
    const statusBreakdown = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: "$isPublished",
                count: { $sum: 1 }
            }
        }
    ]);

    const uploadData = {
        monthlyUploads,
        statusBreakdown: {
            published: statusBreakdown.find(s => s._id === true)?.count || 0,
            unpublished: statusBreakdown.find(s => s._id === false)?.count || 0
        }
    };

    return res.status(200).json(
        new ApiResponse(200, uploadData, "Upload summary fetched successfully")
    );
});

export {
    getChannelStats,
    getVideoAnalytics,
    getAdminStats,
    getUploadSummary
};