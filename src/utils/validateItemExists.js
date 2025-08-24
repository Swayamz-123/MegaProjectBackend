import {Video} from "../models/video.model.js";
import {Comment} from "../models/comment.model.js";
import {Tweet} from "../models/tweet.model.js";
import {ApiError} from "../utils/ApiError.js";
export const validateItemExists = async (itemId, itemType) => {
    let Model;

    switch (itemType) {
        case "video":
            Model = Video;
            break;
        case "comment":
            Model = Comment;
            break;
        case "tweet":
            Model = Tweet;
            break;
        default:
            throw new ApiError(400, "Invalid item type");
    }

    const item = await Model.findById(itemId).lean();
    if (!item) {
        throw new ApiError(404, `${itemType} not found`);
    }

    return item; // so you can access title/content later
};
