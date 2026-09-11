import express from "express";
import {getSuggestedUsers,getFriendUsers,getMutualFriends, sendFriendRequest, acceptFriendRequest, cancelFriendRequest, getFromAnToPendingRequests} from "../../controllers/user/friendRequest.controller.js";

const router = express.Router();


router.get("/suggestion/get/:userId", getSuggestedUsers);
router.post("/request/send", sendFriendRequest);
router.get("/request/accept/:requestId", acceptFriendRequest);
router.get("/request/cancel/:requestId", cancelFriendRequest);
router.get("/request/pending/:userId", getFromAnToPendingRequests);
router.get("/users/:userId", getFriendUsers);
router.post("/users/mutualFriends", getMutualFriends);


export default router;