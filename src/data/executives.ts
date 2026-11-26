import presidentImg from "@/assets/president.jpg";
import vpImg from "@/assets/vice_president.jpg";
import ladyViceImg from "@/assets/lady_vice.jpeg";
import gensecImg from "@/assets/gensec.jpeg";
import treasurerImg from "@/assets/Treasurer.jpeg";
import proImg from "@/assets/pro.jpg";
import sportsDirectorImg from "@/assets/sports.jpg";
import socialDirectorImg from "@/assets/social_director.png";
import welfareImg from "@/assets/welfare.jpeg";
import hoc400Img from "@/assets/hoc_400.jpg";
import asshoc400Img from "@/assets/asshoc_400.jpg";
import asshoc300Img from "@/assets/asshoc_300.jpeg";
import hoc200Img from "@/assets/hoc_200.jpg";
import asshoc200Img from "@/assets/asshoc_200.jpg";
import hoc100Img from "@/assets/hoc_100.jpeg";
import asshoc100Img from "@/assets/asshoc_100.jpeg";
import hoc300Img from "@/assets/hoc_300.jpg";
import assGensecImg from "@/assets/ass_gensec.jpg";
import finsecImg from "@/assets/finsec.jpg";
import dirStudiesImg from "@/assets/dir_studies.JPG";

export interface Executive {
  id?: string;
  name: string;
  post: string;
  level: string;
  description: string;
  image: string;
  objectPosition?: string;
  vacant?: boolean;
}

export interface ExecutiveSessionData {
  session: string;
  label: string;
  isCurrent?: boolean;
  topLeaders: Executive[];
  coreExecutives: Executive[];
  hocs: Executive[];
  asstHocs: Executive[];
}

export interface HallOfFameHolder {
  id: string;
  name: string;
  session: string;
  post: string;
  image: string;
  objectPosition?: string;
  note?: string;
}

export interface HallOfFamePositionGroup {
  id: string;
  position: string;
  holders: HallOfFameHolder[];
}

export const CURRENT_SESSION = "2026/2027";

/**
 * 2025/2026 Executive Council (archived session).
 * Includes the 2025/2026 400L HOC and Assistant HOC who have now graduated out of active HOC roles.
 */
export const executives2025_2026: Executive[] = [
  {
    name: "Shofunde Jubril Ajibola",
    post: "President",
    level: "400 Level",
    description: "Serves as the primary leader and official representative of the NACOS LASUSTECH Chapter, overseeing all activities and strategic growth.",
    image: presidentImg,
    objectPosition: "object-top",
  },
  {
    name: "Toluwani Moses Bakare",
    post: "Vice President",
    level: "300 Level",
    description: "Acts as the chief assistant to the President, coordinating administrative programs and ensuring organizational stability.",
    image: vpImg,
  },
  {
    name: "Owolabi Grace Oluwafunmilayo",
    post: "Lady Vice-President",
    level: "200 Level",
    description: "Focuses on the empowerment and representation of female students within the computing community and supporting top-level initiatives.",
    image: ladyViceImg,
  },
  {
    name: "Oladepo Damilare David",
    post: "General Secretary",
    level: "300 Level",
    description: "The custodian of chapter records, responsible for official documentation, correspondence, and meeting coordination.",
    image: gensecImg,
  },
  {
    name: "Emmanuel Ariyo Ogunfunwa",
    post: "Assistant General Secretary",
    level: "200 Level",
    description: "Supports the General Secretary in administrative duties and ensures continuous documentation of chapter affairs.",
    image: assGensecImg,
  },
  {
    name: "Onaade Abdulmuqtadir Ayomide",
    post: "Financial Secretary",
    level: "300 Level",
    description: "Maintains accurate financial records, manages budget allocations, and ensures financial transparency across all chapter projects.",
    image: finsecImg,
  },
  {
    name: "Ebhojie Oluwadamilola",
    post: "Treasurer",
    level: "300 Level",
    description: "Oversees the chapter's treasury, managing funds, ensuring secure disbursements, and providing detailed financial reports.",
    image: treasurerImg,
  },
  {
    name: "Aladekoye Samuel",
    post: "Public Relations Officer",
    level: "100 Level",
    description: "The official spokesperson for the chapter, managing media relations, brand image, and external communications.",
    image: proImg,
  },
  {
    name: "Fatai Adewale",
    post: "Social Director",
    level: "300 Level",
    description: "Organizes social events, workshops, and recreational activities to foster a strong sense of community and networking.",
    image: socialDirectorImg,
  },
  {
    name: "Egba Uthman Temitayo",
    post: "Sport Director",
    level: "200 Level",
    description: "Coordinates athletic events and fitness programs to promote physical well-being and department-wide team spirit.",
    image: sportsDirectorImg,
  },
  {
    name: "Akinrinade Moses Imisioluwa",
    post: "Director of Studies",
    level: "",
    description: "Oversees the department's academic programs, curriculum and student's academic progress.",
    image: dirStudiesImg,
  },
  {
    name: "Oluwatobi Oluwaseyi Isaac",
    post: "Welfare Director",
    level: "400 Level",
    description: "Monitors and ensures the general well-being and support of all computing students within the chapter.",
    image: welfareImg,
  },
  // 2025/2026 HOCs Descending (400 - 100)
  {
    name: "Olagunju Basheer Olaniyi",
    post: "Electoral Chairman / HOC 400L",
    level: "400 Level",
    description: "Leads the senior class and oversees the integrity and execution of the chapter's electoral processes.",
    image: hoc400Img,
  },
  {
    name: "Adegoke Muhammed",
    post: "HOC for 300 level",
    level: "300 Level",
    description: "Serves as the primary link between the 300 level students and the executive council, managing class-specific affairs.",
    image: hoc300Img,
  },
  {
    name: "Osho Aishat",
    post: "HOC for 200 level",
    level: "200 Level",
    description: "Coordinates academic and social activities for the 200 level class, ensuring their voices are heard in the chapter.",
    image: hoc200Img,
  },
  {
    name: "Ayara Michael",
    post: "HOC for 100 level",
    level: "100 Level",
    description: "Guides and represents the path of year-one students, helping them integrate into the NACOS community.",
    image: hoc100Img,
  },
  // 2025/2026 Asst HOCs Descending (400 - 100)
  {
    name: "Adebisi Emmanuel Oluwatobi",
    post: "Assistant HOC for 400L",
    level: "400 Level",
    description: "Assists the 400L HOC in class management and leadership duties for the graduating class.",
    image: asshoc400Img,
    objectPosition: "object-top",
  },
  {
    name: "Matti Jadesola",
    post: "Assistant HOC for 300level",
    level: "300 Level",
    description: "Provides administrative support to the 300L HOC and class activities.",
    image: asshoc300Img,
  },
  {
    name: "Samuel John",
    post: "Assistant HOC for 200L",
    level: "200 Level",
    description: "Supports class coordination and member welfare for the 200 level students.",
    image: asshoc200Img,
  },
  {
    name: "Olatunji Oyindamola Barakat",
    post: "Assistant HOC 100lvl",
    level: "100 Level",
    description: "Assists the 100L HOC in welcoming and organizing the newest members of the chapter.",
    image: asshoc100Img,
  },
];

