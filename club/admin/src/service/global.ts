
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





export const getCurrentMonthCount = (list, dateKey = "createdAt") => {
  if (!Array.isArray(list)) return 0;

  const now = new Date();

  return list.filter((item) => {
    const date = new Date(item?.[dateKey]);

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;
};





export const isVideo = (url: string) => {
  return (
    url.includes(".mp4") ||
    url.includes(".webm") ||
    url.includes(".mov") ||
    url.includes("video")
  );
};