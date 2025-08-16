// controllers/subscription.controller.js

import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Subscription } from "../models/subscription.model";

/**
 * Subscribe to a channel (YouTube-like)
 * - Prevent self-subscription
 * - Idempotent: prevent duplicate subscriptions
 */
const subscribeChannel = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  if (userId.toString() === channelId) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const exists = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (exists) {
    return res
      .status(200)
      .json(new ApiResponse(200, exists, "Already subscribed"));
  }

  const subscription = await Subscription.create({
    subscriber: userId,
    channel: channelId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, subscription, "Subscribed successfully"));
});

/**
 * Unsubscribe from a channel
 * - Error if not subscribed
 */
const unsubscribeChannel = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const deleted = await Subscription.findOneAndDelete({
    subscriber: userId,
    channel: channelId,
  });

  if (!deleted) {
    throw new ApiError(404, "You are not subscribed to this channel");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
});

/**
 * Get my subscribers (people who follow me)
 * - Pagination
 * - Sorting (createdAt desc/asc)
 * - Populated user details
 */
const getMySubscribers = asyncHandler(async (req, res) => {
  const channelId = req.user._id;
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 100);
  const sortDir = (req.query.sort || "desc").toLowerCase() === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Subscription.find({ channel: channelId })
      .populate("subscriber", "userName avatar")
      .sort({ createdAt: sortDir })
      .skip((page - 1) * limit)
      .limit(limit),
    Subscription.countDocuments({ channel: channelId }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items,
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
      "Subscribers fetched successfully"
    )
  );
});

/**
 * Get my subscribed channels (people I follow)
 * - Pagination
 * - Sorting (createdAt desc/asc)
 * - Populated channel details
 */
const getMySubscribedChannels = asyncHandler(async (req, res) => {
  const subscriberId = req.user._id;
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 100);
  const sortDir = (req.query.sort || "desc").toLowerCase() === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Subscription.find({ subscriber: subscriberId })
      .populate("channel", "userName avatar")
      .sort({ createdAt: sortDir })
      .skip((page - 1) * limit)
      .limit(limit),
    Subscription.countDocuments({ subscriber: subscriberId }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items,
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
      "Subscribed channels fetched successfully"
    )
  );
});

/**
 * Get subscriber count for a channel
 */
const getSubscriberCount = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const count = await Subscription.countDocuments({ channel: channelId });

  return res
    .status(200)
    .json(new ApiResponse(200, { count }, "Subscriber count fetched successfully"));
});

/**
 * Check subscription status (is current user subscribed to channel?)
 */
const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;

  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const exists = await Subscription.exists({
    subscriber: userId,
    channel: channelId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isSubscribed: !!exists },
        "Subscription status fetched successfully"
      )
    );
});

export {
  subscribeChannel,
  unsubscribeChannel,
  getMySubscribers,
  getMySubscribedChannels,
  getSubscriberCount,
  getSubscriptionStatus,
};
