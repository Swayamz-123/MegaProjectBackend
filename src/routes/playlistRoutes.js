import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createPlaylist,
    getPlaylistById,
    getUserPlaylists,
    getMyPlaylists,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistsByVideo,
    reorderPlaylistVideos,
    getPublicPlaylists
} from '../controllers/playlist.controller.js'

const router=Router()
router.route().post(verifyJWT,createPlaylist)
router.route().get(verifyJWT,getPlaylistById)
router.route().get(verifyJWT,getUserPlaylists)
router.route().get(verifyJWT,getMyPlaylists)
router.route().patch(verifyJWT,updatePlaylist)
router.route().delete(verifyJWT,deletePlaylist)
router.route().post(verifyJWT,addVideoToPlaylist)
router.route().delete(verifyJWT,removeVideoFromPlaylist)
router.route().get(verifyJWT,getPlaylistById)
router.route().get(verifyJWT,getPlaylistsByVideo)
router.route().get(verifyJWT,reorderPlaylistVideos)
router.route().get(verifyJWT,getPublicPlaylists)
