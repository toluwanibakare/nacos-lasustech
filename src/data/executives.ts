import exec1 from "@/assets/exec-1.jpg";
import exec2 from "@/assets/exec-2.jpg";
import exec3 from "@/assets/exec-3.jpg";
import exec4 from "@/assets/exec-4.jpg";
import vpImg from "@/assets/vice_president.jpg";
import ladyViceImg from "@/assets/lady_vice.jpeg";
import treasurerImg from "@/assets/Treasurer.jpeg";
import sportsDirectorImg from "@/assets/sports.jpg";
import socialDirectorImg from "@/assets/social_director.png";
import welfareImg from "@/assets/welfare.jpeg";
import hoc400Img from "@/assets/hoc_400.jpg";
import asshoc300Img from "@/assets/asshoc_300.jpeg";
import hoc100Img from "@/assets/hoc_100.jpeg";
import asshoc100Img from "@/assets/asshoc_100.jpeg";

export interface Executive {
  name: string;
  post: string;
  level: string;
  description: string;
  image: string;
}

export const executives: Executive[] = [
  {
    name: "Shofunde Jubril Ajibola",
    post: "President",
    level: "400 Level",
    description: "Serves as the primary leader and official representative of the NACOS LASUSTECH Chapter, overseeing all activities and strategic growth.",
    image: exec1,
  },
  {
    name: "Bakare Toluwani Moses",
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
    image: exec4,
  },
  {
    name: "Emmanuel Ariyo Ogunfunwa",
    post: "Assistant General Secretary",
    level: "200 Level",
    description: "Supports the General Secretary in administrative duties and ensures continuous documentation of chapter affairs.",
    image: exec1,
  },
  {
    name: "Onaade Abdulmuqtadir Ayomide",
    post: "Financial Secretary",
    level: "300 Level",
    description: "Maintains accurate financial records, manages budget allocations, and ensures financial transparency across all chapter projects.",
    image: exec2,
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
    image: exec4,
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
    name: "Oluwatobi Oluwaseyi Isaac",
    post: "Welfare Director",
    level: "400 Level",
    description: "Monitors and ensures the general well-being and support of all computing students within the chapter.",
    image: welfareImg,
  },
  // HOCs Descending (400 - 100)
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
    image: exec2,
  },
  {
    name: "Osho Aishat",
    post: "HOC for 200 level",
    level: "200 Level",
    description: "Coordinates academic and social activities for the 200 level class, ensuring their voices are heard in the chapter.",
    image: exec1,
  },
  {
    name: "Ayara Michael",
    post: "HOC for 100 level",
    level: "100 Level",
    description: "Guides and represents the path of year-one students, helping them integrate into the NACOS community.",
    image: hoc100Img,
  },
  // Asst HOCs Descending (400 - 100)
  {
    name: "Adebisit Emmanuel Oluwatobi",
    post: "Assistant HOC for 400L",
    level: "400 Level",
    description: "Assists the 400L HOC in class management and leadership duties for the graduating class.",
    image: exec2,
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
    image: exec4,
  },
  {
    name: "Olatunji Oyindamola Barakat",
    post: "Assistant HOC 100lvl",
    level: "100 Level",
    description: "Assists the 100L HOC in welcoming and organizing the newest members of the chapter.",
    image: asshoc100Img,
  },
];
