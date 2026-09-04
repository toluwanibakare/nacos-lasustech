import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";

// NACOS Day 2026 Images
import nacosDay1 from "@/assets/Events/nacos-day/Nacos 2026.jpg";
import nacosDay2 from "@/assets/Events/nacos-day/Nacos 2026-7.jpg";
import nacosDay3 from "@/assets/Events/nacos-day/Nacos 2026-14.jpg";
import nacosDay4 from "@/assets/Events/nacos-day/Nacos 2026-19.jpg";
import nacosDay5 from "@/assets/Events/nacos-day/Nacos 2026-24.jpg";
import nacosDay6 from "@/assets/Events/nacos-day/Nacos 2026-28.jpg";
import nacosDay7 from "@/assets/Events/nacos-day/Nacos 2026-31.jpg";
import nacosDay8 from "@/assets/Events/nacos-day/Nacos 2026-34.jpg";
import nacosDay9 from "@/assets/Events/nacos-day/Nacos 2026-35.jpg";
import nacosDay10 from "@/assets/Events/nacos-day/Nacos 2026-36.jpg";
import nacosDay11 from "@/assets/Events/nacos-day/Nacos 2026-48.jpg";
import nacosDay12 from "@/assets/Events/nacos-day/Nacos 2026-53.jpg";

// HOD Cup Images (Certificates first, then match/event photos)
import hodCert1 from "@/assets/Events/hod-cup/1st_cert.jpeg";
import hodCert2 from "@/assets/Events/hod-cup/2nd_cert.jpeg";
import hodCert3 from "@/assets/Events/hod-cup/3rd_cert.jpeg";
import hodImg1 from "@/assets/Events/hod-cup/WhatsApp Image 2026-09-04 at 02.58.40.jpeg";
import hodImg2 from "@/assets/Events/hod-cup/WhatsApp Image 2026-09-04 at 02.58.41.jpeg";
import hodImg3 from "@/assets/Events/hod-cup/WhatsApp Image 2026-09-04 at 02.58.41 (1).jpeg";
import hodImg4 from "@/assets/Events/hod-cup/WhatsApp Image 2026-09-04 at 02.58.41 (2).jpeg";
import hodImg5 from "@/assets/Events/hod-cup/WhatsApp Image 2026-09-04 at 02.58.41 (3).jpeg";
import hodImg6 from "@/assets/Events/hod-cup/WhatsApp Image 2026-09-04 at 02.58.42.jpeg";
import hodImg7 from "@/assets/Events/hod-cup/WhatsApp Image 2026-09-04 at 02.58.42 (1).jpeg";
import hodImg8 from "@/assets/Events/hod-cup/WhatsApp Image 2026-09-04 at 02.58.42 (2).jpeg";
import hodImg9 from "@/assets/Events/hod-cup/WhatsApp Image 2026-09-04 at 02.58.42 (3).jpeg";

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

// NCC Visit Images
import ncc1 from "@/assets/Events/ncc-visit/IMG-16.jpg";
import ncc2 from "@/assets/Events/ncc-visit/IMG-21.jpg";
import ncc3 from "@/assets/Events/ncc-visit/IMG-3.jpg";
import ncc4 from "@/assets/Events/ncc-visit/IMG-43.jpg";
import ncc5 from "@/assets/Events/ncc-visit/IMG-53.jpg";
import ncc6 from "@/assets/Events/ncc-visit/IMG-65.jpg";
import ncc7 from "@/assets/Events/ncc-visit/IMG-78.jpg";
import ncc8 from "@/assets/Events/ncc-visit/IMG-89.jpg";
import ncc9 from "@/assets/Events/ncc-visit/IMG-98.jpg";
import ncc10 from "@/assets/Events/ncc-visit/IMG-100.jpg";
import ncc11 from "@/assets/Events/ncc-visit/IMG-102.jpg";
import ncc12 from "@/assets/Events/ncc-visit/IMG-112.jpg";

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
  "nacos-day": {
    eventId: "nacos-day",
    title: "NACOS DAY 2026 GALLERY",
    description: "Captivating highlights and gallery from NACOS Day 2026 (June 17th, 2026), featuring AI technology exhibitions and sessions with Web3Bridge, Resolva, Enyata, Oracle Academy, and top partners.",
    images: [
      { src: nacosDay1, alt: "NACOS Day 2026 Highlights 1" },
      { src: nacosDay2, alt: "NACOS Day 2026 Highlights 2" },
      { src: nacosDay3, alt: "NACOS Day 2026 Highlights 3" },
      { src: nacosDay4, alt: "NACOS Day 2026 Highlights 4" },
      { src: nacosDay5, alt: "NACOS Day 2026 Highlights 5" },
      { src: nacosDay6, alt: "NACOS Day 2026 Highlights 6" },
      { src: nacosDay7, alt: "NACOS Day 2026 Highlights 7" },
      { src: nacosDay8, alt: "NACOS Day 2026 Highlights 8" },
      { src: nacosDay9, alt: "NACOS Day 2026 Highlights 9" },
      { src: nacosDay10, alt: "NACOS Day 2026 Highlights 10" },
      { src: nacosDay11, alt: "NACOS Day 2026 Highlights 11" },
      { src: nacosDay12, alt: "NACOS Day 2026 Highlights 12" },
    ]
  },
  "hod-cup": {
    eventId: "hod-cup",
    title: "HOD'S CUP 2025/2026 GALLERY",
    description: "Award certificates and highlight gallery from the annual HOD'S CUP tournament.",
    images: [
      { src: hodCert1, alt: "HOD's Cup 1st Place Certificate" },
      { src: hodCert2, alt: "HOD's Cup 2nd Place Certificate" },
      { src: hodCert3, alt: "HOD's Cup 3rd Place Certificate" },
      { src: hodImg1, alt: "HOD's Cup Tournament Photo 1" },
      { src: hodImg2, alt: "HOD's Cup Tournament Photo 2" },
      { src: hodImg3, alt: "HOD's Cup Tournament Photo 3" },
      { src: hodImg4, alt: "HOD's Cup Tournament Photo 4" },
      { src: hodImg5, alt: "HOD's Cup Tournament Photo 5" },
      { src: hodImg6, alt: "HOD's Cup Tournament Photo 6" },
      { src: hodImg7, alt: "HOD's Cup Tournament Photo 7" },
      { src: hodImg8, alt: "HOD's Cup Tournament Photo 8" },
      { src: hodImg9, alt: "HOD's Cup Tournament Photo 9" },
    ]
  },
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
  "ncc-visit": {
    eventId: "ncc-visit",
    title: "HONORARY VISIT TO THE NCC CHAIRMAN GALLERY",
    description: "Photos and captures from the honorary visit to the Chairman of the NCC on August 4th, 2026, featuring NACOS LASUSTECH delegates, award presentations, and official proceedings.",
    images: [
      { src: ncc1, alt: "NCC Visit 1" },
      { src: ncc2, alt: "NCC Visit 2" },
      { src: ncc3, alt: "NCC Visit 3" },
      { src: ncc4, alt: "NCC Visit 4" },
      { src: ncc5, alt: "NCC Visit 5" },
      { src: ncc6, alt: "NCC Visit 6" },
      { src: ncc7, alt: "NCC Visit 7" },
      { src: ncc8, alt: "NCC Visit 8" },
      { src: ncc9, alt: "NCC Visit 9" },
      { src: ncc10, alt: "NCC Visit 10" },
      { src: ncc11, alt: "NCC Visit 11" },
      { src: ncc12, alt: "NCC Visit 12" },
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


