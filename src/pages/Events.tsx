import { useState } from "react";
import { X } from "lucide-react";
import Layout from "@/components/Layout";
import EventCard from "@/components/EventCard";
import { events } from "@/data/events";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";

const images = [
  { src: gallery1, alt: "NACOS group photo" },
  { src: event1, alt: "Tech summit event" },
  { src: gallery2, alt: "Panel discussion" },
  { src: gallery3, alt: "Outdoor celebration" },
  { src: event2, alt: "Coding workshop" },
  { src: gallery4, alt: "Tech exhibition" },
];

const Events = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const upcomingEvents = events.filter((e) => e.upcoming);
  const pastEvents = events.filter((e) => !e.upcoming);

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
        <section className="py-14 md:py-20">
          <div className="container">
            <h3 className="font-display text-lg font-bold text-foreground">Featured Upcoming</h3>
            <div className="mt-6">
              <EventCard {...upcomingEvents[0]} featured />
            </div>
            {upcomingEvents.length > 1 && (
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.slice(1).map((event) => (
                  <EventCard key={event.id} {...event} />
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
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((event) => (
                <EventCard key={event.id} {...event} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="gallery" className="border-t border-border bg-muted/30 py-14 md:py-20">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            <div className="max-w-md">
              <h3 className="font-display text-2xl font-bold text-foreground">Photo Gallery</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Highlights and memories from our chapter's events and milestones.
              </p>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className="group overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {selectedImage !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={images[selectedImage].src}
            alt={images[selectedImage].alt}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Layout>
  );
};

export default Events;

