import { useEffect, useState } from 'react';
import { Search, MapPin, Star, Filter } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { mockChats } from '@/data/mockData';
import { getAllUsersPaged } from "@/service/auth";
import socket from '@/socket/socket';

const Directory = () => {
  const user = JSON.parse(localStorage.getItem("member.user"));
  const [chatOpen, setChatOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const totalUnread = mockChats.reduce((acc, c) => acc + c.unread, 0);
  const [businesses, setBusinesses] = useState([]);
  const [view, setView] = useState<"grid" | "table">("table");
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    socket.on("businessVerify", () => {
      handleGetAllUser(user?._id);
    });
    socket.on("businessUpdate", () => {
      handleGetAllUser(user?._id);
    });
    socket.on("updateUserList", () => {
      handleGetAllUser(user?._id);
    })
    return () => {
      socket.off("businessVerify");
      socket.off("businessUpdate");
      socket.off("updateUserList");
    }
  }, []);

  const filtered = businesses?.filter(biz => {
    // Search filter
    const query = search.toLowerCase();
    const fieldsToCheck = [
      biz.businessName,
      biz.businessDescription,
      biz.businessAddress,
      biz.businessCategory,
      biz.ownerName
    ];

    const matchesSearch = fieldsToCheck.some(field => field?.toLowerCase().includes(query));

    // Category filter
    const matchesCategory = category === 'all' || biz.businessCategory?.toLowerCase() === category.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleGetAllUser = async (userId:string) => {
    if(!userId) return;
    try {
      // The directory lists every verified business, so it walks all pages
      // rather than showing whichever members happen to be on page one.
      const allUsers = await getAllUsersPaged(userId);

      // Flatten all businesses from verified users/accounts
      const flattened = allUsers.reduce((acc, user) => {
          if (user.accountType === "business" && user.businesses) {
            const verifiedBusinesses = user.businesses
              .filter((biz) => biz.isVerified === "verified")
              .map((biz) => ({
                ...biz,
                ownerId: user._id,
                ownerName: user.fullName,
                ownerImage: user.profileImage || user.coverImage
              }));
            return [...acc, ...verifiedBusinesses];
          }
        return acc;
      }, []);

      setBusinesses(flattened);

      // Extract unique categories for filter
      const uniqueCategories = [...new Set(flattened.map((b) => b.businessCategory).filter(Boolean))];
      setSkills(uniqueCategories as string[]);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (user?._id) {
    handleGetAllUser(user._id);
    }
  }, [user?._id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onChatToggle={() => setChatOpen(!chatOpen)} chatUnread={totalUnread} />
      
      <div className="mx-auto max-w-7xl px-4 py-6">
        
        {/* ================= PREMIUM BANNER SECTION ================= */}
        {(businesses.some(b => b.businessCoverImage && ['center', 'left', 'right'].includes(b.bannerPosition))) && (
          <div className="mb-10">
            <div className="flex flex-col lg:flex-row gap-4 items-start">
              
              {/* LEFT VERTICAL BANNERS */}
              {businesses.filter(b => b.bannerPosition === 'left' && b.businessCoverImage).length > 0 && (
                <div className="hidden lg:flex flex-col gap-4 w-48 shrink-0">
                  {businesses.filter(b => b.bannerPosition === 'left' && b.businessCoverImage).map((biz, idx) => (
                    <div key={idx} className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-md group">
                      <img src={biz.businessCoverImage} alt={biz.businessName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                        <p className="text-white font-bold text-xs">{biz.businessName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CENTER HORIZONTAL BANNERS */}
              <div className="flex-1 min-w-0 space-y-4">
                {businesses.filter(b => b.bannerPosition === 'center' && b.businessCoverImage).length > 0 ? (
                  businesses.filter(b => b.bannerPosition === 'center' && b.businessCoverImage).map((biz, idx) => (
                    <div key={idx} className="relative w-full h-48 md:h-72 rounded-3xl overflow-hidden shadow-xl group">
                      <img src={biz.businessCoverImage} alt={biz.businessName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
                        <div>
                          <span className="px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md text-[10px] font-bold text-primary-foreground uppercase tracking-widest mb-3 inline-block border border-primary/30">Featured Business</span>
                          <h2 className="text-white text-3xl font-bold mb-1">{biz.businessName}</h2>
                          <p className="text-white/70 text-sm font-medium">{biz.businessCategory}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback or empty space if no center banner but side banners exist
                  <div className="h-0 invisible lg:visible" />
                )}
              </div>

              {/* RIGHT VERTICAL BANNERS */}
              {businesses.filter(b => b.bannerPosition === 'right' && b.businessCoverImage).length > 0 && (
                <div className="hidden lg:flex flex-col gap-4 w-48 shrink-0">
                  {businesses.filter(b => b.bannerPosition === 'right' && b.businessCoverImage).map((biz, idx) => (
                    <div key={idx} className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-md group">
                      <img src={biz.businessCoverImage} alt={biz.businessName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                        <p className="text-white font-bold text-xs">{biz.businessName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8">
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Business Directory</h1>

            {/* Search & filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search businesses..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full rounded-xl bg-card border border-border pl-12 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground transition-all shadow-sm"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
                <button
                  onClick={() => setCategory("all")}
                  className={`shrink-0 rounded-full px-6 py-2.5 text-sm font-medium transition-all shadow-sm ${category === "all"
                      ? 'gradient-primary text-primary-foreground'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                    }`}
                >
                  All
                </button>
                {skills?.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`shrink-0 rounded-full px-6 py-2.5 text-sm font-medium transition-all shadow-sm ${category === cat
                        ? 'gradient-primary text-primary-foreground'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-bold text-foreground">{filtered?.length}</span> results
              </p>
              <div className="flex gap-1 bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setView("table")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === "table"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Table
                </button>

                <button
                  onClick={() => setView("grid")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === "grid"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Grid
                </button>
              </div>
            </div>

            {/* Results */}
            {view === "grid" ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered?.length > 0 ? (
                  filtered.map((biz, idx) => (
                    <div key={biz.businessId || idx} className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-lg transition-all group">
                      <div className="relative h-44 overflow-hidden bg-muted flex items-center justify-center">
                        {biz?.businessCoverImage ? (
                          <img src={biz?.businessCoverImage} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <Star className="h-10 w-10 mb-2" />
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                            {biz.businessCategory}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-heading font-bold text-foreground text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-1">{biz.businessName}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4">{biz?.businessDescription}</p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate">{biz?.businessAddress}</span>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-border">
                          <img src={biz?.ownerImage} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-muted" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Owner</span>
                            <span className="text-xs font-bold text-foreground">{biz?.ownerName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-card rounded-2xl border border-dashed border-border">
                    <p className="text-muted-foreground">No businesses found matching your criteria.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-hidden bg-card rounded-2xl border border-border shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Business</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Owner</th>
                        <th className="px-6 py-4">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered?.length > 0 ? (
                        filtered.map((biz, idx) => (
                          <tr key={biz.businessId || idx} className="hover:bg-muted/30 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-4">
                                {biz?.businessCoverImage ? (
                                  <img src={biz?.businessCoverImage} className="h-12 w-12 object-cover rounded-xl shadow-sm border border-border" />
                                ) : (
                                  <div className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                                    <Star className="h-5 w-5" />
                                  </div>
                                )}
                                <span className="font-bold text-foreground group-hover:text-primary transition-colors">{biz.businessName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground uppercase">{biz.businessCategory}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <img src={biz?.ownerImage} className="h-8 w-8 rounded-full object-cover ring-1 ring-border" />
                                <span className="font-medium text-foreground">{biz.ownerName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="truncate max-w-[200px]">{biz.businessAddress}</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground">
                            No data found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default Directory;
