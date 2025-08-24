
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from '../utils/ApiResponse.js'
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateItemExists } from "../utils/validateItemExists.js";
const toggleLike = asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id");
    }
    const video=await Video.findById(videoId) ;
    if(!video){
        throw new ApiError(400,"Video not found")
    }
    const existingLiked= await Like.findOne({
        video:videoId,
        likedBy:req.user._id
    });
    let isLiked;
    if(existingLiked){
        await Like.findByIdAndDelete(
            existingLiked._id
        )
        isLiked=false;
    } else {
        await Like.create({
            video:videoId,
            likedBy:req.user._id
        })
        isLiked=true;
    }
    const likeCount = await Like.countDocuments({video:videoId});
    return res.status(200).json(
        new ApiResponse(200, 
            { 
                isLiked, 
                likeCount 
            }, 
            `Video ${isLiked ? 'liked' : 'unliked'} successfully`
        )
    );
});

const toggleCommentLikes=asyncHandler(async (req,res)=>{
    const {commentId}= req.params
    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment Id");

    }
    const comment=await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(400,"Comment not found");
    }
       const existingLike=await Like.findOne({
        comment:commentId,
        likedBy:req.user._id
       })
       let isLiked;
       if(existingLike){
        await Like.findByIdAndDelete(existingLike._id);
        isLiked=false;
       }
       else {
        await Like.create({
            comment:commentId,
            likedBy:req.user._id
        })
        isLiked=true;
       }
       const likeCount=await Like.countDocuments({comment:commentId});
       return res.status(200).json(new ApiResponse(200,
        {
            isLiked,
            likeCount
        },
        `Comment ${isLiked?'Liked':`unliked`} Successfully`
       ))
    })
    const toggleLikeonTweet=asyncHandler(async (req,res)=>{
     const {tweetId}=req.params;
     if(!mongoose.isValidObjectId(tweetId)){
          throw new ApiError(400,"Nota a valid tweetId")
     }
     const tweet=await  Tweet.findById(tweetId);
     if(!tweet){
        throw new ApiError(400,"Tweet not found");
     }
     const existingLike=await Like.findOne({
        tweet:tweetId,
        likedBy:req.user._id
     })
     let isLiked
     if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        isLiked=false;
     } else {
        await Like.create({
            tweet:tweetId,
            likedBy:req.user._id
        })
        isLiked=true;
    }
    const likeCount=await Like.countDocuments({
        tweet:tweetId,

    })
     return res.status(200).json(
        new ApiResponse(200, 
            { 
                isLiked, 
                likeCount 
            }, 
            `Tweet ${isLiked ? 'liked' : 'unliked'} successfully`
        )
    );
});
const getLikedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: {
            path: 'video',
            populate: {
                path: 'owner',
                select: 'username fullName avatar'
            }
        },
        sort: { createdAt: -1 }
    };

    const likedVideos = await Like.aggregatePaginate(
        Like.aggregate([
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(req.user._id),
                    video: { $exists: true }
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "video",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            username: 1,
                                            fullName: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    video: {
                        $first: "$video"
                    }
                }
            },
            {
                $match: {
                    video: { $ne: null }
                }
            }
        ]),
        options
    );

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

// Get like status for multiple items
const getLikeStatus = asyncHandler(async (req, res) => {
    const { videoIds, commentIds, tweetIds } = req.body;
    
    const likeStatus = {};
    
    // Check video likes
    if (videoIds && Array.isArray(videoIds)) {
        const videoLikes = await Like.find({
            video: { $in: videoIds },
            likedBy: req.user._id
        }).select('video');
        
        likeStatus.videos = {};
        videoIds.forEach(id => {
            likeStatus.videos[id] = videoLikes.some(like => 
                like.video.toString() === id.toString()
            );
        });
    }
    
    // Check comment likes
    if (commentIds && Array.isArray(commentIds)) {
        const commentLikes = await Like.find({
            comment: { $in: commentIds },
            likedBy: req.user._id
        }).select('comment');
        
        likeStatus.comments = {};
        commentIds.forEach(id => {
            likeStatus.comments[id] = commentLikes.some(like => 
                like.comment.toString() === id.toString()
            );
        });
    }
    
    // Check tweet likes
    if (tweetIds && Array.isArray(tweetIds)) {
        const tweetLikes = await Like.find({
            tweet: { $in: tweetIds },
            likedBy: req.user._id
        }).select('tweet');
        
        likeStatus.tweets = {};
        tweetIds.forEach(id => {
            likeStatus.tweets[id] = tweetLikes.some(like => 
                like.tweet.toString() === id.toString()
            );
        });
    }

    return res.status(200).json(
        new ApiResponse(200, likeStatus, "Like status fetched successfully")
    );
});
const getLikesCount = asyncHandler(async (req, res) => {
    const { itemId, itemType } = req.params;
    
    // Validate item type
    if (!['video', 'comment', 'tweet'].includes(itemType)) {
        throw new ApiError(400, "Invalid item type. Must be 'video', 'comment', or 'tweet'");
    }
    
    // Validate item ID format
    if (!mongoose.isValidObjectId(itemId)) {
        throw new ApiError(400, "Invalid item ID format");
    }
    
    // VALIDATE THAT ITEM EXISTS IN THE CORRECT COLLECTION
    await validateItemExists(itemId, itemType);
    
    // Count likes for this specific item
    const likeCount = await Like.countDocuments({
        itemId: new mongoose.Types.ObjectId(itemId),
        itemType: itemType
    });
    
    return res.status(200).json(
        new ApiResponse(200, { 
            itemId,
            itemType,
            likeCount 
        }, "Like count fetched successfully")
    );
});

const getItemLikers = asyncHandler(async (req, res) => {
    const { itemId, itemType } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Validate item type
    if (!['video', 'comment', 'tweet'].includes(itemType)) {
        throw new ApiError(400, "Invalid item type. Must be 'video', 'comment', or 'tweet'");
    }
    
    // Validate item ID format
    if (!mongoose.isValidObjectId(itemId)) {
        throw new ApiError(400, "Invalid item ID format");
    }
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    
    // VALIDATE THAT ITEM EXISTS IN THE CORRECT COLLECTION
    const item = await validateItemExists(itemId, itemType);
    
    // Get likers and total count in parallel
    const [likers, totalLikers] = await Promise.all([
        Like.find({
            itemId: itemId,
            itemType: itemType
        })
        .populate('likedBy', 'username fullName avatar')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .lean(),
        
        Like.countDocuments({
            itemId: itemId,
            itemType: itemType
        })
    ]);
    
    // Filter out any null likedBy references
    const validLikers = likers
        .map(like => like.likedBy)
        .filter(user => user !== null);
    
    return res.status(200).json(
        new ApiResponse(200, {
            itemId,
            itemType,
            itemInfo: {
                title: item.title || item.content || 'N/A', // Include item info
            },
            likers: validLikers,
            totalLikers,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(totalLikers / limitNum),
            hasNextPage: pageNum < Math.ceil(totalLikers / limitNum),
            hasPrevPage: pageNum > 1
        }, "Item likers fetched successfully")
    );
});

export {
    toggleLike,
    toggleLikeonTweet,
 toggleCommentLikes,
 getLikedVideos,
    getLikeStatus,
    getLikesCount,
    getItemLikers
}

