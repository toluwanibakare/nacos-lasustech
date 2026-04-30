import bootcampFlyer from "@/assets/Events/PHOTO-2026-04-28-12-14-22.jpg";
import ladiesInTechFlyer from "@/assets/Events/PHOTO-2026-04-29-09-06-01.jpg";
import hodCupFlyer from "@/assets/Events/PHOTO-2026-04-24-17-16-18.jpg";
import finalFixtureFlyer from "@/assets/Events/final_fixture.jpg";

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
    id: "hod-cup-finale",
    title: "HOD'S CUP: THE GRAND FINALE",
    date: "May 7, 2026",
    description: "The ultimate glory awaits! Join us for the 3rd Place Match (100L vs 200L) at 12:00 NOON and the Final Match (300L vs 400L) at 1:30 PM. Venue: LASUSTECH Main Field.",
    image: finalFixtureFlyer,
    upcoming: true,
    contain: true,
  },
  {
    id: "ladies-in-tech",
    title: "LADIES IN TECH EVENT",
    date: "May 1, 2026",
    description: "Theme: Overcoming fear and imposter syndrome. Featuring guest speakers Agape Oluwa, Mujisatullahi Bakare, and Naheemat Akinyemi A. Hosted by Owolabi Grace (Lady Vice). Join us on Google Meet at 8:00 PM. Contact the PRO (+234 810 563 8170) for more info.",
    image: ladiesInTechFlyer,
    upcoming: true,
    contain: true,
  },
  {
    id: "hod-cup",
    title: "HOD'S CUP 2025/2026",
    date: "April 22 - Ongoing",
    description: "The annual HOD'S CUP featuring Football, Chess, and Scrabble. Witness the intense competition as the department's best athletes battle for glory.",
    image: hodCupFlyer,
    ongoing: true,
    upcoming: true,
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
