export interface Nominee {
  id: string;
  name: string;
  category: string;
  department: string;
  level: string;
  bio: string;
  photo: string;
  categoryBanner: string;
  score: number;
  rank?: number;
}

export const nominees: Nominee[] = [
  { id: "prog-1", name: "Chidi Okonkwo", category: "Best Programmer of the Year", department: "Computer Science", level: "400 Level", bio: "A gifted systems engineer who has shipped three open-source tools used by students across campus.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 950 },
  { id: "prog-2", name: "Fatima Hassan", category: "Best Programmer of the Year", department: "Computer Science", level: "300 Level", bio: "Full-stack wizard with a knack for elegant architecture and lightning-fast delivery.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 780 },
  { id: "prog-3", name: "Emeka Adeleke", category: "Best Programmer of the Year", department: "Computer Science", level: "400 Level", bio: "Competitive programmer who has represented LASUSTECH in three national hackathons.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 640 },
  { id: "prog-4", name: "Sola Okafor", category: "Best Programmer of the Year", department: "Computer Science", level: "200 Level", bio: "The freshman who everyone already knows - solving problems seniors struggle with.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 480 },
  { id: "innov-1", name: "Kemi Adeyemi", category: "Most Innovative Student", department: "Computer Science", level: "300 Level", bio: "Built an AI crop-disease detector that won a national student innovation award.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 880 },
  { id: "innov-2", name: "David Nwachukwu", category: "Most Innovative Student", department: "Computer Science", level: "400 Level", bio: "Created a peer-to-peer tutor matching platform adopted by 200+ students.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 720 },
  { id: "innov-3", name: "Amaka Eze", category: "Most Innovative Student", department: "Computer Science", level: "300 Level", bio: "Pioneered a voice-assistant for visually-impaired students within the faculty.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 550 },
  { id: "tinfl-1", name: "Tobi Martins", category: "Tech Influencer of the Year", department: "Computer Science", level: "300 Level", bio: "50K YouTube subscribers and counting - making tech accessible for every Nigerian student.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 910 },
  { id: "tinfl-2", name: "Grace Osei", category: "Tech Influencer of the Year", department: "Computer Science", level: "400 Level", bio: "LinkedIn creator whose weekly threads on software engineering consistently go viral.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 740 },
  { id: "tinfl-3", name: "Lanre Badmus", category: "Tech Influencer of the Year", department: "Computer Science", level: "200 Level", bio: "Twitter/X account on Nigerian tech that amassed 20K followers in under a year.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 560 },
  { id: "design-1", name: "Tolu Fashola", category: "Best Creative Designer", department: "Computer Science", level: "300 Level", bio: "UI/UX portfolio that has landed two freelance contracts with Lagos startups.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 830 },
  { id: "design-2", name: "Ngozi Ekwueme", category: "Best Creative Designer", department: "Computer Science", level: "400 Level", bio: "Motion designer whose NACOS event graphics set the bar every semester.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 700 },
  { id: "design-3", name: "Samuel Ojo", category: "Best Creative Designer", department: "Computer Science", level: "300 Level", bio: "Brand identity specialist who redesigned three student organisations' visual identities.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 590 },
  { id: "hoc-1", name: "Ibrahim Musa", category: "HOC of the Year", department: "Computer Science", level: "500 Level", bio: "Transformed class communication and welfare systems, raising attendance by 30%.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 870 },
  { id: "hoc-2", name: "Chioma Obi", category: "HOC of the Year", department: "Computer Science", level: "400 Level", bio: "An HOC who bridged the gap between students and faculty like no one before.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 730 },
  { id: "hoc-3", name: "Peter Abiodun", category: "HOC of the Year", department: "Computer Science", level: "300 Level", bio: "Young leader whose class coordination skills rival those of students twice his age.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 560 },
  { id: "team-1", name: "Bunmi Adewale", category: "Best Team Player", department: "Computer Science", level: "400 Level", bio: "First to help and last to leave - the glue of every group project and team effort.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 840 },
  { id: "team-2", name: "Kayode Peters", category: "Best Team Player", department: "Computer Science", level: "300 Level", bio: "Cross-functional collaborator who lifts every team he joins to a higher level.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 680 },
  { id: "team-3", name: "Nneka Oguike", category: "Best Team Player", department: "Computer Science", level: "200 Level", bio: "Empathetic mediator and planner whose presence makes every project run smoothly.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 510 },
  { id: "sinfl-1", name: "Yemi Balogun", category: "Social Influencer of the Year", department: "Computer Science", level: "400 Level", bio: "Instagram creator who documents campus life with 35K followers and growing.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 920 },
  { id: "sinfl-2", name: "Blessing Osei", category: "Social Influencer of the Year", department: "Computer Science", level: "300 Level", bio: "TikTok comedian turned awareness campaigner - 22K followers and deeply relatable content.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 810 },
  { id: "sinfl-3", name: "Feyi Adeyinka", category: "Social Influencer of the Year", department: "Computer Science", level: "200 Level", bio: "Youngest student influencer on campus whose authenticity resonates with thousands.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 640 },
  { id: "spers-1", name: "Tunde Fashola", category: "Social Personality of the Year", department: "Computer Science", level: "300 Level", bio: "The life of every gathering - witty, warm, and genuinely cares for fellow students.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 890 },
  { id: "spers-2", name: "Adaeze Ike", category: "Social Personality of the Year", department: "Computer Science", level: "400 Level", bio: "Can make any room comfortable in 60 seconds - a natural connector of people.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 740 },
  { id: "spers-3", name: "Kunle Abiola", category: "Social Personality of the Year", department: "Computer Science", level: "300 Level", bio: "Known for making everyone feel included, seen, and celebrated.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 580 },
  { id: "fashion-1", name: "Precious Okwu", category: "Fashion Icon of the Department", department: "Computer Science", level: "300 Level", bio: "Sets trends before they reach the mainstream - a walking mood board.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 910 },
  { id: "fashion-2", name: "Chiamaka Eze", category: "Fashion Icon of the Department", department: "Computer Science", level: "400 Level", bio: "Effortlessly elegant every day - her style has influenced campus fashion culture.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 760 },
  { id: "fashion-3", name: "Ola Bankole", category: "Fashion Icon of the Department", department: "Computer Science", level: "200 Level", bio: "Streetwear visionary who makes thrifted fits look like runway ready looks.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 600 },
  { id: "art-1", name: "Chibike Nwosu", category: "Artist of the Year", department: "Computer Science", level: "200 Level", bio: "Multi-genre musician whose EP dropped this semester and trended on campus Spotify.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 860 },
  { id: "art-2", name: "Adaeze Okonkwo", category: "Artist of the Year", department: "Computer Science", level: "300 Level", bio: "Visual artist whose paintings have been featured in two gallery exhibitions.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 690 },
  { id: "art-3", name: "Musa Ibrahim", category: "Artist of the Year", department: "Computer Science", level: "400 Level", bio: "Spoken word poet and performer who brings the house down every NACOS event.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 520 },
  { id: "ceo-1", name: "Funmi Adekunle", category: "CEO of the Year", department: "Computer Science", level: "400 Level", bio: "Founded a student-run tech startup now serving 500+ users across campus.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 900 },
  { id: "ceo-2", name: "Damilola Oluwole", category: "CEO of the Year", department: "Computer Science", level: "300 Level", bio: "Runs a profitable digital marketing agency while maintaining a first-class GPA.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 750 },
  { id: "ceo-3", name: "Victor Essien", category: "CEO of the Year", department: "Computer Science", level: "400 Level", bio: "E-commerce founder whose Shopify store generates six-figure monthly revenue.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 580 },
  { id: "mfb-1", name: "Uche Obi", category: "Best Male Footballer", department: "Computer Science", level: "300 Level", bio: "Top scorer in the faculty football league for two consecutive semesters.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 870 },
  { id: "mfb-2", name: "Seun Afolabi", category: "Best Male Footballer", department: "Computer Science", level: "400 Level", bio: "Playmaker whose vision and passing unlock defenses at will.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 720 },
  { id: "mfb-3", name: "Dayo Oladele", category: "Best Male Footballer", department: "Computer Science", level: "200 Level", bio: "Powerful winger who joined the faculty team in 100 level and never looked back.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 560 },
  { id: "ffb-1", name: "Ngozi Eze", category: "Best Female Footballer", department: "Computer Science", level: "300 Level", bio: "Captain and inspiration - led the faculty women's team to their first-ever finals.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 880 },
  { id: "ffb-2", name: "Halima Yusuf", category: "Best Female Footballer", department: "Computer Science", level: "400 Level", bio: "Dominant centre-back who also contributes critical goals from set pieces.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 710 },
  { id: "ffb-3", name: "Joy Okonkwo", category: "Best Female Footballer", department: "Computer Science", level: "200 Level", bio: "Fastest player in the women's division - a joy to watch on any pitch.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 540 },
  { id: "fx-1", name: "Rotimi Ade", category: "FX Trader of the Year", department: "Computer Science", level: "400 Level", bio: "Consistent profitability and mentors 30+ students in forex trading strategies.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 850 },
  { id: "fx-2", name: "Patience Ogu", category: "FX Trader of the Year", department: "Computer Science", level: "300 Level", bio: "Self-taught trader who turned a small capital into meaningful returns over 12 months.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 690 },
  { id: "fx-3", name: "Bola Adeniyi", category: "FX Trader of the Year", department: "Computer Science", level: "200 Level", bio: "Youngest active trader in the department with a remarkably disciplined approach.", photo: "/placeholder.svg", categoryBanner: "/awards_gala_night_bg_1778965666277.png", score: 530 },
];

export function getNomineesByCategory(category: string): Nominee[] {
  return nominees.filter((n) => n.category === category);
}

export function getNomineeById(id: string): (Nominee & { rank: number }) | undefined {
  const nominee = nominees.find((n) => n.id === id);
  if (!nominee) return undefined;
  const categoryRanked = nominees
    .filter((n) => n.category === nominee.category)
    .sort((a, b) => b.score - a.score);
  const index = categoryRanked.findIndex((n) => n.id === id);
  return { ...nominee, rank: index + 1 };
}

export function getGlobalRanking(): (Nominee & { rank: number })[] {
  return [...nominees]
    .sort((a, b) => b.score - a.score)
    .map((nominee, index) => ({ ...nominee, rank: index + 1 }));
}
