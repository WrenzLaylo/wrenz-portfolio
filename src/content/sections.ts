export const sections = {
  work: { id: "work", heading: "Built around actual operations." },
  moreWork: { id: "more-work", heading: "Smaller builds, same habits." },
  capabilities: { id: "capabilities", heading: "One developer, four useful angles." },
  experience: { id: "experience", heading: "Production work, not coursework dressed up." },
  about: {
    id: "about",
    heading: "I care about the handoff between “it runs” and “it’s reliable.”",
    paragraphs: [
      "I’m a Computer Science graduate of Angeles University Foundation, majoring in Data Science, and I graduated Cum Laude. I’m based in Bataan, Philippines, and I work across software development, automation, WordPress and applied AI.",
      "My strongest work usually starts where the requirements get messy: old spreadsheets, inconsistent user input, account migrations, production content, or an AI output that still needs safety and review.",
    ],
  },
  contact: {
    id: "contact",
    heading: "Have a workflow that has outgrown its spreadsheet?",
    line: "I’m open to full-time roles and freelance projects in business systems, automation, WordPress and applied AI.",
  },
} as const;
