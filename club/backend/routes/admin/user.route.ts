import express from "express";
import { getAllUsers, acceptPaymentRequest,adminApproveDeleteRequest,recoverAccount,  adminConvertPremiumUser, addBusinessUser, uploadExcel, activeAndInactiveUser, handleVerifyBusinessUser, handleVerifyUser, roleAssignUser, handleBlockAndUnBlockUser, deleteUser, updateUserByAdmin } from "../../controllers/admin/user.controller.js";
import upload from "../../middlewares/upload.js";


const router = express.Router();

router.get("/get", getAllUsers);
router.patch("/verify", handleVerifyUser);
router.patch("/block/toggle/:id", handleBlockAndUnBlockUser);
router.delete("/delete/:id", deleteUser);
router.patch("/role/assign", roleAssignUser);
router.post("/business/verify", handleVerifyBusinessUser);
router.patch("/active/inactive/:id", activeAndInactiveUser);
router.post("/upload-excel", upload.fields([{ name: "excelFile", maxCount: 1 }]), uploadExcel);
router.post("/accept-payment", acceptPaymentRequest);
router.put("/update/:id", updateUserByAdmin);
router.post("/business/add", upload.any(), addBusinessUser);
router.patch("/convert/premium", upload.fields([{ name: "screenshot", maxCount: 1 }]), adminConvertPremiumUser);
router.patch("/delete/request/approve/:userId", adminApproveDeleteRequest);
router.patch("/delete/request/cancel/:userId", recoverAccount);

export default router; 