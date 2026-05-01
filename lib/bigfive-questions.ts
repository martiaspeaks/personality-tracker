import { TraitKey } from "./types";

export interface Question {
  id: number;
  text: string;
  trait: TraitKey;
  keyed: "plus" | "minus"; // minus = reverse-scored
}

// IPIP-50: 10 questions per trait, validated public domain
export const QUESTIONS: Question[] = [
  // Extraversion (E)
  { id: 1,  text: "I am the life of the party.",           trait: "E", keyed: "plus" },
  { id: 2,  text: "I don't talk a lot.",                   trait: "E", keyed: "minus" },
  { id: 3,  text: "I feel comfortable around people.",     trait: "E", keyed: "plus" },
  { id: 4,  text: "I keep in the background.",             trait: "E", keyed: "minus" },
  { id: 5,  text: "I start conversations.",                trait: "E", keyed: "plus" },
  { id: 6,  text: "I have little to say.",                 trait: "E", keyed: "minus" },
  { id: 7,  text: "I talk to a lot of different people at parties.", trait: "E", keyed: "plus" },
  { id: 8,  text: "I don't like to draw attention to myself.", trait: "E", keyed: "minus" },
  { id: 9,  text: "I don't mind being the center of attention.", trait: "E", keyed: "plus" },
  { id: 10, text: "I am quiet around strangers.",          trait: "E", keyed: "minus" },

  // Agreeableness (A)
  { id: 11, text: "I feel little concern for others.",     trait: "A", keyed: "minus" },
  { id: 12, text: "I am interested in people.",            trait: "A", keyed: "plus" },
  { id: 13, text: "I insult people.",                      trait: "A", keyed: "minus" },
  { id: 14, text: "I sympathize with others' feelings.",   trait: "A", keyed: "plus" },
  { id: 15, text: "I am not interested in other people's problems.", trait: "A", keyed: "minus" },
  { id: 16, text: "I have a soft heart.",                  trait: "A", keyed: "plus" },
  { id: 17, text: "I am not really interested in others.", trait: "A", keyed: "minus" },
  { id: 18, text: "I take time out for others.",           trait: "A", keyed: "plus" },
  { id: 19, text: "I feel others' emotions.",              trait: "A", keyed: "plus" },
  { id: 20, text: "I make people feel at ease.",           trait: "A", keyed: "plus" },

  // Conscientiousness (C)
  { id: 21, text: "I am always prepared.",                 trait: "C", keyed: "plus" },
  { id: 22, text: "I leave my belongings around.",         trait: "C", keyed: "minus" },
  { id: 23, text: "I pay attention to details.",           trait: "C", keyed: "plus" },
  { id: 24, text: "I make a mess of things.",              trait: "C", keyed: "minus" },
  { id: 25, text: "I get chores done right away.",         trait: "C", keyed: "plus" },
  { id: 26, text: "I often forget to put things back in their proper place.", trait: "C", keyed: "minus" },
  { id: 27, text: "I like order.",                         trait: "C", keyed: "plus" },
  { id: 28, text: "I shirk my duties.",                    trait: "C", keyed: "minus" },
  { id: 29, text: "I follow a schedule.",                  trait: "C", keyed: "plus" },
  { id: 30, text: "I am exacting in my work.",             trait: "C", keyed: "plus" },

  // Neuroticism (N)
  { id: 31, text: "I get stressed out easily.",            trait: "N", keyed: "plus" },
  { id: 32, text: "I am relaxed most of the time.",        trait: "N", keyed: "minus" },
  { id: 33, text: "I worry about things.",                 trait: "N", keyed: "plus" },
  { id: 34, text: "I seldom feel blue.",                   trait: "N", keyed: "minus" },
  { id: 35, text: "I am easily disturbed.",                trait: "N", keyed: "plus" },
  { id: 36, text: "I get upset easily.",                   trait: "N", keyed: "plus" },
  { id: 37, text: "I change my mood a lot.",               trait: "N", keyed: "plus" },
  { id: 38, text: "I have frequent mood swings.",          trait: "N", keyed: "plus" },
  { id: 39, text: "I get irritated easily.",               trait: "N", keyed: "plus" },
  { id: 40, text: "I often feel blue.",                    trait: "N", keyed: "plus" },

  // Openness (O)
  { id: 41, text: "I have a rich vocabulary.",             trait: "O", keyed: "plus" },
  { id: 42, text: "I have difficulty understanding abstract ideas.", trait: "O", keyed: "minus" },
  { id: 43, text: "I have a vivid imagination.",           trait: "O", keyed: "plus" },
  { id: 44, text: "I am not interested in abstract ideas.", trait: "O", keyed: "minus" },
  { id: 45, text: "I have excellent ideas.",               trait: "O", keyed: "plus" },
  { id: 46, text: "I do not have a good imagination.",     trait: "O", keyed: "minus" },
  { id: 47, text: "I am quick to understand things.",      trait: "O", keyed: "plus" },
  { id: 48, text: "I use difficult words.",                trait: "O", keyed: "plus" },
  { id: 49, text: "I spend time reflecting on things.",    trait: "O", keyed: "plus" },
  { id: 50, text: "I am full of ideas.",                   trait: "O", keyed: "plus" },
];

export const CHOICES = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];
