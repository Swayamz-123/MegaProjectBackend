import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from '../utils/ApiResponse.js'

import { Tweet } from "../models/tweet.model.js";


import { asyncHandler } from "../utils/asyncHandler.js";

const addTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    
    // Validate content
    if (!content || !content.trim()) {
        throw new ApiError(400, "Content is required");
    }
    
    // Create tweet
    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    });
    
    // Populate owner details (optional)
    await tweet.populate('owner', 'username email');
    
    res.status(201).json(new ApiResponse(201, tweet, "Tweet Created Successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params; // Fixed: destructure tweetId properly
    const { content } = req.body; // Fixed: destructure content properly
    
    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Not a Valid tweetId"); // Fixed: proper error code
    }
    
    // Validate content
    if (!content || !content.trim()) {
        throw new ApiError(400, "Content is required");
    }
    
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "No Tweet Found"); // Fixed: proper error code
    }
    
    // Fixed: proper comparison using toString()
    const isAllowed = req.user._id.toString() === tweet.owner.toString();
    
    if (!isAllowed) {
        throw new ApiError(403, "Sorry you can only update Your Tweets");
    }
    
    // Fixed: update and return response
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId, 
        { content: content.trim() }, 
        { new: true }
    ).populate('owner', 'username email');
    
    res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet Updated Successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params; // Fixed: destructure tweetId properly
    
    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Not a Valid tweetId"); // Fixed: proper error code
    }
    
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "No Tweet Found"); // Fixed: proper error code
    }
    
    // Fixed: proper comparison using toString()
    const isAllowed = req.user._id.toString() === tweet.owner.toString();
    
    if (!isAllowed) {
        throw new ApiError(403, "Sorry you can only Delete Your Tweets");
    }
    
    await Tweet.findByIdAndDelete(tweetId);
    
    res.status(200).json(new ApiResponse(200, {}, "Tweet Deleted Successfully"));
});

const getAllTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortType = 'desc' } = req.query;
    
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sortBy]: sortType === 'desc' ? -1 : 1 },
        populate: {
            path: 'owner',
            select: 'username avatar email'
        }
    };
    
    const tweets = await Tweet.paginate({}, options);
    
    res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

const getTweetById = asyncHandler(async (req, res) => {
    const { tweetId } = req.params; // Fixed: destructure tweetId properly
    
    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Not a Valid tweetId"); // Fixed: proper error code
    }
    
    const tweet = await Tweet.findById(tweetId).populate('owner', 'username email');
    if (!tweet) {
        throw new ApiError(404, "No Tweet Found"); // Fixed: proper error code
    }
    
    // Fixed: use res instead of req
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet fetched Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: {
            path: 'owner',
            select: 'username avatar email'
        }
    };
    
    const tweets = await Tweet.paginate({ owner: userId }, options);
    
    res.status(200).json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});

const searchTweets = asyncHandler(async (req, res) => {
    const { query, page = 1, limit = 10 } = req.query;
    
    if (!query || !query.trim()) {
        throw new ApiError(400, "Search query is required");
    }
    
    const searchRegex = new RegExp(query.trim(), 'i');
    
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: {
            path: 'owner',
            select: 'username avatar email'
        }
    };
    
    const tweets = await Tweet.paginate(
        { content: { $regex: searchRegex } },
        options
    );
    
    res.status(200).json(new ApiResponse(200, tweets, "Search results fetched successfully"));
});

const getTweetsByDateRange = asyncHandler(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    
    if (!startDate || !endDate) {
        throw new ApiError(400, "Start date and end date are required");
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ApiError(400, "Invalid date format");
    }
    
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: {
            path: 'owner',
            select: 'username avatar email'
        }
    };
    
    const tweets = await Tweet.paginate(
        {
            createdAt: {
                $gte: start,
                $lte: end
            }
        },
        options
    );
    
    res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

const getTweetStats = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    
    const stats = await Tweet.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalTweets: { $sum: 1 },
                avgContentLength: { $avg: { $strLenCP: "$content" } },
                oldestTweet: { $min: "$createdAt" },
                newestTweet: { $max: "$createdAt" }
            }
        }
    ]);
    
    const result = stats[0] || {
        totalTweets: 0,
        avgContentLength: 0,
        oldestTweet: null,
        newestTweet: null
    };
    
    res.status(200).json(new ApiResponse(200, result, "Tweet statistics fetched successfully"));
});

// Export all functions
export {
    addTweet,
    getAllTweets,
    getTweetById,
    getUserTweets,
    updateTweet,
    deleteTweet,
    searchTweets,
    getTweetsByDateRange,
    getTweetStats
};