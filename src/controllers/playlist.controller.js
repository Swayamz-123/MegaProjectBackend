import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";

// Create a new playlist
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description, isPublic = true } = req.body;

    // Validate required fields
    if (!name?.trim()) {
        throw new ApiError(400, "Playlist name is required");
    }

    if (!description?.trim()) {
        throw new ApiError(400, "Playlist description is required");
    }

    // Check if playlist name already exists for this user
    const existingPlaylist = await Playlist.findOne({
        name: name.trim(),
        owner: req.user._id
    });

    if (existingPlaylist) {
        throw new ApiError(400, "A playlist with this name already exists");
    }

    // Create playlist
    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id,
        videos: [],
        isPublic: Boolean(isPublic)
    });

    if (!playlist) {
        throw new ApiError(500, "Failed to create playlist");
    }

    return res.status(201).json(
        new ApiResponse(201, playlist, "Playlist created successfully")
    );
});

// Get playlist by ID with populated videos
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId)
        .populate({
            path: "videos",
            select: "title description thumbnail duration views createdAt isPublished",
            populate: {
                path: "owner",
                select: "username fullName avatar"
            }
        })
        .populate("owner", "username fullName avatar");

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    const isOwner = playlist.owner._id.toString() === req.user?._id?.toString();

    // Check if user can access this playlist
    if (!isOwner && !playlist.isPublic) {
        throw new ApiError(403, "This playlist is private");
    }

    // Filter out unpublished videos (unless owner is viewing)
    if (!isOwner) {
        playlist.videos = playlist.videos.filter(video => video.isPublished);
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    );
});

// Get user's playlists
const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const isOwnProfile = userId === req.user?._id?.toString();
    
    // If viewing someone else's profile, only show public playlists
    const filter = { owner: userId };
    if (!isOwnProfile) {
        filter.isPublic = true;
    }

    const playlists = await Playlist.find(filter)
        .populate("owner", "username fullName avatar")
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    // Add video count to each playlist
    const playlistsWithCount = await Promise.all(
        playlists.map(async (playlist) => {
            const videoCount = playlist.videos.length;
            return {
                ...playlist.toObject(),
                videoCount
            };
        })
    );

    return res.status(200).json(
        new ApiResponse(200, playlistsWithCount, "User playlists fetched successfully")
    );
});

// Get current user's playlists
const getMyPlaylists = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const playlists = await Playlist.find({ owner: req.user._id })
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    // Add video count and first video thumbnail
    const playlistsWithDetails = await Promise.all(
        playlists.map(async (playlist) => {
            const firstVideo = await Video.findById(playlist.videos[0])
                .select("thumbnail");
            
            return {
                ...playlist.toObject(),
                videoCount: playlist.videos.length,
                firstVideoThumbnail: firstVideo?.thumbnail || null
            };
        })
    );

    return res.status(200).json(
        new ApiResponse(200, playlistsWithDetails, "Your playlists fetched successfully")
    );
});

// Update playlist details
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description, isPublic } = req.body;

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check ownership
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only update your own playlists");
    }

    // Check for duplicate name if updating name
    if (name?.trim() && name.trim() !== playlist.name) {
        const existingPlaylist = await Playlist.findOne({
            name: name.trim(),
            owner: req.user._id,
            _id: { $ne: playlistId }
        });

        if (existingPlaylist) {
            throw new ApiError(400, "A playlist with this name already exists");
        }
    }

    // Update fields
    if (name?.trim()) playlist.name = name.trim();
    if (description?.trim()) playlist.description = description.trim();
    if (typeof isPublic === 'boolean') playlist.isPublic = isPublic;

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist updated successfully")
    );
});

// Toggle playlist privacy
const togglePlaylistPrivacy = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    
    const playlist = await Playlist.findById(playlistId);
    
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only modify your own playlists");
    }
    
    playlist.isPublic = !playlist.isPublic;
    await playlist.save();
    
    return res.status(200).json(
        new ApiResponse(200, playlist, `Playlist is now ${playlist.isPublic ? 'public' : 'private'}`)
    );
});

// Delete playlist
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check ownership
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own playlists");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    );
});

// Add video to playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check if playlist exists and user owns it
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only modify your own playlists");
    }

    // Check if video is already in playlist
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is already in this playlist");
    }

    // Add video to playlist
    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video added to playlist successfully")
    );
});

// Remove video from playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check ownership
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only modify your own playlists");
    }

    // Check if video exists in playlist
    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video not found in this playlist");
    }

    // Remove video from playlist
    playlist.videos = playlist.videos.filter(
        video => video.toString() !== videoId.toString()
    );

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video removed from playlist successfully")
    );
});

// Get playlists containing a specific video
const getPlaylistsByVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const playlists = await Playlist.find({
        videos: videoId,
        owner: req.user._id
    })
    .select("name description createdAt isPublic")
    .sort({ updatedAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, playlists, "Playlists containing video fetched successfully")
    );
});

// Reorder videos in playlist
const reorderPlaylistVideos = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { videoIds } = req.body; // Array of video IDs in new order

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    if (!Array.isArray(videoIds)) {
        throw new ApiError(400, "Video IDs must be an array");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check ownership
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only modify your own playlists");
    }

    // Validate that all provided video IDs exist in the playlist
    const currentVideoIds = playlist.videos.map(id => id.toString());
    const providedVideoIds = videoIds.map(id => id.toString());

    const isValidReorder = currentVideoIds.length === providedVideoIds.length &&
        currentVideoIds.every(id => providedVideoIds.includes(id));

    if (!isValidReorder) {
        throw new ApiError(400, "Invalid video order. All existing videos must be included");
    }

    // Update playlist with new order
    playlist.videos = videoIds;
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist videos reordered successfully")
    );
});

// Get all public playlists (for browse/discover feature)
const getPublicPlaylists = asyncHandler(async (req, res) => {
    const { page = 1, limit = 12, search = "" } = req.query;

    const matchStage = {
        isPublic: true // Only show public playlists
    };
    
    // Add search functionality
    if (search.trim()) {
        matchStage.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }

    const playlists = await Playlist.find(matchStage)
        .populate("owner", "username fullName avatar")
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    // Add video count and first video thumbnail for each playlist
    const playlistsWithDetails = await Promise.all(
        playlists.map(async (playlist) => {
            const firstVideo = await Video.findById(playlist.videos[0])
                .select("thumbnail");
            
            return {
                ...playlist.toObject(),
                videoCount: playlist.videos.length,
                firstVideoThumbnail: firstVideo?.thumbnail || null
            };
        })
    );

    return res.status(200).json(
        new ApiResponse(200, playlistsWithDetails, "Public playlists fetched successfully")
    );
});

export {
    createPlaylist,
    getPlaylistById,
    getUserPlaylists,
    getMyPlaylists,
    updatePlaylist,
    togglePlaylistPrivacy,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistsByVideo,
    reorderPlaylistVideos,
    getPublicPlaylists
};