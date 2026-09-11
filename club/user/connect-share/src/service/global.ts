
//  date or time ko input m  show karne k liye 
export const formatDateTimeLocal = (date) => {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};



export const formatBackendDateTime = (date) => {
  if (!date) return "";

  const d = new Date(date);

  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};


//  y date ko today or yesterday ya date formate m show karne k liye hai 
export const formatChatDate = (timestamp) => {
  const msgDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(msgDate, today)) return "Today";
  if (isSameDay(msgDate, yesterday)) return "Yesterday";

  return msgDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};



// y bhi chat k liye hai jo time ko show karne k liye hai agar vo today ya yesterday ka ho to us case m varna full date with time
export const formatMessageTimestamp = (timestamp) => {
  if (!timestamp) return "";

  const msgDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  // Helper function: compare only date (ignore time)
  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const time = msgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isSameDay(msgDate, today)) return time; // Only time for today
  if (isSameDay(msgDate, yesterday)) return `Yesterday ${time}`; // Yesterday + time

  // Older messages → date + time
  const date = msgDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return `${date} ${time}`;
};


export function formatLastSeen(timestamp) {
  // const last = new Date(timestamp);
  // const now = new Date();
  // const diffMs = now - last; // milliseconds
  // const diffSeconds = Math.floor(diffMs / 1000);
  // const diffMinutes = Math.floor(diffSeconds / 60);
  // const diffHours = Math.floor(diffMinutes / 60);
  // const diffDays = Math.floor(diffHours / 24);

  // if (diffSeconds < 60) return "just now";
  // if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  // if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  // if (diffDays === 1) return "Yesterday";

  // // Else show date
  // return last.toLocaleDateString([], { day: "numeric", month: "short" }); // e.g., 3 Apr
}


export const getEventStatus = (eventDate: string) => {
  const now = new Date();
  const date = new Date(eventDate);

  const today = new Date(now.toDateString());
  const eventDay = new Date(date.toDateString());

  if (eventDay > today) return "upcoming";
  if (eventDay < today) return "past";
  return "live";
};



export function formatMongoDate(mongoDate) {
  const inputDate = new Date(mongoDate);
  const now = new Date();

  // Helper: same day check
  const isSameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  // Yesterday date
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  // Time format (HH:MM AM/PM)
  const timeString = inputDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Date format (DD/MM/YYYY)
  const dateString = inputDate.toLocaleDateString();

  if (isSameDay(inputDate, now)) {
    return `Last Seen Today ${timeString}`;
  } else if (isSameDay(inputDate, yesterday)) {
    return `Last Seen Yesterday ${timeString}`;
  } else {
    return `Last Seen ${dateString} ${timeString}`;
  }
}


// y sirf images ko alage karne k liye hai y
export const isImage = (url) => {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
};


// y birthday ki date ko exact pata karne k liye hai y aane wala hai ya ja chuka hai 
export const getBirthdayInfo = (dob?: string | null) => {
  if (!dob) return null;

  const today = new Date();
  const birthDate = new Date(dob);

  // current year ka birthday
  const thisYearBirthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );

  // convert to number for arithmetic
  const diffTime = thisYearBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // format: April 15
  const formattedDate = thisYearBirthday.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric"
  });

  if (diffDays === 0) {
    return {
      message: "🎉 It's their birthday today!",
      date: formattedDate
    };
  } else if (diffDays > 0) {
    return {
      message: `🎂 Birthday coming in ${diffDays} day${diffDays > 1 ? "s" : ""}!`,
      date: formattedDate
    };
  } else {
    return {
      message: "📅 Birthday already passed",
      date: formattedDate
    };
  }
};




export const personalFields = [
  { key: "fullName", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "mobile", label: "Mobile" },
  { key: "occupation", label: "Occupation" },
  { key: "address", label: "Address" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "dob", label: "Date of Birth" },
];



export const isVideo = (url: string) => {
  return (
    url.includes(".mp4") ||
    url.includes(".webm") ||
    url.includes(".mov") ||
    url.includes("video")
  );
};