import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "@/redux-toolkit/customHook/hook";
import { Calendar, MapPin } from "lucide-react";

export default function PublicEventDetail() {
  const { id } = useParams();
  const [currentImage, setCurrentImage] = useState(0);
  const eventList = useAppSelector((state) => state?.event?.eventList);

  const event = eventList.find((e) => e?._id === id && e?.type === "public");

  // Ensure coverImage always array ho
  const images = Array.isArray(event.coverImage) ? event.coverImage : [event.coverImage];

  // Auto Change Image Every 4 Seconds
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImage((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length]);
  // ---------------- COUNTDOWN LOGIC ----------------
  const calculateTimeLeft = () => {
    const diff = new Date(event?.date).getTime() - new Date().getTime();

    if (diff <= 0) return {};

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!event) return null;

  return (
    <div className="w-full">

      {/* ================= HERO SECTION ================= */}
      <div className="relative h-screen w-full overflow-hidden">

        {/* Background Slider */}
        <div className="absolute inset-0">
          {images.map((image: string, index: number) => (
            <img
              key={index}
              src={image}
              alt={`cover-${index}`}
              className={`
            absolute inset-0
            h-full w-full
            object-cover
            transition-all duration-1000 ease-in-out
            ${index === currentImage
                  ? "opacity-100 translate-x-0 scale-100"
                  : "opacity-0 translate-x-8 scale-105"}
          `}
            />
          ))}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 z-[1]" />

        {/* CENTER CONTENT */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">

          <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm mb-4">
            {event.category}
          </span>

          <h1 className="text-white text-4xl md:text-6xl font-bold">
            {event.title}
          </h1>

          <p className="text-white/80 mt-4 max-w-xl">
            {event.description}
          </p>
        </div>

        {/* Dots Navigation */}
        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {images.map((_: string, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`
              h-2.5 rounded-full transition-all duration-300
              ${currentImage === index
                    ? "w-8 bg-white"
                    : "w-2.5 bg-white/50 hover:bg-white/80"}
            `}
              />
            ))}
          </div>
        )}
      </div>
      {/* ================= COUNTDOWN SECTION ================= */}
      <div className="py-16 bg-white text-center">

        <h2 className="text-2xl font-bold mb-10">
          BEAT THE HEAT GLORY'S VENTURE
        </h2>

        <p className="text-muted-foreground mb-10">
          The biggest event of the summer is almost here
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">

          <div className="p-6 border rounded-xl shadow-sm">
            <h3 className="text-3xl font-bold">{timeLeft.days || 0}</h3>
            <p className="text-sm text-muted-foreground">Days</p>
          </div>

          <div className="p-6 border rounded-xl shadow-sm">
            <h3 className="text-3xl font-bold">{timeLeft.hours || 0}</h3>
            <p className="text-sm text-muted-foreground">Hours</p>
          </div>

          <div className="p-6 border rounded-xl shadow-sm">
            <h3 className="text-3xl font-bold">{timeLeft.minutes || 0}</h3>
            <p className="text-sm text-muted-foreground">Minutes</p>
          </div>

          <div className="p-6 border rounded-xl shadow-sm">
            <h3 className="text-3xl font-bold">{timeLeft.seconds || 0}</h3>
            <p className="text-sm text-muted-foreground">Seconds</p>
          </div>

        </div>
      </div>

      {/* ================= FEATURED EVENT ================= */}
      <div className="py-20 max-w-5xl mx-auto px-4 text-center">

        <h2 className="text-3xl font-bold">FEATURED EVENT</h2>
        <p className="text-muted-foreground mt-2"> Experience unforgettable moments </p>

        <div className="mt-10 grid md:grid-cols-2 gap-8 items-center text-left">

          <img
            src={event.coverImage?.[0]}
            className="rounded-2xl w-full h-80 object-cover"
          />

          <div className="space-y-4">

            <h3 className="text-2xl font-semibold">{event.title}</h3>

            <p className="text-sm text-muted-foreground">
              {event.description}
            </p>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              {new Date(event.date).toLocaleString("en-IN")}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              {event.location}
            </div>

          </div>
        </div>
      </div>

      {/* ================= GALLERY SECTION ================= */}
      {event?.gallery?.length > 0 && <div className="py-20 bg-gray-50 text-center">

        <h2 className="text-3xl font-bold">
          VIDEO GALLERY OF RESORT
        </h2>

        <p className="text-muted-foreground mt-2">
          A sneak peek into the ultimate luxury experience
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-10 max-w-6xl mx-auto px-4">

          {event?.gallery?.map((galleryItem) => {

            const images = Array.isArray(galleryItem?.image) ? galleryItem.image : [galleryItem?.image];

            return images.map((media, index) => {
              const isVideo = typeof media === "string" && (media.includes(".mp4") || media.includes(".webm") || media.includes(".mov"));

              return (
                <div key={`${galleryItem._id}-${index}`} className="h-64 bg-black/10 rounded-xl overflow-hidden"
                >
                  {isVideo ? (
                    <video src={media} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={media} className="w-full h-full object-cover" alt="gallery" />
                  )}

                </div>
              );
            });

          })}

        </div>
      </div>}



      {/* ================= MEMBERSHIP RULES ================= */}
      <div className="py-20 bg-white text-center">

        <h2 className="text-3xl font-bold">
          MEMBERSHIP RULES
        </h2>

        <p className="text-muted-foreground mt-2">
          Simple structure for a premium yearly experience
        </p>

        {/* CARDS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 max-w-6xl mx-auto px-4">

          {/* Card 1 */}
          <div className="p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition text-left">

            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              👥
            </div>

            <h3 className="font-semibold text-lg">
              Couple Membership Fee
            </h3>

            <p className="text-primary font-bold mt-1">
              ₹18,000
            </p>

            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Includes husband and wife annual participation in the JSG GLORY event calendar.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition text-left">

            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              🪪
            </div>

            <h3 className="font-semibold text-lg">
              New Member Registration Fee
            </h3>

            <p className="text-primary font-bold mt-1">
              ₹1,000
            </p>

            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              One-time onboarding charge for each new member joining the annual group cycle.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition text-left">

            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              👶
            </div>

            <h3 className="font-semibold text-lg">
              Kids Fee
            </h3>

            <p className="text-primary font-bold mt-1">
              ₹1,500 / kid
            </p>

            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Kids are welcome in family events and kids-focused programs across the yearly timeline.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition text-left">

            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              🎁
            </div>

            <h3 className="font-semibold text-lg">
              Attractive Gifts
            </h3>

            <p className="text-primary font-bold mt-1">
              Worth ₹1,500
            </p>

            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              If you deposit the fee on or before May 17th.
            </p>
          </div>

        </div>

        {/* ================= QR SECTION ================= */}
        <div className="mt-20 max-w-md mx-auto px-4">

          <h3 className="text-2xl font-bold mb-2">
            SCAN & PAY
          </h3>

          <p className="text-sm text-muted-foreground mb-6">
            Scan the QR code with any UPI app
          </p>

          {/* QR IMAGE */}
          <div className="p-6 border rounded-2xl bg-white shadow-sm flex justify-center">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=merchantaumb1000167761@aubank"
              alt="UPI QR Code"
              className="w-48 h-48"
            />
          </div>

          {/* UPI ID */}
          <p className="mt-6 text-sm text-muted-foreground">
            UPI ID:{" "}
            <span className="font-medium text-black">
              merchantaumb1000167761@aubank
            </span>
          </p>

        </div>

      </div>
    </div>
  );
}







