import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash } from "lucide-react";
import NewsDialog from "@/components/forms/NewsDialog";
import DeleteCard from "@/components/cards/DeleteCard";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { getNews, deleteNews } from "@/service/news";
import { setNewsList, setRemoveNews } from "@/redux-toolkit/slice/newsSlice";

export default function NewsPage() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const newsList = useAppSelector((state) => state?.news?.newsList);

  const [newsDialogOpen, setNewsDialogOpen] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [refreshNewsList, setRefreshNewsList] = useState(false);

  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ✅ GET NEWS
  const handleGetNews = async () => {
    try {
      const res = await getNews();
      if (res.status === 200) {
        dispatch(setNewsList(res?.data?.data));
        setRefreshNewsList(false);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!newsList?.length || refreshNewsList) {
      handleGetNews();
    }
  }, [refreshNewsList, newsList?.length]);


  const handleDeleteNews = async () => {
    try {
      setDeleteLoading(true);
      const res = await deleteNews(deleteItem?._id);

      if (res?.status === 200) { 
        toast({ title: "News Deleted", description: res?.data?.message});
        dispatch(setRemoveNews(deleteItem._id));
        setDeleteDialogOpen(false);
        setDeleteItem(null);
      }
    } catch (err) {
      toast({
        title: "Delete Failed",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {/* ✅ CREATE / EDIT DIALOG */}
      <NewsDialog
        isOpen={newsDialogOpen}
        onOpenChange={setNewsDialogOpen}
        initialData={initialData}
      />

      {/* ✅ DELETE DIALOG */}
      <DeleteCard
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        isLoading={deleteLoading}
        buttonName="Delete"
        title={`Delete News: ${deleteItem?.title}`}
        description={`Are you sure you want to delete "${deleteItem?.title}"?`}
        onConfirm={handleDeleteNews}
      />

      <div className="space-y-4">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">News & Updates</h3>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setInitialData(null);
                  setNewsDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Create News
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* TABLE */}
      {newsList?.length > 0 ? (
  <div className="overflow-x-auto">
    <table className="w-full border rounded-lg table-fixed">
      
      <thead className="bg-gray-100 text-sm">
        <tr>
          <th className="p-3 w-[20%] text-left">Title</th>
          <th className="p-3 w-[35%] text-left">Description</th>
          <th className="p-3 w-[15%] text-left">Category</th>
          <th className="p-3 w-[20%] text-left">Created At</th>
          <th className="p-3 w-[10%] text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        {newsList.map((news) => (
          <tr key={news._id} className="border-t">
            
            <td className="p-3 truncate">
              {news.title}
            </td>

            <td className="p-3 truncate">
              {news.description?.length > 50 ? news?.description + " ..." : news?.description}
            </td>

            <td className="p-3">
              {news.category}
            </td>

            <td className="p-3 whitespace-nowrap">
              {new Date(news.createdAt).toLocaleString()}
            </td>

            <td className="p-3 text-right">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setInitialData(news);
                    setNewsDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setDeleteItem(news);
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
) : (
  <p className="flex justify-center items-center h-[300px]">
    No News Found
  </p>
)}


      </div>
    </>
  );
}