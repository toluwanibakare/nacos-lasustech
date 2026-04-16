import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";

export interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  image: string;
  upcoming?: boolean;
}

export const events: Event[] = [
  {
    id: "1",
    title: "NACOS Tech Summit 2025",
    date: "May 15, 2025",
    description: "An annual gathering of computing students featuring keynote speakers, panel discussions, and networking with industry professionals.",
    image: event1,
    upcoming: true,
  },
  {
    id: "2",
    title: "Code Camp: Web Development Bootcamp",
    date: "April 22, 2025",
    description: "An intensive hands-on workshop on modern web development with React, TypeScript, and backend technologies.",
    image: event2,
    upcoming: true,
  },
  {
    id: "3",
    title: "NACOS Week Celebration",
    date: "March 10, 2025",
    description: "A week-long celebration featuring competitions, exhibitions, guest lectures, and social activities for all members.",
    image: event3,
  },
  {
    id: "4",
    title: "Freshers Orientation",
    date: "February 5, 2025",
    description: "Welcome event for new students in the Department of Computer Science, introducing them to the NACOS family.",
    image: event1,
  },
  {
    id: "5",
    title: "Cybersecurity Awareness Seminar",
    date: "January 20, 2025",
    description: "An informative session on digital safety, ethical hacking fundamentals, and careers in cybersecurity.",
    image: event2,
  },
];
