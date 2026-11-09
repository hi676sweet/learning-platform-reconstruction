import type { LearningClass } from "./types.ts";

export const learningClasses: LearningClass[] = [
  {
    id: "class-writing", slug: "clear-writing", title: "Write so people listen",
    subtitle: "Make your next message the one that makes sense.",
    description: "Great writing makes room for understanding. Learn a practical way to turn a busy first draft into a message that feels clear, useful and human. Bring an idea; leave with a better way to share it.",
    category: "Communication", level: "All levels", duration: 90, instructor: "Maya Park", instructorRole: "Product writer & facilitator",
    instructorBio: "Maya is a fictional instructor created for this demo. Her session explores practical communication with a hands-on writing exercise.", accent: "peach", art: "writing",
    outcomes: ["Find the one idea your reader needs", "Give your message a clear structure", "Edit a paragraph with a useful checklist"],
    agenda: [{ title: "Find your point", detail: "A simple exercise to separate the message from the noise." }, { title: "Build a better draft", detail: "Work through a before-and-after example together." }, { title: "Make it yours", detail: "Apply the checklist to your own fictional brief and reflect." }]
  },
  {
    id: "class-data", slug: "data-stories", title: "Make data tell a story",
    subtitle: "Turn a spreadsheet into a conversation worth having.",
    description: "Start with the question, choose the right visual and make a clear recommendation. This practical workshop uses a small fictional dataset to make data communication less intimidating.",
    category: "Data", level: "Beginner", duration: 75, instructor: "Alex Rivera", instructorRole: "Analytics educator",
    instructorBio: "Alex is a fictional educator whose demo workshop focuses on clear questions, simple charts and useful explanations.", accent: "lavender", art: "data",
    outcomes: ["Ask a better question of your dataset", "Choose a chart that supports the story", "Explain an insight without the jargon"],
    agenda: [{ title: "Begin with a question", detail: "Frame the decision before opening the dataset." }, { title: "Choose your visual", detail: "Compare three ways to show the same result." }, { title: "Tell the story", detail: "Build a short narrative with a clear next step." }]
  },
  {
    id: "class-product", slug: "product-roadmaps", title: "From ideas to a useful roadmap",
    subtitle: "Create a little more focus for your next big thing.",
    description: "A roadmap is a conversation about priorities. Practice turning a collection of ideas into outcomes, trade-offs and a simple plan your team can discuss.",
    category: "Product", level: "Intermediate", duration: 90, instructor: "Jordan Lee", instructorRole: "Product coach",
    instructorBio: "Jordan is a fictional product coach. The session uses an imaginary neighborhood service as its product case study.", accent: "mint", art: "roadmap",
    outcomes: ["Connect features to a meaningful outcome", "Compare effort, uncertainty and value", "Draft a clear now-next-later roadmap"],
    agenda: [{ title: "Pick an outcome", detail: "Decide what progress should look like." }, { title: "Make the trade-off", detail: "Practice prioritizing with incomplete information." }, { title: "Share the plan", detail: "Create and critique a simple roadmap." }]
  },
  {
    id: "class-speaking", slug: "quiet-confidence", title: "Present with quiet confidence",
    subtitle: "You don't need to be the loudest voice in the room.",
    description: "Build a short presentation that is easy to follow and comfortable to deliver. Try small, repeatable techniques for opening, pacing and finishing with purpose.",
    category: "Communication", level: "Beginner", duration: 60, instructor: "Riley Chen", instructorRole: "Communication facilitator",
    instructorBio: "Riley is a fictional facilitator. This practical demo class is about communication practice, not professional or clinical advice.", accent: "yellow", art: "speaking",
    outcomes: ["Open with a clear promise", "Use pauses to create space", "Finish with one memorable next step"],
    agenda: [{ title: "Make a simple promise", detail: "Give the audience a reason to listen." }, { title: "Practice a small part", detail: "Use a short exercise to find your rhythm." }, { title: "Close the loop", detail: "Return to the point and invite a response." }]
  },
  {
    id: "class-design", slug: "portfolio-stories", title: "A portfolio with a point of view",
    subtitle: "Show the thinking behind the work.",
    description: "Move beyond a collection of deliverables. Shape an original case study that explains the problem, your choices and what you learned, using an honest fictional practice project.",
    category: "Design", level: "All levels", duration: 75, instructor: "Sam Morgan", instructorRole: "Design educator",
    instructorBio: "Sam is a fictional design educator created for Skillroom. No external professional credentials or endorsements are claimed.", accent: "blue", art: "portfolio",
    outcomes: ["Give a case study a clear narrative", "Explain decisions with useful evidence", "Describe your contribution accurately"],
    agenda: [{ title: "Start with the problem", detail: "Find the reason your case study matters." }, { title: "Show the decision", detail: "Choose artifacts that explain your thinking." }, { title: "Write the reflection", detail: "Make your learning concrete and specific." }]
  },
  {
    id: "class-career", slug: "career-conversations", title: "Make your next career conversation count",
    subtitle: "Better questions. More useful conversations.",
    description: "Prepare for a development conversation with a clear picture of your goals and useful questions. Practice a simple structure using fictional situations and leave with a practical worksheet.",
    category: "Career", level: "All levels", duration: 60, instructor: "Casey Taylor", instructorRole: "Learning facilitator",
    instructorBio: "Casey is a fictional learning facilitator. All examples are invented and do not promise employment outcomes.", accent: "pink", art: "career",
    outcomes: ["Describe the work you want to grow into", "Ask specific, answerable questions", "Leave with a practical next action"],
    agenda: [{ title: "Prepare your starting point", detail: "Put your goals and recent learning into words." }, { title: "Ask a useful question", detail: "Practice turning broad hopes into a clear discussion." }, { title: "Agree on the next step", detail: "Document an action you can revisit later." }]
  }
];

export function seedSessions(now: Date) {
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const plan = [
    ["session-writing-1", "class-writing", 2, 9, 2], ["session-writing-2", "class-writing", 9, 9, 8],
    ["session-data-1", "class-data", 3, 11, 8], ["session-product-1", "class-product", 4, 8, 12],
    ["session-speaking-1", "class-speaking", 5, 9, 6], ["session-design-1", "class-design", 7, 10, 10],
    ["session-career-1", "class-career", 10, 8, 10]
  ] as const;
  return plan.map(([id, classId, days, hour, capacity]) => {
    const startsAt = new Date(midnight.getTime() + days * 86400000 + hour * 3600000);
    const duration = learningClasses.find(item => item.id === classId)!.duration;
    return { id, classId, startsAt: startsAt.toISOString(), endsAt: new Date(startsAt.getTime() + duration * 60000).toISOString(), capacity };
  });
}
