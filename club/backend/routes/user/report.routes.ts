import express from "express";

import {

createReport,

getMyReports,

getAllReports,

updateReportStatus,

deleteReport


} from "../../controllers/user/report.controller.js";



const router = express.Router();




// =================================
// User Routes
// =================================


// Create report

router.post(

"/create",

createReport

);




// Get user's reports

router.get(

"/my/:userId",

getMyReports

);






// =================================
// Admin Routes
// =================================


// Get all reports

router.get(

"/admin/all",

getAllReports

);





// Update report action

router.put(

"/admin/update/:reportId/:adminId",

updateReportStatus

);





// Delete report

router.delete(

"/admin/delete/:id",

deleteReport

);





export default router;