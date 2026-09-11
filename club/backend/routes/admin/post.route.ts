import express from 'express';
import {createPost,getAllPosts,updatePost,togglePinnedPost,getSinglePost, deletePost, toggleLikePost, addComment , deleteComment} from "../../controllers/admin/post.controller.js";
import upload from "../../middlewares/upload.js";

const router = express.Router();


router.post("/add",upload.fields([{name:"images", maxCount:3}]), createPost);
router.get("/get", getAllPosts);
router.get("/getbyid", getSinglePost);
router.put("/update",upload.fields([{name:"images", maxCount:3}]), updatePost);
router.delete("/delete/:id", deletePost);
router.post("/toggle/like", toggleLikePost);
router.post("/comment/add", addComment);
router.delete("/comment/delete", deleteComment);
router.patch("/pinned/:postId", togglePinnedPost);


export default router;