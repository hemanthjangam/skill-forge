import type { UserSkillLevel } from "../types/skills"

type TutorReplyInput = {
  concept: string
  skillScore?: number
  question: string
}

export function buildConceptLesson(concept: string, score?: number) {
  const confidence = score == null
    ? "This concept is worth revisiting from first principles."
    : score >= 80
      ? "You already have strong signals here, so the session should sharpen edge cases and articulation."
      : score >= 55
        ? "You understand the core idea, but this concept still needs structured repetition and transfer."
        : "You should rebuild this concept from the ground up before attempting harder variations."

  return [
    {
      title: "Mental model",
      body: `${concept} is easier to remember when you treat it as a repeatable engineering decision rather than a textbook label. Start with what problem it solves, what trade-off it introduces, and what bad outcome appears if you ignore it.`,
    },
    {
      title: "How to recognise it in projects",
      body: `In real projects, ${concept} usually appears when teams need to choose structure, control failure, protect correctness, or improve user experience. Look for moments where a team has to justify why a system behaves the way it does.`,
    },
    {
      title: "Practice loop",
      body: `Explain ${concept} in one sentence, then apply it to a module you completed, then compare a good vs bad implementation. That loop is more effective than reading definitions repeatedly.`,
    },
    {
      title: "Tutor feedback",
      body: confidence,
    },
  ]
}

export function buildTutorReply({ concept, skillScore, question }: TutorReplyInput) {
  const normalized = question.toLowerCase()

  if (normalized.includes("why")) {
    return `${concept} matters because it changes outcomes: correctness, maintainability, performance, or learning speed. If you skip it, the system may still work briefly, but it becomes harder to explain, extend, or debug. ${scoreTail(skillScore)}`
  }

  if (normalized.includes("example") || normalized.includes("project")) {
    return `Use ${concept} on a finished course module: describe the module goal, point to the decision that depends on ${concept}, and explain what would break if that decision were reversed. That turns the concept into project language instead of theory. ${scoreTail(skillScore)}`
  }

  if (normalized.includes("difference") || normalized.includes("vs")) {
    return `Separate ${concept} from nearby ideas by comparing intent, not terminology. Ask: what problem is ${concept} solving, when would you choose it, and what signal tells you it is missing? That comparison frame usually resolves confusion faster than memorizing definitions. ${scoreTail(skillScore)}`
  }

  return `For ${concept}, focus on three things: define it in plain language, connect it to one real feature or module, and state the trade-off it introduces. If you can do those three clearly, your understanding is strong enough to answer most doubts. ${scoreTail(skillScore)}`
}

export function buildTutorFeedback(concept: string, reflection: string) {
  const length = reflection.trim().split(/\s+/).filter(Boolean).length
  if (length < 20) {
    return `Your reflection on ${concept} is too short to prove understanding. Rewrite it with: 1) what it solves, 2) one project example, and 3) one mistake to avoid.`
  }
  if (!reflection.toLowerCase().includes("because")) {
    return `You described ${concept}, but the reasoning is still shallow. Add one sentence beginning with "because" to explain the trade-off or causal effect.`
  }
  return `Good progress on ${concept}. Your next step is to make the explanation more concrete by tying it to a specific module, quiz mistake, or implementation choice you have already seen.`
}

export function deriveRecommendedConcept(skills: UserSkillLevel[]) {
  if (skills.length === 0) return "problem decomposition"
  return [...skills].sort((a, b) => a.score - b.score)[0].skill
}

function scoreTail(skillScore?: number) {
  if (skillScore == null) return "Treat this as a targeted revision block."
  if (skillScore >= 80) return "Your score suggests refinement, so push for clearer examples and edge cases."
  if (skillScore >= 55) return "Your score suggests partial mastery, so emphasize repeated examples and articulation."
  return "Your score suggests this should be practiced slowly and repeatedly until the explanation feels natural."
}
