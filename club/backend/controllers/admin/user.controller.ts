import User from "../../models/user.model.js";
import { adminViewUsers } from "../../utils/serialize.js";
import type { Request, Response } from "express";
import xlsx from "xlsx";
import { getIO } from "../../utils/socketHelper.js";
import bcrypt from "bcryptjs";
import { sendWelcomeSMS } from "../../utils/twilio.service.js";
import uploadToCloudinary from "../../cloudinary/uploadToCloudinary.js";
import Group from "../../models/group.model.js";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const pageParam = req.query.page;
    const perPageParam = req.query.perPage;
    const searchParam = req.query.search;
    const status = req.query.filterStatus;

    const page = Math.max(parseInt(typeof pageParam === "string" ? pageParam : "1", 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(typeof perPageParam === "string" ? perPageParam : "8", 10) || 8, 1), 100);
    const search = typeof searchParam === "string" ? searchParam.trim() : "";

    /* Three bugs lived in this block:
         - the search term went into $regex unescaped, so a crafted pattern
           could pin the event loop,
         - it searched `phone`, but the schema field is `mobile`, so searching
           by phone number silently matched nothing,
         - assigning to `filter` wholesale threw away the status filter, so
           "blocked members named X" returned every member named X. */
    const filter: Record<string, any> = {};

    if (status) {
      filter.blocked = status !== "active";
    }

    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { fullName: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
        { mobile: { $regex: safe, $options: "i" } },
        { userId: { $regex: safe, $options: "i" } }
      ];
    }

    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });


    res.status(200).json({
      users: adminViewUsers(users),
      total,
      page,
      perPage,
      success: true
    });
  } catch (err: any) {
    res.status(500).json({ message: err?.message || "Server Error" });
  }
};


export const handleVerifyUser = async (req: Request, res: Response) => {
  try {
    const { memberIds } = req.body;

    if (!memberIds || memberIds.length === 0) {
      return res.status(400).json({ message: "memberIds not found." });
    }

    await User.updateMany(
      { _id: { $in: memberIds } },
      { $set: { isVerified: true } }
    );

    return res.status(200).json({
      message: "Users verified successfully."
    });

  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || "Server Error"
    });
  }
};




export const handleVerifyBusinessUser = async (req: Request, res: Response) => {
  try {
    const { userId, businessId, status } = req.body;
    if (!userId || !businessId) {
      return res.status(400).json({ success: false, message: "userId and businessId are required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Find the business in the businesses array 
    const business = user.businesses.find(b => b?._id?.toString() === businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: "Business not found." });
    }

    // Update status: true maps to 'verified', false maps to 'rejected'
    business.isVerified = status === true ? "verified" : "rejected";

    await user.save();
    res.status(200).json({
      success: true,
      message: `Business ${status === true ? "Verified" : "Rejected"} successfully.`,
      user
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Server Error" });
  }
};


export const handleBlockAndUnBlockUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ message: "userId not Found." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "user not found." });

    user.blocked = !user?.blocked;
    await user?.save();

    res.status(200).json({ message: `User ${user.blocked ? "Blocked" : "Unblocked"} successfully.` })
  }
  catch (err: any) {
    res.status(500).json({ message: err?.message || "Server Error" })
  }
};


export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ message: "userId not found." });

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "user not Found." });

    res.status(200).json({ message: "user deleted Successfully." })

  }
  catch (err: any) {
    res.status(500).json({ message: err?.message || "Server Error" })
  }
};

export const roleAssignUser = async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ message: "UserId and role are required." });
    }

    const allowedRoles = ["user", "secretary", "treasurer"];

    if (!allowedRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ message: "Invalid role provided." });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role: role.toLowerCase() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: `${user.fullName}'s role has been updated to ${user.role}.`
    });

  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};


