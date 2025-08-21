import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from '../utils/ApiResponse.js'
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
const uploadVideo=asyncHandler(async(req,res)=>{
  const {title,description}=req.body
  if(!title.trim()||!description.trim()){
    throw new ApiError(403,"Title and Desc is Required")
  }
  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    if(!videoFileLocalPath){
        throw new ApiError(403,"Video File is Required")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is required")
    }
    const videoFile=await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)
    if(!videoFile){
        throw new ApiError(400,"Video File Upload failed")
    } 
    if(!thumbnail){
        throw new ApiError(400,"Thumbnail File Upload failed")
    } 
    const video = await Video.create({
        videoFile: {
            url: videoFile.url,
            publicId: videoFile.public_id
        },
        thumbnail: {
            url: thumbnail.url,
            publicId: thumbnail.public_id
        },
        title: title,
        description: description,
        duration: videoFile.duration  || "",
        owner: req.user._id, // 
    });
    if(!video){
        throw new ApiError(500, "Something went wrong while uploading video")
    }
    return res.status(201).json(
        new ApiResponse(201, video, "Video uploaded successfully")
    );
})
const getAllVideos = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        query = "", 
        sortBy = "createdAt", 
        sortType = "desc",
        userId 
    } = req.query;

    const pipeline = [];

    // Match published videos only
    pipeline.push({
        $match: {
            isPublished: true
        }
    });

    // Filter by owner if userId provided
    if (userId) {
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    // Search by title or description if query provided
    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        });
    }

    // Lookup owner details
    pipeline.push({
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
    });

    pipeline.push({
        $addFields: {
            owner: {
                $first: "$owner"
            }
        }
    });

    // Sort
    const sortStage = {};
    sortStage[sortBy] = sortType === "desc" ? -1 : 1;
    pipeline.push({ $sort: sortStage });

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const videos = await Video.aggregatePaginate(
        Video.aggregate(pipeline),
        options
    );

    return res.status(200).json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    );
});

// Get video by ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ]);

    if (!video?.length) {
        throw new ApiError(404, "Video not found");
    }

    // Increment view count
    await Video.findByIdAndUpdate(videoId, {
        $inc: { views: 1 }
    });

    return res.status(200).json(
        new ApiResponse(200, video[0], "Video fetched successfully")
    );
});

// Update video details
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!title?.trim() && !description?.trim()) {
        throw new ApiError(400, "At least one field (title or description) is required");
    }

    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check if user is owner
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only update your own videos");
    }

    const updateFields = {};
    if (title?.trim()) updateFields.title = title.trim();
    if (description?.trim()) updateFields.description = description.trim();

    // Handle thumbnail update if provided
    const thumbnailLocalPath = req.file?.path;
    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if (thumbnail) {
            updateFields.thumbnail = thumbnail.url;
            // Delete old thumbnail from cloudinary
            await deleteFromCloudinary(video.thumbnail);
        }
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateFields },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    );
});
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check if user is owner
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own videos");
    }

    // Delete files from cloudinary
    if (video.videoFile && video.videoFile.publicId) {
        await deleteFromCloudinary(video.videoFile.publicId);
    }
    if (video.thumbnail && video.thumbnail.publicId) {
        await deleteFromCloudinary(video.thumbnail.publicId);
    }

    // Delete video from database
    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    );
});
// Toggle video publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check if user is owner
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only modify your own videos");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: { isPublished: !video.isPublished } },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video publish status updated successfully")
    );
});

// Get user's videos
const getUserVideos = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
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
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ];

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const videos = await Video.aggregatePaginate(
        Video.aggregate(pipeline),
        options
    );

    return res.status(200).json(
        new ApiResponse(200, videos, "User videos fetched successfully")
    );
});

export {
    uploadVideo,
    deleteVideo,
    updateVideo,
    getAllVideos,
    getVideoById,
    getUserVideos,
    togglePublishStatus
}
