import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";

// Bootcamp Onboarding Images
import bootcamp1 from "@/assets/Events/bootcamp_onboarding/PHOTO-2026-04-29-19-36-03.jpg";
import bootcamp2 from "@/assets/Events/bootcamp_onboarding/PHOTO-2026-04-29-19-36-06.jpg";
import bootcamp3 from "@/assets/Events/bootcamp_onboarding/PHOTO-2026-04-29-19-36-06(1).jpg";
import bootcamp4 from "@/assets/Events/bootcamp_onboarding/PHOTO-2026-04-29-19-36-07.jpg";
import bootcamp5 from "@/assets/Events/bootcamp_onboarding/PHOTO-2026-04-29-19-36-08.jpg";
import bootcamp6 from "@/assets/Events/bootcamp_onboarding/PHOTO-2026-04-29-19-36-08(1).jpg";
import bootcamp7 from "@/assets/Events/bootcamp_onboarding/PHOTO-2026-04-29-19-36-10.jpg";
import bootcamp8 from "@/assets/Events/bootcamp_onboarding/PHOTO-2026-04-29-19-36-10(1).jpg";
import bootcamp9 from "@/assets/Events/bootcamp_onboarding/PHOTO-2026-04-29-19-36-11.jpg";
import bootcamp10 from "@/assets/Events/bootcamp_onboarding/PHOTO-2026-04-29-19-36-11(1).jpg";

export interface GalleryImage {
  src: string;
  alt: string;
}

export interface GallerySection {
  eventId: string;
  title: string;
  description: string;
  images: GalleryImage[];
}

export const eventGalleries: Record<string, GallerySection> = {
  "bootcamp-onboarding": {
    eventId: "bootcamp-onboarding",
    title: "NACOS UPSCALING BOOTCAMP ONBOARDING EVENT",
    description: "High-quality captures from our recent bootcamp onboarding and orientation session.",
    images: [
      { src: bootcamp1, alt: "Bootcamp Onboarding 1" },
      { src: bootcamp2, alt: "Bootcamp Onboarding 2" },
      { src: bootcamp3, alt: "Bootcamp Onboarding 3" },
      { src: bootcamp4, alt: "Bootcamp Onboarding 4" },
      { src: bootcamp5, alt: "Bootcamp Onboarding 5" },
      { src: bootcamp6, alt: "Bootcamp Onboarding 6" },
      { src: bootcamp7, alt: "Bootcamp Onboarding 7" },
      { src: bootcamp8, alt: "Bootcamp Onboarding 8" },
      { src: bootcamp9, alt: "Bootcamp Onboarding 9" },
      { src: bootcamp10, alt: "Bootcamp Onboarding 10" },
    ]
  },
  "1": {
    eventId: "1",
    title: "NACOS Tech Summit Highlights",
    description: "Memories from the annual Tech Summit gathering.",
    images: [
      { src: event1, alt: "Tech Summit Keynote" },
      { src: gallery2, alt: "Panel Session" },
    ]
  }
};