export const activeAndInactiveUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;
    if (!userId) return res.status(400).json({ message: "userId not found." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "user not found." });

    user.blocked = status;
    await user?.save();

    res.status(200).json({ message: `${status === true ? "User Blocked" : "User UnBlocked"} Successfully.` })
  }
  catch (err: any) {
    res.status(500).json({ message: err?.message || "Server Error" })
  }
};

export const acceptPaymentRequest = async (req: Request, res: Response) => {
  try {
    const { id, amount } = req.body;

    const io = getIO();
    if (!id) return res.status(400).json({ message: "userId not found." });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "user not found." });
    user.premiumUser = "premium";
    user.amount = amount;

    await user.save();
    io.to(user?._id?.toString()).emit("paymentRequestAccepted", { user });
    io.emit("paymentSuccess");
    res.status(200).json({ user: user, message: "Payment request accepted and user upgraded to premium successfully." })
  }
  catch (err: any) {
    res.status(500).json({ message: err?.message || "Server Error" })
  }
};



const generatePasswordFromName = (fullName: string) => {
  if (!fullName) return "";

  const firstName = fullName.trim().split(" ")[0].toLowerCase() || "user";

  const rawPassword = `${firstName}@123`;

  const hashedPassword = bcrypt.hashSync(rawPassword, 10);

  return hashedPassword;
};


const normalize = (val?: string) => val?.trim().toLowerCase();

const parseExcelChildren = (row: any) => {
  const children = [];

  for (let i = 1; i <= 10; i++) {
    const name = row[`kid${i}name`];
    const age = row[`kid${i}age`];

    if (name && age) {
      children.push({
        name: name.toString().trim(),
        age: Number(age)
      });
    }
  }

  return children;
};
export const updateUserByAdmin = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Remove fields that should not be updated directly
    const { password, _id, __v, createdAt, updatedAt, ...allowedUpdates } = updateData;

    // Validate and process children array if present
    if (allowedUpdates.children) {
      if (!Array.isArray(allowedUpdates.children)) {
        return res.status(400).json({ message: "Children must be an array." });
      }
      // Ensure each child has name and age
      allowedUpdates.children = allowedUpdates.children.map((child: any) => ({
        name: child.name || "",
        age: child.age || 0
      }));
    }

    // Validate and process businesses array if present
    if (allowedUpdates.businesses) {
      if (!Array.isArray(allowedUpdates.businesses)) {
        return res.status(400).json({ message: "Businesses must be an array." });
      }
    }

    // Get the original user to check if they are someone's spouse
    const originalUser = await User.findById(userId);
    if (!originalUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update the main user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if this user is someone's spouse and update accordingly
    // If the user's email has changed or if they have a spouse, update the spouse's record
    if (allowedUpdates.email || (originalUser.spouseEmail && originalUser.spouseName)) {
      // Find if this user is listed as someone's spouse (spouseName or spouseEmail matches)
      const spouseQuery = {
        $or: [
          { spouseEmail: originalUser.email },
          { spouseName: originalUser.fullName }
        ]
      };

      // Also check if the email is changing
      if (allowedUpdates.email && allowedUpdates.email !== originalUser.email) {
        // Update the spouse record where this user is listed as spouseName
        await User.updateMany(
          { spouseEmail: originalUser.email },
          {
            $set: {
              spouseEmail: allowedUpdates.email,
              spouseName: allowedUpdates.fullName || originalUser.fullName
            }
          }
        );
      }

      // If this user has a spouse (spouseName/spouseEmail), update the spouse's record with new details
      if (originalUser.spouseEmail) {
        const spouseUser = await User.findOne({ email: originalUser.spouseEmail });
        if (spouseUser) {
          // Update the spouse's spouseName and spouseEmail to reflect this user's details
          await User.findByIdAndUpdate(
            spouseUser._id,
            {
              $set: {
                spouseName: allowedUpdates.fullName || originalUser.fullName,
                spouseEmail: allowedUpdates.email || originalUser.email,
                spouseMobile: allowedUpdates.mobile || originalUser.mobile,
                spouseDob: allowedUpdates.dob || originalUser.dob,
                spouseOccupation: allowedUpdates.occupation || originalUser.occupation,
              }
            }
          );
        }
      }
    }

    // If this user is being updated and they have a spouse listed, 
    // also update the spouse's spouse* fields to match
    if (allowedUpdates.spouseName && allowedUpdates.spouseEmail) {
      const spouseUser = await User.findOne({ email: allowedUpdates.spouseEmail });
      if (spouseUser && spouseUser._id.toString() !== userId) {
        // Update the spouse's record to reflect this user as their spouse
        await User.findByIdAndUpdate(
          spouseUser._id,
          {
            $set: {
              spouseName: allowedUpdates.fullName || user.fullName,
              spouseEmail: allowedUpdates.email || user.email,
              spouseMobile: allowedUpdates.mobile || user.mobile,
            }
          }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user
    });

  } catch (err: any) {
    console.error("Update error:", err);
    res.status(500).json({ message: err?.message || "Server Error" });
  }
};


