// Recommendations shown in the home page "Shoutouts" carousel

export type Testimonial = {
  headline?: string;
  quote: string;
  name: string;
  title: string;
  avatar: string;
  link?: string;
};

export const testimonials: Testimonial[] = [
  {
    headline: "Onur is one of the most product-minded designers I’ve worked with.",
    quote:
      "As our lead product designer, he moves fast without sacrificing clarity or strategy. We collaborated on a decentralized platform offering, and I was impressed by how quickly he translated complex infrastructure into a clean, intuitive product experience.\n\nHe thinks beyond UI into systems, growth, and execution.\n\nI’d work with him again anytime.",
    name: "Lukas Mattecka",
    title: "Lead Business Dev at InFlux Technologies",
    avatar: "/assets/headshots/lukas-mattecka.jpeg",
    link: "https://linkedin.com/in/lukas-mattecka",
  },
  {
    headline: "Quick, Intuitive, & Great to Work With",
    quote:
      "Onur was the lead designer for a new service/product that we developed and launched at Automattic, and from the very beginning, he was an incredibly helpful, thoughtful, and creative colleague.\n\nHe suffered the challenges of getting so much feedback, sometimes conflicting, sometimes off the mark, sometimes probably completely unhelpful, but in the end he absorbed all of that mess and turned it into a clean, striking, and very much on-brand flow that exists on the platform today.\n\nHe's quick and intuitive with his design ideas, welcoming to all, and just fun to work with. I hope to have the chance to work with him again someday.",
    name: "Marjorie R. Asturias",
    title: "Head of Operations — WordPress.com",
    link: "https://www.linkedin.com/in/marjorieasturias",
    avatar: "/assets/headshots/marjorie.jpeg",
  },
  {
    headline: "He Founded Design @Udemy",
    quote:
      "During his time at Udemy, Onur Oztaskiran served as the design lead, taking on projects that required both a high level of creativity and strong technical skills, often under very tight deadlines.\n\nHe is proficient in all relevant design and has consistently shown initiative in executing new skills, expanding his abilities beyond traditional design. He took Udemy from 2012 to where it is today.",
    name: "Goksel Eryigit",
    title: "Senior Software Engineer at Udemy",
    avatar: "/assets/headshots/geryit.png",
    link: "https://www.linkedin.com/in/geryit/",
  },
  {
    headline: "A Designer Who Leads, Not Follows",
    quote:
      "With so many self-claimed designers these days, it's hard to find true creatives. Onur certainly understands the importance of attention to detail and is definitely one that leads, rather than follows.\n\nI'd recommend Onur to those seeking stunning, crisp and innovative designs. Having worked with and recommended Onur on several projects, both personal and client work, I can say that I have enjoyed the experience.",
    name: "David Knight",
    title: "CTO, Buildstack",
    avatar: "/assets/headshots/david-knight.png",
  },
];
