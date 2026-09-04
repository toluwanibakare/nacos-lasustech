import nacosDayFlyer from "@/assets/Events/nacos-day/flyer.jpeg";
import bootcampFlyer from "@/assets/Events/PHOTO-2026-04-28-12-14-22.jpg";
import ladiesInTechFlyer from "@/assets/Events/PHOTO-2026-04-29-09-06-01.jpg";
import hodCupFlyer from "@/assets/Events/PHOTO-2026-04-24-17-16-18.jpg";
import nccVisitFlyer from "@/assets/Events/ncc-visit/IMG-16.jpg";

export interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  image: string;
  upcoming?: boolean;
  ongoing?: boolean;
  contain?: boolean;
}

export const events: Event[] = [
  {
    id: "ncc-visit",
    title: "HONORARY VISIT TO THE NCC CHAIRMAN",
    date: "August 4, 2026",
    description: "An honorary visit to the Chairman of the Nigerian Communications Commission (NCC) by delegates of NACOS LASUSTECH Chapter, featuring award presentations, strategic discussions, and official recognitions.",
    image: nccVisitFlyer,
    upcoming: false,
    contain: false,
  },
  {
    id: "nacos-day",
    title: "NACOS DAY 2026: AI & TECH SUMMIT",
    date: "June 17, 2026",
    description: "An extraordinary grand tech event featuring AI technology exhibitions, guest talks, and interactive sessions. Proudly supported by Web3Bridge, Resolva, Enyata, Oracle Academy, and top tech partners.",
    image: nacosDayFlyer,
    upcoming: false,
    contain: true,
  },
  {
    id: "ladies-in-tech",
    title: "LADIES IN TECH EVENT",
    date: "May 1, 2026",
    description: "Theme: Overcoming fear and imposter syndrome. Featuring guest speakers Agape Oluwa, Mujisatullahi Bakare, and Naheemat Akinyemi A. Hosted by Owolabi Grace (Lady Vice). Join us on Google Meet at 8:00 PM. Contact the PRO (+234 810 563 8170) for more info.",
    image: ladiesInTechFlyer,
    upcoming: false,
    contain: true,
  },
  {
    id: "hod-cup",
    title: "HOD'S CUP 2025/2026",
    date: "April 22 - May 7, 2026",
    description: "The annual HOD'S CUP featuring Football, Chess, and Scrabble. A month of intense competition where the department's best athletes battled for glory.",
    image: hodCupFlyer,
    ongoing: false,
    upcoming: false,
    contain: true,
  },
  {
    id: "bootcamp-onboarding",
    title: "NACOS Tech Upscaling Bootcamp Onboarding",
    date: "April 29, 2026",
    description: "The official onboarding session for the NACOS Upscaling Bootcamp, introducing students to advanced computing tracks and industry mentorship.",
    image: bootcampFlyer,
    upcoming: false,
    contain: true,
  },
];