export const addBusinessUser = async (req: Request, res: Response) => {
  try {
    const io = getIO();
    const { userId, businesses } = req.body;
    const files = (req as any).files;

    if (!userId) {
      return res.status(400).json({ message: "user id not found" })
    }
    if (!businesses) {
      return res.status(400).json({ message: "businesses not found" })
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "user not found" })
    }

    // Since businesses might be sent as a JSON string when using FormData
    const parsedBusinesses = typeof businesses === 'string' ? JSON.parse(businesses) : businesses;

    if (!Array.isArray(parsedBusinesses)) {
      return res.status(400).json({ message: "businesses must be an array" })
    }

    const updatedBusinesses = await Promise.all(parsedBusinesses.map(
      async (biz: any, index: number) => {
        let imageUrl = biz.businessCoverImage || "";

        // Check for file in req.files
        const file = files?.find((f: any) => f.fieldname === `businessCoverImage_${index}`);
        if (file && file.buffer) {
          const uploaded = await uploadToCloudinary(file.buffer, file.mimetype, "businessCoverImage");
          if (uploaded) imageUrl = uploaded;
        }

        return {
          ...biz,
          businessCoverImage: imageUrl,
          isVerified: "verified",
        };
      }
    ));

    user.businesses = updatedBusinesses;
    user.accountType = "business";
    await user.save();

    io.emit("businessUpdate");

    res.status(200).json({ success: true, message: "Business added successfully", user })

  } catch (err: any) {
    res.status(500).json({ message: err?.message || "Server Error" })
  }
};


export const adminConvertPremiumUser = async (req: Request, res: Response) => {
  try {
    const io = getIO();
    const { userId, amount, transactionNumber } = req.body;
    const file = (req as any).files?.screenshot?.[0];

    if (!userId || !amount || !file) return res.status(400).json({ message: "userId, amount or screenshot is required." })

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "user not found." });

    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount." });
    };

    const uploadResult = await uploadToCloudinary(file.buffer, file.mimetype, "payment_screenshots");
    if (!uploadResult) return res.status(500).json({ message: "Failed to upload screenshot" });


    user.paymentImage = uploadResult;
    user.amount = numericAmount;
    user.transitionNumber = transactionNumber ? transactionNumber : null;
    user.premiumUser = "premium";
    await user.save();

    io.to(user?._id?.toString()).emit("userUpdate", user);

    res.status(200).json({ success: true, message: "User converted to premium successfully", user });


  } catch (err: any) {
    res.status(500).json({ message: err?.message || "Server Error" })
  }
}

