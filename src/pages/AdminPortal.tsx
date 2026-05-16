import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { 
  Users, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Plus, 
  Trash2, 
  LayoutDashboard 
} from "lucide-react";

const AdminPortal = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "executives" | "events" | "blogs" | "messages">("dashboard");
  const [data, setData] = useState<any>({ executives: [], events: [], blogs: [], messages: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let user: any = {};
    try {
      const userStr = localStorage.getItem("user");
      user = (userStr && userStr !== "null") ? JSON.parse(userStr) : {};
    } catch (e) {
      console.error("Admin user parse error", e);
    }

    if (!user || user.role !== "admin") {
      toast({ title: "Unauthorized", description: "Only admins can enter here, bro!", variant: "destructive" });
      navigate("/dashboard");
      return;
    }
    fetchAdminData();
  }, [navigate]);

  const [stats, setStats] = useState<any>({});

  const fetchAdminData = async () => {
    try {
      // Fetching all management data using our API utility
      const [excos, evts, blgs, msgs, sysStats] = await Promise.all([
        fetchApi('/content/executives'),
        fetchApi('/content/events'),
        fetchApi('/content/blogs'),
        fetchApi('/admin/messages'),
        fetchApi('/admin/stats')
      ]);

      setData({ executives: excos, events: evts, blogs: blgs, messages: msgs });
      setStats(sysStats);
    } catch (error) {
      console.error(error);
      toast({ title: "Sync Error", description: "Could not fetch latest management data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: string, id: number) => {
    try {
      await fetchApi(`/admin/${type}/${id}`, { method: 'DELETE' });
      toast({ title: "Deleted!", description: `${type} removed successfully.` });
      fetchAdminData();
    } catch (error) {
      toast({ title: "Error", description: "Could not delete item.", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="flex min-h-screen bg-muted/30">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-border p-6 hidden md:block">
          <h1 className="font-display text-xl font-bold text-primary mb-8">Admin Center</h1>
          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'executives', label: 'Executives', icon: Users },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'blogs', label: 'Blog Posts', icon: FileText },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-10">
          <header className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-display font-bold">Management Panel</h2>
              <p className="text-muted-foreground">Control your chapter's digital presence.</p>
            </div>
            <Button className="rounded-full gap-2">
              <Plus className="h-4 w-4" /> Add New {activeTab.slice(0, -1)}
            </Button>
          </header>

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Students', value: stats.totalStudents || 0, icon: Users, color: 'text-blue-600' },
                { label: 'Dues Paid', value: stats.paidStudents || 0, icon: Calendar, color: 'text-green-600' },
                { label: 'Total Revenue', value: `₦${(stats.revenue || 0).toLocaleString()}`, icon: FileText, color: 'text-purple-600' },
                { label: 'Pending ID Cards', value: stats.pendingIDCards || 0, icon: MessageSquare, color: 'text-amber-600' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-border shadow-sm">
                  <stat.icon className={`h-8 w-8 ${stat.color} mb-4`} />
                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-display font-bold mt-1">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {(activeTab === 'executives' || activeTab === 'events' || activeTab === 'blogs') && (
            <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Title/Name</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Detail</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data[activeTab].map((item: any) => (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold">{item.title || item.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-muted-foreground line-clamp-1">{item.excerpt || item.post || item.description}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(activeTab, item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-4">
              {data.messages.map((msg: any) => (
                <div key={msg.id} className="bg-white p-6 rounded-2xl border border-border shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{msg.full_name}</h3>
                    <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-primary font-medium mb-2">{msg.email} | {msg.subject}</p>
                  <p className="text-sm text-muted-foreground">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminPortal;
