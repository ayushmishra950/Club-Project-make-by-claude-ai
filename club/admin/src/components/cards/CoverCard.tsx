import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setEventList } from "@/redux-toolkit/slice/eventSlice";
import { getEvent } from "@/service/event";

const CoverCard: React.FC = () => {
  const dummyData = [
    {
      title: "Jain Temple",
      description: "Shanti aur dhyan ka adbhut sthal",
      image:
        "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3",
    },
    {
      title: "Meditation Time",
      description: "Apne aap ko samajhne ka samay",
      image:
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
    },
    {
      title: "Peaceful Nature",
      description: "Prakriti ke saath ekant ka anubhav",
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
    const [eventListRefresh, setEventListRefresh] = useState<boolean>(false);
  const dispatch = useAppDispatch();
    const eventList = useAppSelector((state) => state?.event?.eventList);
     console.log(eventList)

    const handleGetEvent = async () => {
        try {
          const res = await getEvent();
          console.log(res)
          if (res.status === 200) {
            dispatch(setEventList(res?.data?.event))
            setEventListRefresh(false);
          }
        }
        catch (err) {
          console.log(err?.message);
    
        }
      };
    
      useEffect(() => {
        if (eventListRefresh || eventList?.length === 0) {
          handleGetEvent();
        }
    
      }, [eventListRefresh, eventList?.length])

  // ⏱️ Auto Slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === dummyData.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-lg">
      
      {/* 🔥 Slider Wrapper */}
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {eventList?.slice(0,3).map((item, i) => (
          <div key={i} className="min-w-full h-full relative">
            <img
              src={item.coverImage}
              alt={item.title}
              className="w-full h-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <div className="absolute bottom-0 p-4 text-white">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="text-sm text-gray-200 line-clamp-2">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 🔴 Dots (Bottom Center) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {dummyData.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 w-2 rounded-full transition-all ${
              i === currentIndex
                ? "bg-white w-4"
                : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default CoverCard;