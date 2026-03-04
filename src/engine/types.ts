export type TeamId = string;
export type PlayerId = string;
export type CardId = string;

export type Phase = "CLUE" | "GUESS" | "ROUND_OVER" | "MATCH_OVER";

export type TeamColor = "red" | "blue" | "green" | "yellow";

export type CardSecret =
  | { kind: "ASSASSIN" }
  | { kind: "NEUTRAL" }
  | { kind: "AGENT"; teamId: TeamId };

export type Card = {
  id: CardId;
  word: string;
  secret: CardSecret;
  revealedByTeamId: TeamId | null;
};

export type MissionTrigger =
  | "GIVE_CLUE"
  | "STOP_GUESSING"
  | "REVEAL_OWN_AGENT"
  | "REVEAL_NEUTRAL"
  | "REVEAL_ENEMY_AGENT"
  | "BONUS_GUESS_REVEAL"
  | "TURN_3_OWN_AGENTS"
  | "TURN_NO_ERROR";

export type MissionDefinition =
  | {
      id: string;
      kind: "PROGRESSIVE";
      title: string;
      targetCount: number;
      trigger: MissionTrigger;
    }
  | {
      id: string;
      kind: "BOOLEAN";
      title: string;
      trigger: MissionTrigger;
    };

export type MissionState = {
  definitionId: string;
  title: string;
  kind: "PROGRESSIVE" | "BOOLEAN";
  trigger: MissionTrigger;
  targetCount: number | null;
  progressCount: number;
  completed: boolean;
};

export type Team = {
  id: TeamId;
  name: string;
  color: TeamColor;
  playerIds: PlayerId[];
  spymasterIndex: number; // round-robin index into playerIds
  roundsWon: number;
  mission: MissionState | null;
};

export type Player = {
  id: PlayerId;
  name: string;
  teamId: TeamId;
};

export type Clue = {
  teamId: TeamId;
  text: string;
  count: number;
  guessesAllowed: number;
  guessesRemaining: number;
  byPlayerId: PlayerId | null;
};

export type Config = {
  teamsCount: number; // 2..4 (extensible)
  playersPerTeam: number;
  roundsToWinMatch: number;
  guessesRule: "COUNT_PLUS_ONE";
  assassinShift: "AFTER_FULL_CYCLE";
  assassinShiftSwapTarget: "UNREVEALED_NEUTRAL_ONLY";
  forbiddenClueMode: "SOFT_SUBSTRING";
  forbiddenClueExtraWords: string[];
  neutralPercentFor3PlusTeams: number; // e.g. 0.35
};

export type Setup = {
  seed: number;
  gridSize: number;
  startingTeamId: TeamId;
  cards: Card[];
  turnOrderTeamIds: TeamId[];
};

export type GameState = {
  config: Config;
  matchId: string;
  seed: number;
  gridSize: number;
  phase: Phase;
  cards: Card[];
  teams: Record<TeamId, Team>;
  players: Record<PlayerId, Player>;
  turnOrderTeamIds: TeamId[];
  activeTeamId: TeamId;
  roundIndex: number;
  turnsInCurrentCycle: number; // increments at END_TURN, resets after assassin shift
  clue: Clue | null;
  roundWinnerTeamId: TeamId | null;
  matchWinnerTeamId: TeamId | null;
  /** Own agents revealed during the current guess phase (resets each turn). */
  ownAgentsRevealedThisTurn: number;
  /** Whether the active team hit a neutral or enemy card this turn. */
  hadErrorThisTurn: boolean;
};

export type CreateMatchPayload = {
  config?: Partial<Config>;
  players: Array<{ name: string; teamId: TeamId }>;
  seed: number;
  teamNames?: Partial<Record<TeamId, string>>;
};

export type Action =
  | { type: "CREATE_MATCH"; payload: CreateMatchPayload }
  | { type: "START_ROUND"; payload: { seed?: number } }
  | {
      type: "GIVE_CLUE";
      payload: { text: string; count: number; byPlayerId?: PlayerId };
    }
  | {
      type: "REVEAL_CARD";
      payload: { cardId: CardId; byPlayerId?: PlayerId };
    }
  | { type: "STOP_GUESSING"; payload: { byPlayerId?: PlayerId } }
  | { type: "END_TURN"; payload: { byPlayerId?: PlayerId } }
  | { type: "END_ROUND"; payload: { winnerTeamId: TeamId } }
  | { type: "NEXT_ROUND" }
  | { type: "RESET_MATCH" };

export type ClueValidationResult =
  | { ok: true }
  | { ok: false; reason: string; matchedWord?: string };

