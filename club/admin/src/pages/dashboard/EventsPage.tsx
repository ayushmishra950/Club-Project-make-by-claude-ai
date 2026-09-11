import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash, Pin } from "lucide-react";
import EventDialog from "@/components/forms/EventDialog";
import { getEvent, deleteEvent } from "@/service/event";
import DeleteCard from "@/components/cards/DeleteCard";
import { useToast } from "@/hooks/use-toast";
import socket from "@/socket/socket";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setEventList, setInterestedAndNotCandidate, setNewEvent } from "@/redux-toolkit/slice/eventSlice";

export default function EventsPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [initialData, setIntialData] = useState(null);
  const [eventListRefresh, setEventListRefresh] = useState(false);
  const [deleteEvents, setDeleteEvents] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const dispatch = useAppDispatch();
  const eventList = useAppSelector((state) => state?.event?.eventList);


  useEffect(() => {
    socket.on("interestedcandidateFromEvent", (data) => {
      dispatch(setInterestedAndNotCandidate(data));
    });

    socket.on("event", (data) => {
      if (data) {
        dispatch(setNewEvent(data));
      }
    })
    return () => {
      socket.off("interestedcandidateFromEvent");
      socket.off("event")
    };
  }, []);



  const handleDeleteEvent = async () => {
    try {
      setDeleteLoading(true);
      const res = await deleteEvent(deleteEvents?._id);

      if (res?.status === 200) {
        toast({ title: "User Deleted Successfully.", description: res?.data?.message });
        setEventListRefresh(true);
        setDeleteDialogOpen(false);
        setDeleteEvents(null);
      }
    }
    catch (err) {
      console.log(err);
      toast({ title: "User Deleted Failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" })
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleGetEvent = async () => {
    try {
      const res = await getEvent();
      if (res.status === 200) {
        dispatch(setEventList(res?.data?.event))
        setEventListRefresh(false);
      }
    }
    catch (err) {
      console.log(err);
    }
  };


  useEffect(() => {
    if (eventList?.length === 0 || eventListRefresh) {
      handleGetEvent();
    }
  }, [eventList?.length, eventListRefresh])

  return (
    <>
      <DeleteCard
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        isLoading={deleteLoading}
        buttonName="Delete"
        title={`Delete Event: ${deleteEvents?.title}`}
        description={`Are you sure you want to delete the event "${deleteEvents?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteEvent}
      />
      <EventDialog isOpen={eventDialogOpen} onOpenChange={setEventDialogOpen} initialData={initialData} setEventListRefresh={setEventListRefresh} />
      <div className="space-y-4 ">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-semibold text-lg">All Events</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-gold text-secondary-foreground font-semibold" onClick={() => { setIntialData(null); setEventDialogOpen(true) }}><Plus className="h-4 w-4 mr-1" /> Create Event</Button>
            </DialogTrigger>
          </Dialog>
        </div>
        {eventList?.length > 0 ? (
          <>
            {/* ================= DESKTOP TABLE ================= */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-left text-sm">
                  <tr>
                    <th className="p-3">Image</th>
                    <th className="p-3">Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Attending</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-center">Pinned</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {eventList?.map((event) => (
                    <tr key={event?._id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        {event?.coverImage?.length > 0 ? (
                          <img
                            src={event.coverImage[0]}
                            className="w-12 h-12 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200" />
                        )}
                      </td>

                      <td className="p-3">{event.title}</td>
                      <td className="p-3">{event.category}</td>
                      <td className="p-3">
                        {new Date(event.date)?.toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        {new Date(event.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </td>
                      <td className="p-3">{event.location}</td>
                      <td className="p-3">
                        {event?.interestedCandidate?.length}
                      </td>
                      <td className="p-3">{event?.type}</td>
                      <td className="p-3 text-center">
                        {event?.isPinned ? (
                          <div className="flex justify-center">
                            <Pin className="w-4 h-4 text-blue-600 fill-blue-600" />
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">No</span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setIntialData(event);
                              setEventDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setDeleteEvents(event);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ================= MOBILE VIEW ================= */}
            <div className="md:hidden space-y-3">
              {eventList?.map((event) => (
                <div
                  key={event?._id}
                  className="border rounded-lg p-3 flex gap-3 items-start"
                >
                  {/* Image */}
                  <div>
                    {event?.coverImage ? (
                      <img
                        src={event.coverImage}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Title */}
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm">{event.title}</h3>
                      {event?.isPinned && <Pin className="w-3 h-3 text-blue-600 fill-blue-600" />}
                    </div>

                    {/* Date + Time */}
                    <p className="text-xs text-gray-500">
                      {new Date(event.date)?.toLocaleDateString()} • {new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true, })}</p>

                    {/* Location */}
                    <p className="text-xs text-gray-500">📍 {event.location} </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setIntialData(event); setEventDialogOpen(true); }} className="p-1 rounded hover:bg-gray-100"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { setDeleteEvents(event); setDeleteDialogOpen(true); }} className="p-1 rounded hover:bg-red-100"><Trash className="w-4 h-4 text-red-500" /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="flex items-center justify-center h-[400px]">
            No Data Found.
          </p>
        )}
      </div>
    </>
  );
}
