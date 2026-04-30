import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import EventCard from "@/components/EventCard";
import { events } from "@/data/events";
import { X, Download, Maximize2 } from "lucide-react";

const Events = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const upcomingEvents = events.filter((e) => e.upcoming);
  const pastEvents = events.filter((e) => !e.upcoming);

  const handleDownload = (imageUrl: string, title: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${title.replace(/\s+/g, "_")}_flyer.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <section className="bg-foreground py-14 md:py-20">
        <div className="container">
          <div className="max-w-lg">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Events & Highlights</span>
            <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-4xl">Chapter Events</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Stay informed about our latest programs, workshops, and gatherings.
            </p>
          </div>
        </div>
      </section>

      {upcomingEvents.length > 0 && (
        <section className="py-14 md:py-20 bg-muted/20">
          <div className="container">
            <h3 className="font-display text-lg font-bold text-foreground mb-8">Featured & Ongoing</h3>
            <div className="flex justify-center">
              <div className="w-full max-w-4xl">
                <EventCard 
                  {...upcomingEvents[0]} 
                  featured 
                  ongoing={upcomingEvents[0].ongoing}
                  upcoming={upcomingEvents[0].upcoming}
                  contain={upcomingEvents[0].contain}
                  onClick={() => setSelectedImage(upcomingEvents[0].image)}
                />
              </div>
            </div>
            
            {upcomingEvents.length > 1 && (
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.slice(1).map((event) => (
                  <EventCard 
                    key={event.id} 
                    {...event} 
                    ongoing={event.ongoing}
                    upcoming={event.upcoming}
                    contain={event.contain}
                    onClick={() => setSelectedImage(event.image)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {pastEvents.length > 0 && (
        <section className="border-t border-border py-14 md:py-20">
          <div className="container">
            <h3 className="font-display text-lg font-bold text-foreground">Past Events</h3>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((event) => (
                <EventCard 
                  key={event.id} 
                  {...event} 
                  ongoing={event.ongoing}
                  upcoming={event.upcoming}
                  contain={event.contain}
                  onClick={() => navigate(`/events/${event.id}/gallery`)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-8 w-8" />
          </button>
          
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedImage} 
              alt="Flyer Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-4 right-4 flex gap-3">
              <button
                onClick={() => handleDownload(selectedImage, "event")}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition-all shadow-lg"
              >
                <Download className="h-4 w-4" />
                Download Flyer
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Events;