export const uploadExcel = async (req: Request, res: Response) => {
  try {
    const file = (req.files as any)?.excelFile?.[0];
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = xlsx.utils.sheet_to_json(sheet);

    const successUsers: any[] = [];
    const duplicateUsers: any[] = [];

    const { nanoid } = await import("nanoid");

    // ================= COLLECT ALL DATA =================
    const allEmails = rows
      .flatMap(r => [r.email, r.spouseEmail])
      .filter(Boolean)
      .map(normalize);

    const allPhones = rows
      .flatMap(r => [r.mobile, r.spouseMobile])
      .filter(Boolean)
      .map(p => p?.toString());

    // ================= DB EXISTING USERS =================
    const existingUsers = await User.find({
      $or: [
        { email: { $in: allEmails } },
        { mobile: { $in: allPhones } }
      ]
    });

    const existingEmailSet = new Set(
      existingUsers.map(u => normalize(u.email)).filter(Boolean)
    );

    const existingPhoneSet = new Set(
      existingUsers.map(u => u.mobile?.toString()).filter(Boolean)
    );

    const usedEmails = new Set<string>();
    const usedPhones = new Set<string>();

    // ================= PROCESS ROWS =================
    for (const row of rows) {

      const userEmail = normalize(row.email);
      const spouseEmail = normalize(row.spouseEmail);

      const userPhone = row.mobile?.toString();
      const spousePhone = row.spouseMobile?.toString();

      const relationId = nanoid(10);

      // 🔑 MUST HAVE AT LEAST ONE IDENTIFIER
      if (!userEmail && !userPhone) {
        duplicateUsers.push({
          reason: "Missing both email and mobile"
        });
        continue;
      }

      // ❌ same row validation
      if (userEmail && spouseEmail && userEmail === spouseEmail) {
        duplicateUsers.push({ email: userEmail, reason: "Same email in row" });
        continue;
      }

      if (userPhone && spousePhone && userPhone === spousePhone) {
        duplicateUsers.push({ phone: userPhone, reason: "Same phone in row" });
        continue;
      }

      // ================= MAIN USER DUPLICATE CHECK =================
      const isUserDuplicate =
        (userEmail && (
          existingEmailSet.has(userEmail) ||
          usedEmails.has(userEmail)
        )) ||
        (userPhone && (
          existingPhoneSet.has(userPhone) ||
          usedPhones.has(userPhone)
        ));

      if (!isUserDuplicate) {
        if (userEmail) usedEmails.add(userEmail);
        if (userPhone) usedPhones.add(userPhone);

        successUsers.push({
          userId: row?.userId?.toString() || `USR-${nanoid(8)}`,
          password: generatePasswordFromName(row.fullName),
          relationId,

          fullName: row.fullName,
          email: userEmail || undefined,
          mobile: userPhone || undefined,
          dob: row.dob ? new Date(row.dob) : undefined,
          occupation: row.occupation || undefined,

          spouseName: row.spouseName || undefined,
          spouseEmail: spouseEmail || undefined,
          spouseOccupation: row.spouseOccupation || undefined,
          spouseDob: row.spouseDob ? new Date(row.spouseDob) : undefined,
          spouseMobile: spousePhone || undefined,

          address: row.address,
          state: row.state,
          country: row.country,
          anniversaryDate: row.anniversaryDate ? new Date(row.anniversaryDate) : undefined,
          children: parseExcelChildren(row)
        });

      } else {
        duplicateUsers.push({
          email: userEmail,
          phone: userPhone,
          reason: "User duplicate"
        });
      }

      // ================= SPOUSE USER =================
      if ((spouseEmail || spousePhone) && row.spouseName) {

        const isSpouseDuplicate =
          (spouseEmail && (
            existingEmailSet.has(spouseEmail) ||
            usedEmails.has(spouseEmail)
          )) ||
          (spousePhone && (
            existingPhoneSet.has(spousePhone) ||
            usedPhones.has(spousePhone)
          ));

        if (!isSpouseDuplicate) {
          if (spouseEmail) usedEmails.add(spouseEmail);
          if (spousePhone) usedPhones.add(spousePhone);

          successUsers.push({
            userId: row?.spouseUserId?.toString() || `USR-${nanoid(8)}`,
            password: generatePasswordFromName(row.spouseName),
            relationId,

            fullName: row.spouseName,
            email: spouseEmail || undefined,
            mobile: spousePhone || undefined,
            dob: row.spouseDob ? new Date(row.spouseDob) : undefined,
            occupation: row.spouseOccupation || undefined,

            spouseName: row.fullName,
            spouseEmail: userEmail || undefined,
            spouseOccupation: row.spouseOccupation || undefined,
            spouseDob: row.spouseDob ? new Date(row.spouseDob) : undefined,
            spouseMobile: userPhone || undefined,

            address: row.address,
            state: row.state,
            country: row.country,
            anniversaryDate: row.anniversaryDate ? new Date(row.anniversaryDate) : undefined,
            children: parseExcelChildren(row)
          });

        } else {
          duplicateUsers.push({
            email: spouseEmail,
            phone: spousePhone,
            reason: "Spouse duplicate"
          });
        }
      }
    }

    // ================= INSERT =================
    if (!successUsers.length) {
      return res.json({
        message: "No users inserted",
        insertedCount: 0,
        duplicateCount: duplicateUsers.length,
        duplicates: duplicateUsers
      });
    }

    const inserted = await User.insertMany(successUsers, { ordered: false });


    //     const inserted = [];

    // for (const user of successUsers) {

    //   try {

    //     const createdUser = await User.create(user);

    //     inserted.push(createdUser);

    //     // ✅ SEND WELCOME SMS
    //     if (createdUser.mobile) {

    //     let messageData =  await sendWelcomeSMS(
    //         `+91${createdUser.mobile}`,
    //         createdUser.fullName,
    //         createdUser.password
    //       );

    //       console.log(messageData);
    //     }

    //   } catch (err: any) {

    //     duplicateUsers.push({
    //       email: user.email,
    //       phone: user.mobile,
    //       reason: err.message || "Insert failed"
    //     });

    //   }
    // }

    return res.status(201).json({
      message: "Upload successful",
      insertedCount: inserted.length,
      duplicateCount: duplicateUsers.length,
      duplicates: duplicateUsers,
      inserted
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: err.message || "Upload failed"
    });
  }
};









