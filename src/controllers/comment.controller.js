import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from '../utils/ApiResponse.js'
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const addComment = asyncHandler(async (req,res)=>{
    const {content}=req.body
  const {videoId}=req.params
   if(!content.trim()){
    throw new ApiError(400,"Content is required ")
   }
   if(!mongoose.isValidObjectId(videoId)){
    throw new ApiError(400,"Video id is invalid");
   }
   const video=await Video.findById(videoId);
   if(!video){
    throw new ApiError(401,"Video not found")
   }
   const comment=await Comment.create({
    content:content.trim(),
    video:video,
    owner:req.user._id
   })
   const createdComment= await Comment.findById(comment._id).
   populate("owner",
     "userName fullName avatar"
   )
   return res.status(201).json(
        new ApiResponse(201, createdComment, "Comment added successfully")
    );
});
//get latest Single Comment for that video
 const getLatestComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate video ID
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Fetch the most recent comment
    const latestComment = await Comment.findOne({ video: videoId })
        .sort({ createdAt: -1 }) // Latest first
        .populate("owner", "username avatar");

    if (!latestComment) {
        throw new ApiError(404, "No comments found for this video");
    }

    // Send the response
    return res.status(200).json(
        new ApiResponse(200, latestComment, "Latest comment fetched successfully")
    );
});

const updateComment=asyncHandler(async (req,res)=>{
const {content}=req.body;
const {commentId}=req.params
if(!content.trim()){
    throw new ApiError(401,"Comment content is Required")
}
if(!mongoose.isValidObjectId(commentId)){
    throw new ApiError(400,"Not a valid comment id")
}
const comment=await Comment.findById(commentId)
if(!comment){
    throw new ApiError(400,"Comment not found")
}
const isCommentOwned=comment.owner.toString()===req.user._id.toString()
if(!isCommentOwned){
    throw new ApiError(400,"You can only update your own comment")
}
const updatedComment= await Comment.findByIdAndUpdate(commentId,
    {content:content.trim()},
{new:true}).populate("owner","userName fullName avatar")

return res.status(200).json(new ApiResponse(201,updatedComment,"comment updated successfully"))
})
const deleteComment = asyncHandler(async (req,res)=>{
    const {commentId}=req.params;
    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400,"Comment id is not vaid")
    }
    const comment= await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(401,"The comment not found for the user")
    }
    const video=await Video.findById(comment.video)
    const isAbleTodelete=req.user._id.toString()===comment.owner._id.toString() ||
    req.user._id===video.owner._id 
    if(!isAbleTodelete){
        throw new ApiError(400,"You can only delete your comment or the video owner can only delete")
    }
    await Comment.findByIdAndDelete(comment._id)
    await Like.deleteMany({ comment: commentId });

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
})
//all comment in a video
// Updated getVideoComments - combines Phase 2 and Phase 3
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { 
        page = 1, 
        limit = 10, 
        sortBy = "createdAt", 
        sortType = "desc",
        includeLikes = "true"  // New parameter to include/exclude likes
    } = req.query;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Base aggregation pipeline
    const aggregateQuery = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
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
        }
    ]);

    // Add like information if requested
    if (includeLikes === "true") {
        await aggregateQuery.append(
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    owner: {
                        $first: "$owner"
                    },
                    likeCount: {
                        $size: "$likes"
                    },
                    isLikedByUser: {
                        $in: [new mongoose.Types.ObjectId(req.user._id), "$likes.likedBy"]
                    }
                }
            },
            {
                $project: {
                    likes: 0 // Remove likes array from response
                }
            }
        );
    } else {
        // Just add owner field without like info
        aggregateQuery.append({
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        });
    }

    // Handle different sorting options
    let sortStage = {};
    if (sortBy === "likes" && includeLikes === "true") {
        sortStage = { likeCount: sortType === "desc" ? -1 : 1 };
    } else {
        sortStage[sortBy] = sortType === "desc" ? -1 : 1;
    }

    aggregateQuery.append
    ({ $sort: sortStage });

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const comments = await Comment.aggregatePaginate(aggregateQuery, options);

    return res.status(200).json(
        new ApiResponse(
            200, 
            comments, 
            `Comments fetched successfully${includeLikes === "true" ? " with likes" : ""}`
        )
    );
});

// Updated getUserComments - combines getUserComments and getMyComments
const getUserComments = asyncHandler(async (req, res) => {
    // Use provided userId or current user's ID if not provided
    const targetUserId = req.params.userId || req.user._id;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.isValidObjectId(targetUserId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Check if it's current user's comments or another user's
    const isOwnComments = targetUserId === req.user._id.toString();

    const aggregateQuery = Comment.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(targetUserId)
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
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            owner: 1
                        }
                    }
                ]
            }
        },
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
        }
    ]);

    // Add like information if it's user's own comments
    if (isOwnComments) {
        aggregateQuery.append({
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        });
    }

    aggregateQuery.append(
        {
            $addFields: {
                video: {
                    $first: "$video"
                },
                owner: {
                    $first: "$owner"
                },
                ...(isOwnComments && {
                    likeCount: {
                        $size: "$likes"
                    }
                })
            }
        },
        {
            $project: {

                _id:1,
                ...(isOwnComments && { likes: 0 })
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    );

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const comments = await Comment.aggregatePaginate(aggregateQuery, options);

    const message = isOwnComments 
        ? "My comments fetched successfully" 
        : "User comments fetched successfully";

    return res.status(200).json(
        new ApiResponse(200, comments, message)
    );
});
//get comment count
const getCommentCount = asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(200,"Not a valid comment id")
    }
    const commentCount = await Comment.countDocuments({video:videoId})
    
    return res.status(200).json(
        new ApiResponse(200, { commentCount }, "Comment count fetched successfully")
    );
})
//comment ownership check
const checkCommentOwnership = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const isOwner = comment.owner.toString() === req.user._id.toString();

    return res.status(200).json(
        new ApiResponse(200, { isOwner,owner:req.user._id }, "Comment ownership checked")
    );
});

export {
    checkCommentOwnership,
    getCommentCount,
    getVideoComments,
    getUserComments,
    updateComment,
    deleteComment,
    addComment,
    getLatestComment
}