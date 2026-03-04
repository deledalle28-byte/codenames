import type { MissionDefinition, MissionState, MissionTrigger } from "./types";

export const DEFAULT_MISSIONS: MissionDefinition[] = [
  {
    id: "clues_3",
    kind: "PROGRESSIVE",
    title: "Donner 3 indices valides.",
    targetCount: 3,
    trigger: "GIVE_CLUE",
  },
  {
    id: "stop_1",
    kind: "PROGRESSIVE",
    title: "Appuyer sur Stop au moins 1 fois.",
    targetCount: 1,
    trigger: "STOP_GUESSING",
  },
  {
    id: "own_agents_5",
    kind: "PROGRESSIVE",
    title: "Révéler 5 de vos agents.",
    targetCount: 5,
    trigger: "REVEAL_OWN_AGENT",
  },
  {
    id: "clue_once",
    kind: "BOOLEAN",
    title: "Donner au moins un indice.",
    trigger: "GIVE_CLUE",
  },
  {
    id: "triple_decouverte",
    kind: "BOOLEAN",
    title: "Révéler 3 agents en un seul tour.",
    trigger: "TURN_3_OWN_AGENTS",
  },
  {
    id: "prudence",
    kind: "BOOLEAN",
    title: "Terminer un tour sans erreur.",
    trigger: "TURN_NO_ERROR",
  },
  {
    id: "neutre_controle",
    kind: "PROGRESSIVE",
    title: "Révéler 2 cartes neutres durant la manche.",
    targetCount: 2,
    trigger: "REVEAL_NEUTRAL",
  },
  {
    id: "guess_bonus",
    kind: "BOOLEAN",
    title: "Révéler un agent avec le guess bonus (+1).",
    trigger: "BONUS_GUESS_REVEAL",
  },
  {
    id: "risque_calcule",
    kind: "BOOLEAN",
    title: "Révéler 1 agent ennemi.",
    trigger: "REVEAL_ENEMY_AGENT",
  },
];

export function createMissionState(def: MissionDefinition): MissionState {
  return {
    definitionId: def.id,
    title: def.title,
    kind: def.kind,
    trigger: def.trigger,
    targetCount: def.kind === "PROGRESSIVE" ? def.targetCount : null,
    progressCount: 0,
    completed: false,
  };
}

export function applyMissionTrigger(
  mission: MissionState | null,
  trigger: MissionTrigger,
): MissionState | null {
  if (!mission || mission.completed) return mission;
  if (mission.trigger !== trigger) return mission;

  // We only need to know trigger type; id-based filtering is handled at assignment time by choosing defs.
  // Therefore, we store completion via progress count and expect the reducer to call this only for the matching trigger.
  if (mission.kind === "BOOLEAN") {
    return { ...mission, completed: true };
  }

  const nextProgress = mission.progressCount + 1;
  const target = mission.targetCount ?? 0;
  return {
    ...mission,
    progressCount: nextProgress,
    completed: target > 0 ? nextProgress >= target : false,
  };
}

