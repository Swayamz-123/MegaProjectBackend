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
    getPublicPlaylists,
    togglePlaylistPrivacy
} from '../controllers/playlist.controller.js'

const router=Router()
router.route('/createPlaylist').post(verifyJWT,createPlaylist)  //working
router.route('/getPlaylist/:playlistId').get(verifyJWT,getPlaylistById)  //working
router.route('/getUserPlaylist').get(verifyJWT,getUserPlaylists)  //working
router.route('/getMyPlaylist').get(verifyJWT,getMyPlaylists)  //working
router.route('/updatePlaylist/:playlistId').patch(verifyJWT,updatePlaylist)  //working
router.route('/deletePlaylist/:playlistId').delete(verifyJWT,deletePlaylist) //working
router.route('/addVideo/:playlistId/:videoId').post(verifyJWT,addVideoToPlaylist) //wotking
router.route('/removeVideo/:playlistId/:videoId').delete(verifyJWT,removeVideoFromPlaylist) //working
router.route('/getplaylistByvideo/:videoId').get(verifyJWT,getPlaylistsByVideo) //working
router.route('/reorderPlaylistVideo/:playlistId').get(verifyJWT,reorderPlaylistVideos) //working
router.route('/getpublicplaylist').get(verifyJWT,getPublicPlaylists) //working
router.route('/togglePrivacy/:playlistId').post(verifyJWT,togglePlaylistPrivacy) //working
export default router