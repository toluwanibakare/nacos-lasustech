import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { X, Eye, Download, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { eventGalleries } from "@/data/galleries";

const EventGallery = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const gallery = id ? eventGalleries[id] : null;
  const [selectedImage, setSelectedImage] = useState<{ src: string, alt: string } | null>(null);

  useEffect(() => {
    if (!gallery && id) {
      // If gallery doesn't exist for this ID, maybe redirect back or show error
      console.error("Gallery not found for ID:", id);
    }
  }, [gallery, id]);

  if (!gallery) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-bold">Gallery Not Found</h2>
          <p className="mt-4 text-muted-foreground">The requested gallery does not exist or has no images yet.</p>
          <Link to="/events">
            <Button className="mt-8">Back to Events</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleDownload = (e: React.MouseEvent, src: string, alt: string) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = src;
    link.download = `${alt.toLowerCase().replace(/\s+/g, "-")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <section className="bg-foreground py-14 md:py-20">
        <div className="container">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Events
          </button>
          <div className="mt-6 max-w-2xl">
            <h1 className="font-display text-3xl font-bold text-white md:text-4xl">{gallery.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              {gallery.description}
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {gallery.images.map((img, i) => (
              <div
                key={i}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted transition-all duration-300 hover:shadow-xl"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Overlay with buttons */}
                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <button
                    onClick={() => setSelectedImage(img)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-sm transition-transform hover:scale-110"
                    title="View Full Image"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => handleDownload(e, img.src, img.alt)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-transform hover:scale-110"
                    title="Download Image"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedImage !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/95 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -right-4 -top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-lg transition-transform hover:scale-110"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="h-auto max-h-[85vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-4 flex justify-center">
              <button
                onClick={(e) => handleDownload(e, selectedImage.src, selectedImage.alt)}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-foreground shadow-lg transition-transform hover:scale-105"
              >
                <Download className="h-4 w-4" /> Download Original
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EventGallery;