/**
 * 2026/2027 Class Representatives:
 * Previous 300L -> 400L, 200L -> 300L, 100L -> 200L, and 100L is currently vacant.
 */
export const current2026_2027Hocs: Executive[] = [
  {
    name: "Adegoke Muhammed",
    post: "HOC for 400 level",
    level: "400 Level",
    description: "Leads the graduating 400 level class and serves as the primary bridge to the executive council.",
    image: hoc300Img,
  },
  {
    name: "Osho Aishat",
    post: "HOC for 300 level",
    level: "300 Level",
    description: "Serves as the primary link between the 300 level students and the executive council, managing class-specific affairs.",
    image: hoc200Img,
  },
  {
    name: "Ayara Michael",
    post: "HOC for 200 level",
    level: "200 Level",
    description: "Coordinates academic and social activities for the 200 level class, ensuring their voices are heard in the chapter.",
    image: hoc100Img,
  },
  {
    name: "Position Vacant",
    post: "HOC for 100 level",
    level: "100 Level",
    description: "Awaiting appointment of the 100 level Head of Class for the 2026/2027 academic session.",
    image: "",
    vacant: true,
  },
];

export const current2026_2027AsstHocs: Executive[] = [
  {
    name: "Matti Jadesola",
    post: "Assistant HOC for 400L",
    level: "400 Level",
    description: "Assists the 400L HOC in class management and leadership duties for the graduating class.",
    image: asshoc300Img,
  },
  {
    name: "Samuel John",
    post: "Assistant HOC for 300L",
    level: "300 Level",
    description: "Provides administrative support to the 300L HOC and class activities.",
    image: asshoc200Img,
  },
  {
    name: "Olatunji Oyindamola Barakat",
    post: "Assistant HOC for 200L",
    level: "200 Level",
    description: "Supports class coordination and member welfare for the 200 level students.",
    image: asshoc100Img,
  },
  {
    name: "Position Vacant",
    post: "Assistant HOC for 100L",
    level: "100 Level",
    description: "Awaiting appointment of the 100 level Assistant Head of Class for the 2026/2027 academic session.",
    image: "",
    vacant: true,
  },
];

export const executiveSessions: ExecutiveSessionData[] = [
  {
    session: "2026/2027",
    label: "2026/2027 Session",
    isCurrent: true,
    topLeaders: [],
    coreExecutives: [],
    hocs: current2026_2027Hocs,
    asstHocs: current2026_2027AsstHocs,
  },
  {
    session: "2025/2026",
    label: "2025/2026 Session",
    isCurrent: false,
    topLeaders: executives2025_2026.slice(0, 3),
    coreExecutives: executives2025_2026.slice(3, 12),
    hocs: executives2025_2026.slice(12, 16),
    asstHocs: executives2025_2026.slice(16),
  },
];

/**
 * Executives Hall of Fame grouped by position.
 * Includes all past Executive Council posts plus the graduated 400L HOC and Assistant HOC.
 * Active 300L/200L/100L HOCs & Assistant HOCs remain in the current council and are not listed here.
 */
const hallOfFameSource2025_2026 = [
  ...executives2025_2026.slice(0, 12),
  executives2025_2026[12], // 400L HOC (Olagunju Basheer Olaniyi)
  executives2025_2026[16], // 400L Assistant HOC (Adebisi Emmanuel Oluwatobi)
];

const slugifyPost = (post: string) =>
  post
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const hallOfFameByPosition: HallOfFamePositionGroup[] = hallOfFameSource2025_2026.map(
  (exec) => ({
    id: slugifyPost(exec.post),
    position: exec.post,
    holders: [
      {
        id: `hof-2025-2026-${slugifyPost(exec.post)}`,
        name: exec.name,
        session: "2025/2026",
        post: exec.post,
        image: exec.image,
        objectPosition: exec.objectPosition,
        note: exec.description,
      },
    ],
  }),
);

// Preserved export for backward compatibility with existing imports
export const executives: Executive[] = executives2025_2026;