export const adminApproveDeleteRequest = async(req:Request, res:Response) => {
  try{
     const userId = req.params.userId;
     const io = getIO();
     if(!userId) return res.status(400).json({message:"userId is Required."});
     
     const user = await User.findById(userId);
     if(!user) return res.status(404).json({message:"user not found."});

     if(user.isDeleted && user?.deleteStatus === "approved") return res.status(403).json({message:"User Account Already Deleted."});

     user.isDeleted = true;
     user.deleteStatus = "approved";

     await user.save();

     await Group.updateMany( { createdBy: user._id }, { $set: { managedByAdmin: true } });
    io.emit("deleteUser", user);

     res.status(200).json({message:"Delete Request Approved.", user, success:true})
  }catch(err:any){
    console.log(err);
    res.status(500).json({success:false, message : err?.message || "Server Error", error:err});
  }
};


export const recoverAccount = async(req:Request, res:Response) => {
  try{
     const userId = req.params.userId;
     const io = getIO();
     if(!userId) return res.status(400).json({message:"userId is Required."});

     const user = await User.findById(userId);
     if(!user) return res.status(404).json({message:"user not found."});

     if(user.isDeleted === false && user.deleteStatus === "active") return res.status(200).json({message:"User Account Already Active."});

     user.isDeleted = false;
     user.deleteStatus = "active";
     user.deleteDate = null;
     user.deleteReason = null;

      await user.save();
      io.emit("recoverUser", user);
 
      const group = await Group.updateMany({createdBy:user?._id}, {$set:{managedByAdmin:false}})
     res.status(200).json({message:"user account revoke successfully.", user});
  }
  catch(err:any){
    console.log(err);
    res.status(500).json({success:false, message : err?.message || "Server Error", error:err});
  }
}