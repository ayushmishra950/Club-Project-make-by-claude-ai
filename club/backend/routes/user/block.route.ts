import {Router} from "express";
import {getBlockedUsers,unblockUser, blockUser} from "../../controllers/user/block.controller.js";

const router = Router();

router.get("/get/:userId", getBlockedUsers);
router.patch("/unblocked", unblockUser);
router.patch("/blocked", blockUser);

export default router;