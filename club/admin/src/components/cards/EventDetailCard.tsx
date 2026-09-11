import { useAppSelector } from "@/redux-toolkit/customHook/hook";
import { Calendar, MapPin, Clock } from "lucide-react";
import { useParams } from "react-router-dom";

const EventDetailCard = () => {
  const { id } = useParams();
  const eventList = useAppSelector((state) => state?.event?.eventList);

  const detail = eventList.find((e) => e?._id === id);

  if (!detail) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Cover Image */}
      {detail.coverImage && (
        <div className="w-full h-[220px] md:h-[350px] lg:h-[450px]">
          <img
            src={detail.coverImage}
            alt={detail.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Category */}
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-600">
          {detail.category?.name}
        </span>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-3">
          {detail.title}
        </h1>

        {/* Info Section */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mt-4 text-gray-600 text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            {new Date(detail.date).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>

          <div className="flex items-center gap-2">
            <Clock size={16} />
            {new Date(detail.date).toLocaleTimeString()}
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={16} />
            {detail.location}
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">About Event</h2>
          <p className="text-gray-700 leading-relaxed">
            {detail.description || "No description available."}
          </p>
        </div>

        {/* Extra Details (if available) */}
        {/* {detail.details && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Details</h2>
            <p className="text-gray-700 leading-relaxed">
              {detail.details}
            </p>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default EventDetailCard;