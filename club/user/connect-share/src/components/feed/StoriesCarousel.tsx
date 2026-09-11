
import { getAllUser } from "@/service/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setRecoverUser, setRemoveUser, setUserList } from "@/redux-toolkit/slice/userSlice";
import { X } from "lucide-react";
import socket from "@/socket/socket";

export function StoriesCarousel() {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state?.user?.userList);
  const user = JSON.parse(localStorage.getItem("member.user"));
  const navigate = useNavigate();

   useEffect(() => {
    socket.on("deleteUser", (data) => {
     dispatch(setRemoveUser(data))
    });

    socket.on("recoverUser", (data) => {
     dispatch(setRecoverUser(data));
    });

    return () => {
      socket.off("deleteUser");
      socket.off("recoverUser");
    }
   },[])

  const [openView, setOpenView] = useState(false);

  const handleGetAllUser = async () => {
     if(!user?._id) return;
    try {
      const res = await getAllUser(user?._id);

      if (res.status === 200) {
        dispatch(setUserList(res?.data?.data));
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (users?.length === 0) {
      handleGetAllUser();
    }
  }, [users?.length]);

  return (
    <>
      {/* STORIES CARD */}
      <div className="bg-card rounded-xl shadow-card p-3 md:p-4 mb-4">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-3">

          <span className="text-sm font-semibold text-foreground">
            Stories
          </span>

          <button
            onClick={() => setOpenView(true)}
            className="px-3 py-1 text-xs rounded-full bg-primary text-white hover:opacity-90 transition"
          >
            View All
          </button>
        </div>

<div className="flex overflow-x-auto  overflow-y-hidden scrollbar-hide pb-2 w-[370px] md:w-full">
<div className="flex gap-1.5 md:gap-3 min-w-max flex-nowrap whitespace-nowrap">
    {/* YOUR STORY */}
    <button className="flex flex-col items-center gap-1.5 shrink-0">
      <img
        src={user?.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2"} 
        alt="You"
        className="h-14 w-14 md:h-16 md:w-16 rounded-full object-cover"
      />
      <span className="text-[11px] md:text-xs font-medium text-foreground">
        You
      </span>
    </button>

    {/* OTHER USERS */}
    {users
      ?.filter((s) => s._id !== user?._id)
      ?.map((story, index) => (
        <button
          key={story._id}
          className={`
            flex flex-col items-center gap-1.5 shrink-0 
          `}
        >
          <div
            className={`p-[2.5px] rounded-full ${
              story.viewed ? "bg-muted" : "gradient-story"
            }`}
            onClick={() => navigate(`/profile/${story?._id}`)}
          >
            <img
              src={story?.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2"}
              alt={story.fullName}
              className="h-14 w-14 md:h-16 md:w-16 rounded-full object-cover ring-2 ring-card hover:scale-105 transition-transform"
            />
          </div>

          <span className="text-[11px] md:text-xs text-muted-foreground max-w-[60px] md:max-w-[4.5rem] truncate">
            {story.fullName}
          </span>
        </button>
      ))}
  </div>
</div>



      </div>

      {/* MODAL */}
      {openView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-3">

          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpenView(false)}
          />

          {/* CARD */}
          <div className="relative z-10 w-full max-w-md bg-card rounded-xl shadow-2xl p-4 max-h-[85vh] overflow-y-auto">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-bold">
                All Users
              </h2>

              <button onClick={() => setOpenView(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* USER LIST */}
            <div className="space-y-2 md:space-y-3">

              {users
                ?.filter((s) => s._id !== user?._id)
                ?.map((story) => (
                  <div
                    key={story._id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition"
                    onClick={() => {
                      setOpenView(false);
                      navigate(`/profile/${story?._id}`);
                    }} >
                    <img
                      src={story?.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2"}
                      className="h-10 w-10 rounded-full object-cover shrink-0"
                      alt=""
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {story.fullName}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        View profile
                      </p>
                    </div>
                  </div>
                ))}

            </div>
          </div>
        </div>
      )}
    </>
  );
}