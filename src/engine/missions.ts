import type { MissionDefinition, MissionState, MissionTrigger } from "./types";

export const DEFAULT_MISSIONS: MissionDefinition[] = [
  {
    id: "streak_3_tours",
    kind: "PROGRESSIVE",
    title: "Trouver au moins 1 agent allié pendant 3 tours.",
    targetCount: 3,
    trigger: "TURN_WITH_OWN_AGENT",
  },
  {
    id: "triple_decouverte",
    kind: "BOOLEAN",
    title: "Trouver 3 agents en un seul tour.",
    trigger: "TURN_3_OWN_AGENTS",
  },
  {
    id: "quadruple_decouverte",
    kind: "BOOLEAN",
    title: "Trouver 4 agents en un seul tour.",
    trigger: "TURN_4_OWN_AGENTS",
  },
  {
    id: "indice_ambitieux",
    kind: "BOOLEAN",
    title: "Donner un indice de 3 ou plus.",
    trigger: "CLUE_COUNT_3_PLUS",
  },
  {
    id: "sniper",
    kind: "BOOLEAN",
    title: "Donner un indice de 1 et trouver l'agent.",
    trigger: "CLUE_1_SUCCESS",
  },
  {
    id: "double_x2",
    kind: "PROGRESSIVE",
    title: "Trouver 2+ agents en un tour, 2 fois.",
    targetCount: 2,
    trigger: "TURN_2_OWN_AGENTS",
  },
  {
    id: "prudence_x2",
    kind: "PROGRESSIVE",
    title: "Terminer 2 tours sans aucune erreur.",
    targetCount: 2,
    trigger: "TURN_NO_ERROR",
  },
  {
    id: "chasseur",
    kind: "PROGRESSIVE",
    title: "Trouver 5 agents alliés dans la manche.",
    targetCount: 5,
    trigger: "REVEAL_OWN_AGENT",
  },
  {
    id: "bonus_x2",
    kind: "PROGRESSIVE",
    title: "Utiliser le guess bonus (+1) avec succès 2 fois.",
    targetCount: 2,
    trigger: "BONUS_GUESS_REVEAL",
  },
  {
    id: "stop_propre",
    kind: "PROGRESSIVE",
    title: "Passer son tour (stop) sans erreur 2 fois.",
    targetCount: 2,
    trigger: "STOP_NO_ERROR",
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

