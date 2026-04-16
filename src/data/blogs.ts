export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
}

export const blogs: BlogPost[] = [
  {
    id: "1",
    title: "The Future of Artificial Intelligence in Nigeria",
    excerpt: "Exploring how AI is transforming various sectors in the Nigerian economy and what it means for tech students.",
    content: "Artificial Intelligence is no longer just a buzzword. In Nigeria, we are seeing applications in fintech, agriculture, and healthcare...",
    author: "NACOS Editorial",
    date: "April 10, 2026",
    category: "AI & ML",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Mastering Web Development: A Guide for Beginners",
    excerpt: "Start your journey in web development with these essential tips and resources curated by NACOS LASUSTECH.",
    content: "Web development is a vast field. From HTML/CSS to complex React applications, the journey is exciting...",
    author: "Tech Lead",
    date: "April 5, 2026",
    category: "Development",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Cybersecurity Tips for Nigerian Students",
    excerpt: "Protecting your digital identity and staying safe in an increasingly connected world.",
    content: "With more services going online, cybersecurity has never been more important for students...",
    author: "Security Analyst",
    date: "March 28, 2026",
    category: "Security",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop",
  },
];
