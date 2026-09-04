import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  X, 
  Eye, 
  Download, 
  Calendar, 
  Tag, 
  Images, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  ArrowUpDown
} from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { eventGalleries, GallerySection, GalleryImage } from "@/data/galleries";

const Gallery = () => {
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [lightboxData, setLightboxData] = useState<{
    images: GalleryImage[];
    currentIndex: number;
    eventTitle: string;
    eventTag: string;
  } | null>(null);

  // Convert object values into array
  const allGalleries: GallerySection[] = Object.values(eventGalleries);

  // Get unique event tags for filter pills
  const eventTags = ["All", ...Array.from(new Set(allGalleries.map((g) => g.eventTag)))];

  // Filter galleries by selected tag
  const filteredGalleries = allGalleries.filter((g) => {
    if (selectedTag === "All") return true;
    return g.eventTag === selectedTag;
  });

  // Sort galleries based on date of occurrence
  const sortedGalleries = [...filteredGalleries].sort((a, b) => {
    const dateA = a.dateSortValue || "0000-00-00";
    const dateB = b.dateSortValue || "0000-00-00";
    if (sortOrder === "newest") {
      return dateB.localeCompare(dateA);
    } else {
      return dateA.localeCompare(dateB);
    }
  });

  const handleDownload = (e: React.MouseEvent, src: string, alt: string) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = src;
    link.download = `${alt.toLowerCase().replace(/\s+/g, "-")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openLightbox = (gallery: GallerySection, index: number) => {
    setLightboxData({
      images: gallery.images,
      currentIndex: index,
      eventTitle: gallery.title,
      eventTag: gallery.eventTag,
    });
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lightboxData) return;
    setLightboxData({
      ...lightboxData,
      currentIndex: (lightboxData.currentIndex + 1) % lightboxData.images.length,
    });
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lightboxData) return;
    setLightboxData({
      ...lightboxData,
      currentIndex:
        (lightboxData.currentIndex - 1 + lightboxData.images.length) %
        lightboxData.images.length,
    });
  };

  return (
    <Layout>
      {/* Header Banner */}
      <section className="bg-foreground py-14 md:py-20">
        <div className="container">
          <div className="max-w-lg">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Media Archive</span>
            <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-4xl">Event Gallery</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Explore captures, milestones, and memorable moments across all NACOS LASUSTECH events, organized chronologically.
            </p>
          </div>
        </div>
      </section>

      {/* Filter and Sorting Controls */}
      <section className="border-b border-border bg-card py-6 sticky top-[64px] sm:top-[76px] z-30 shadow-sm backdrop-blur-md bg-card/95">
        <div className="container">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Filter by Event Tag */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground shrink-0 mr-1">
                <Filter className="h-3.5 w-3.5" /> Tags:
              </span>
              {eventTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    selectedTag === tag
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {tag === "All" ? "All Event Galleries" : tag}
                </button>
              ))}
            </div>

            {/* Sort Order Toggle */}
            <div className="flex items-center justify-between md:justify-end gap-3 border-t border-border/50 pt-3 md:border-t-0 md:pt-0">
              <span className="text-xs font-medium text-muted-foreground">
                Showing {sortedGalleries.length} {sortedGalleries.length === 1 ? "gallery" : "galleries"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                className="gap-2 text-xs font-semibold"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sortOrder === "newest" ? "Newest First" : "Oldest First"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Event Galleries List */}
      <section className="py-14 md:py-20 bg-muted/10">
        <div className="container space-y-16">
          {sortedGalleries.length === 0 ? (
            <div className="py-20 text-center">
              <h3 className="text-xl font-bold">No Galleries Found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No gallery found matching the selected tag "{selectedTag}".
              </p>
              <Button onClick={() => setSelectedTag("All")} className="mt-6">
                View All Galleries
              </Button>
            </div>
          ) : (
            sortedGalleries.map((gallery) => (
              <div
                key={gallery.eventId}
                className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm transition-all hover:shadow-md"
              >
                {/* Event Gallery Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b border-border/60 pb-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Event Tag */}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        <Tag className="h-3 w-3" /> {gallery.eventTag}
                      </span>
                      {/* Date Badge */}
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 text-primary" /> {gallery.date}
                      </span>
                      {/* Photo Count */}
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {gallery.images.length} photos
                      </span>
                    </div>

                    <h2 className="mt-3 font-display text-2xl font-bold text-foreground md:text-3xl">
                      {gallery.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-3xl">
                      {gallery.description}
                    </p>
                  </div>

                  <Link to={`/events/${gallery.eventId}/gallery`} className="shrink-0 self-start">
                    <Button variant="outline" className="gap-2 font-semibold text-xs">
                      View Full Album ({gallery.images.length}) <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>

                {/* Photo Grid Preview */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-4">
                  {gallery.images.slice(0, 8).map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => openLightbox(gallery, idx)}
                      className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl bg-muted"
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-foreground shadow-md transition-transform hover:scale-110"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDownload(e, img.src, img.alt)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-110"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {gallery.images.length > 8 && (
                  <div className="mt-4 text-center">
                    <Link
                      to={`/events/${gallery.eventId}/gallery`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      + {gallery.images.length - 8} more photos in this event gallery
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxData(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxData(null)}
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Previous image */}
          {lightboxData.images.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white hover:text-black"
              title="Previous Photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Next image */}
          {lightboxData.images.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white hover:text-black"
              title="Next Photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Lightbox content */}
          <div
            className="relative flex flex-col items-center max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header info */}
            <div className="mb-3 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                <Tag className="h-3 w-3 text-primary" /> {lightboxData.eventTag} • Photo{" "}
                {lightboxData.currentIndex + 1} of {lightboxData.images.length}
              </span>
            </div>

            <img
              src={lightboxData.images[lightboxData.currentIndex].src}
              alt={lightboxData.images[lightboxData.currentIndex].alt}
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />

            <p className="mt-3 text-center text-xs font-medium text-white/80">
              {lightboxData.images[lightboxData.currentIndex].alt}
            </p>

            <div className="mt-4 flex gap-3">
              <button
                onClick={(e) =>
                  handleDownload(
                    e,
                    lightboxData.images[lightboxData.currentIndex].src,
                    lightboxData.images[lightboxData.currentIndex].alt
                  )
                }
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold text-black shadow-lg transition-transform hover:scale-105"
              >
                <Download className="h-4 w-4" /> Download Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Gallery;
