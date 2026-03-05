import { withDefaultConfig } from "./config";
import type { Action, Card, GameState, MissionTrigger, Player, PlayerId, Team, TeamId } from "./types";
import { generateBoard, assignMissionsForRound } from "./setup";
import { validateClue } from "./rules/clueValidator";
import { assassinShift } from "./rules/assassinShift";
import { getRoundWinnerTeamId, getWinnerIfAssassinRevealed } from "./rules/winConditions";
import { applyMissionTrigger } from "./missions";
import { mulberry32, randInt } from "./random";

const DEFAULT_TEAM_ORDER: Array<{ id: TeamId; color: Team["color"]; name: string }> = [
  { id: "red", color: "red", name: "Rouge" },
  { id: "blue", color: "blue", name: "Bleu" },
  { id: "green", color: "green", name: "Vert" },
  { id: "yellow", color: "yellow", name: "Jaune" },
];

function rotate<T>(arr: T[], startIndex: number): T[] {
  const n = arr.length;
  const s = ((startIndex % n) + n) % n;
  return [...arr.slice(s), ...arr.slice(0, s)];
}

function nextTeamId(turnOrderTeamIds: TeamId[], activeTeamId: TeamId): TeamId {
  const idx = turnOrderTeamIds.indexOf(activeTeamId);
  if (idx < 0) return turnOrderTeamIds[0];
  return turnOrderTeamIds[(idx + 1) % turnOrderTeamIds.length];
}

function isActiveTeamSpymaster(state: GameState, byPlayerId?: PlayerId): boolean {
  if (!byPlayerId) return true; // Phase 1: allow UI-gated master view
  const team = state.teams[state.activeTeamId];
  const spymasterId = team.playerIds[team.spymasterIndex] ?? null;
  return spymasterId === byPlayerId;
}

function applyMissionTriggerToTeam(
  teams: Record<TeamId, Team>,
  teamId: TeamId,
  trigger: MissionTrigger,
): Record<TeamId, Team> {
  const team = teams[teamId];
  const mission = applyMissionTrigger(team.mission, trigger);
  if (mission === team.mission) return teams;
  return { ...teams, [teamId]: { ...team, mission } };
}

function finalizeRound(state: GameState, winnerTeamId: TeamId): GameState {
  const winner = state.teams[winnerTeamId];
  if (!winner) return state;

  // idempotent: if already set, don't double-count
  if (state.roundWinnerTeamId) return { ...state, phase: "ROUND_OVER" };

  const teams: GameState["teams"] = { ...state.teams };
  teams[winnerTeamId] = { ...winner, roundsWon: winner.roundsWon + 1 };

  const roundsToWin = state.config.roundsToWinMatch;
  const matchWinnerTeamId =
    teams[winnerTeamId].roundsWon >= roundsToWin ? winnerTeamId : null;

  return {
    ...state,
    teams,
    phase: matchWinnerTeamId ? "MATCH_OVER" : "ROUND_OVER",
    roundWinnerTeamId: winnerTeamId,
    matchWinnerTeamId,
    clue: null,
  };
}

function endTurn(state: GameState): GameState {
  const nextActive = nextTeamId(state.turnOrderTeamIds, state.activeTeamId);
  const turnsInCurrentCycle = (state.turnsInCurrentCycle + 1) % state.turnOrderTeamIds.length;

  // Assassin shifts every end of turn
  const shiftSeed = (state.seed ^ (state.turnsInCurrentCycle + 1) * 2654435761) >>> 0;
  const cards = assassinShift({ cards: state.cards, seed: shiftSeed });

  return {
    ...state,
    activeTeamId: nextActive,
    phase: "CLUE",
    clue: null,
    turnsInCurrentCycle,
    cards,
    ownAgentsRevealedThisTurn: 0,
    hadErrorThisTurn: false,
  };
}

function rotateSpymasters(teams: Record<TeamId, Team>): Record<TeamId, Team> {
  const next: Record<TeamId, Team> = {};
  for (const [teamId, team] of Object.entries(teams)) {
    const len = team.playerIds.length || 1;
    next[teamId] = {
      ...team,
      spymasterIndex: (team.spymasterIndex + 1) % len,
    };
  }
  return next;
}

export function reduce(state: GameState | null, action: Action): GameState {
  if (action.type === "CREATE_MATCH") {
    const config = withDefaultConfig(action.payload.config);
    const teamsCount = Math.max(2, Math.min(4, config.teamsCount));

    const teamDefs = DEFAULT_TEAM_ORDER.slice(0, teamsCount);
    const teamIds = teamDefs.map((t) => t.id);

    const teams: Record<TeamId, Team> = {};
    for (const t of teamDefs) {
      teams[t.id] = {
        id: t.id,
        name: action.payload.teamNames?.[t.id] ?? t.name,
        color: t.color,
        playerIds: [],
        spymasterIndex: 0,
        roundsWon: 0,
        assassinPenalty: 0,
        mission: null,
      };
    }

    const players: Record<PlayerId, Player> = {};
    let idx = 0;
    for (const p of action.payload.players) {
      if (!teams[p.teamId]) continue;
      const id = `p_${idx++}`;
      players[id] = { id, name: p.name, teamId: p.teamId };
      teams[p.teamId] = { ...teams[p.teamId], playerIds: [...teams[p.teamId].playerIds, id] };
    }

    // Ensure at least one placeholder player per team (so spymaster rotation is defined)
    for (const teamId of teamIds) {
      if (teams[teamId].playerIds.length > 0) continue;
      const id = `p_${idx++}`;
      players[id] = { id, name: `${teams[teamId].name} 1`, teamId };
      teams[teamId] = { ...teams[teamId], playerIds: [id] };
    }

    const seed = action.payload.seed >>> 0;
    const startingIndex = teamIds.length > 0 ? seed % teamIds.length : 0;
    const turnOrderTeamIds = rotate(teamIds, startingIndex);

    const { gridSize, cards } = generateBoard({
      seed,
      config,
      turnOrderTeamIds,
    });
    const teamsWithMissions = assignMissionsForRound({ teams, seed });

    return {
      config,
      matchId: `m_${seed}`,
      seed,
      gridSize,
      phase: "CLUE",
      cards,
      teams: teamsWithMissions,
      players,
      turnOrderTeamIds,
      activeTeamId: turnOrderTeamIds[0],
      roundIndex: 0,
      turnsInCurrentCycle: 0,
      clue: null,
      roundWinnerTeamId: null,
      matchWinnerTeamId: null,
      ownAgentsRevealedThisTurn: 0,
      hadErrorThisTurn: false,
    };
  }

  // After this point, we need an existing state
  if (!state) return state as never;

  if (state.phase === "MATCH_OVER") {
    if (action.type === "RESET_MATCH") {
      const seed = (state.seed + 1) >>> 0;
      const playersList = Object.values(state.players).map((p) => ({
        name: p.name,
        teamId: p.teamId,
      }));
      return reduce(null, { type: "CREATE_MATCH", payload: { config: state.config, players: playersList, seed } });
    }
    return state;
  }

  switch (action.type) {
    case "START_ROUND": {
      const nextSeed = (action.payload.seed ?? (state.seed + 1)) >>> 0;
      const nextRoundIndex = state.roundIndex + 1;

      // rotate who starts each round (simple fairness)
      const nextTurnOrder = rotate(state.turnOrderTeamIds, 1);

      const { gridSize, cards } = generateBoard({
        seed: nextSeed,
        config: state.config,
        turnOrderTeamIds: nextTurnOrder,
      });

      const teams = rotateSpymasters(state.teams);
      const teamsWithMissions = assignMissionsForRound({ teams, seed: nextSeed });

      return {
        ...state,
        seed: nextSeed,
        gridSize,
        cards,
        teams: teamsWithMissions,
        turnOrderTeamIds: nextTurnOrder,
        activeTeamId: nextTurnOrder[0],
        phase: "CLUE",
        clue: null,
        roundWinnerTeamId: null,
        roundIndex: nextRoundIndex,
        turnsInCurrentCycle: 0,
        ownAgentsRevealedThisTurn: 0,
        hadErrorThisTurn: false,
      };
    }

    case "GIVE_CLUE": {
      if (state.phase !== "CLUE") return state;
      if (!isActiveTeamSpymaster(state, action.payload.byPlayerId)) return state;

      const text = action.payload.text.trim();
      const count = Math.max(0, Math.floor(action.payload.count));

      const validation = validateClue({
        clueText: text,
        cards: state.cards,
        config: {
          forbiddenClueMode: state.config.forbiddenClueMode,
          forbiddenClueExtraWords: state.config.forbiddenClueExtraWords,
        },
      });
      if (!validation.ok) return state;

      const guessesAllowed = state.config.guessesRule === "COUNT_PLUS_ONE" ? count + 1 : count;

      const activeTeam = state.teams[state.activeTeamId];
      const mission = applyMissionTrigger(activeTeam.mission, "GIVE_CLUE");
      const teams = mission === activeTeam.mission ? state.teams : { ...state.teams, [activeTeam.id]: { ...activeTeam, mission } };

      const nextState: GameState = {
        ...state,
        teams,
        phase: "GUESS",
        clue: {
          teamId: state.activeTeamId,
          text,
          count,
          guessesAllowed,
          guessesRemaining: guessesAllowed,
          byPlayerId: action.payload.byPlayerId ?? null,
        },
        ownAgentsRevealedThisTurn: 0,
        hadErrorThisTurn: false,
      };

      const winner = getRoundWinnerTeamId(nextState);
      return winner ? finalizeRound(nextState, winner) : nextState;
    }

    case "REVEAL_CARD": {
      if (state.phase !== "GUESS") return state;
      if (!state.clue) return state;

      const idx = state.cards.findIndex((c) => c.id === action.payload.cardId);
      if (idx < 0) return state;
      const card = state.cards[idx];
      if (card.revealedByTeamId) return state;

      const activeTeamId = state.activeTeamId;
      const nextCards = state.cards.slice();
      nextCards[idx] = { ...card, revealedByTeamId: activeTeamId };

      const nextClue = {
        ...state.clue,
        guessesRemaining: Math.max(0, state.clue.guessesRemaining - 1),
      };

      // Assassin -> -5 points penalty, relocate assassin, end turn
      if (card.secret.kind === "ASSASSIN") {
        const team = state.teams[activeTeamId];
        const penaltyTeams = {
          ...state.teams,
          [activeTeamId]: { ...team, assassinPenalty: team.assassinPenalty + 5 },
        };

        // Place a new assassin on a random unrevealed neutral card
        const neutrals: number[] = [];
        for (let i = 0; i < nextCards.length; i++) {
          if (!nextCards[i].revealedByTeamId && nextCards[i].secret.kind === "NEUTRAL") {
            neutrals.push(i);
          }
        }
        let relocatedCards = nextCards;
        if (neutrals.length > 0) {
          const rng = mulberry32((state.seed ^ (state.roundIndex + 1) * 0x9e3779b9) >>> 0);
          const pick = neutrals[randInt(rng, 0, neutrals.length)];
          relocatedCards = nextCards.slice();
          relocatedCards[pick] = { ...relocatedCards[pick], secret: { kind: "ASSASSIN" } };
        }

        return endTurn({
          ...state,
          cards: relocatedCards,
          teams: penaltyTeams,
          clue: null,
          hadErrorThisTurn: true,
        });
      }

      let teams = state.teams;
      let ownAgentsThisTurn = state.ownAgentsRevealedThisTurn;
      let hadError = state.hadErrorThisTurn;

      if (card.secret.kind === "AGENT" && card.secret.teamId === activeTeamId) {
        // Own agent revealed
        teams = applyMissionTriggerToTeam(teams, activeTeamId, "REVEAL_OWN_AGENT");
        ownAgentsThisTurn += 1;

        // "Guess bonus": own agent on the +1 bonus guess (last allowed guess)
        if (state.clue.guessesRemaining === 1) {
          teams = applyMissionTriggerToTeam(teams, activeTeamId, "BONUS_GUESS_REVEAL");
        }

        // "Triple découverte": 3 own agents revealed in one turn
        if (ownAgentsThisTurn >= 3) {
          teams = applyMissionTriggerToTeam(teams, activeTeamId, "TURN_3_OWN_AGENTS");
        }
      } else if (card.secret.kind === "NEUTRAL") {
        // Neutral card
        teams = applyMissionTriggerToTeam(teams, activeTeamId, "REVEAL_NEUTRAL");
        hadError = true;
      } else if (card.secret.kind === "AGENT" && card.secret.teamId !== activeTeamId) {
        // Enemy agent
        teams = applyMissionTriggerToTeam(teams, activeTeamId, "REVEAL_ENEMY_AGENT");
        hadError = true;
      }

      let nextState: GameState = {
        ...state,
        cards: nextCards,
        clue: nextClue,
        teams,
        ownAgentsRevealedThisTurn: ownAgentsThisTurn,
        hadErrorThisTurn: hadError,
      };

      // Check round win (agents all revealed + mission)
      const roundWinner = getRoundWinnerTeamId(nextState);
      if (roundWinner) return finalizeRound(nextState, roundWinner);

      const guessesOver = nextClue.guessesRemaining <= 0;

      // End turn if neutral OR enemy agent OR guesses over
      const endsTurn =
        guessesOver ||
        card.secret.kind === "NEUTRAL" ||
        (card.secret.kind === "AGENT" && card.secret.teamId !== activeTeamId);

      if (endsTurn) {
        // "Prudence": turn ends without any error
        if (!hadError) {
          teams = applyMissionTriggerToTeam(nextState.teams, activeTeamId, "TURN_NO_ERROR");
          nextState = { ...nextState, teams };
        }
        nextState = endTurn({ ...nextState, clue: null });
      }

      return nextState;
    }

    case "STOP_GUESSING": {
      if (state.phase !== "GUESS") return state;
      let teams = applyMissionTriggerToTeam(state.teams, state.activeTeamId, "STOP_GUESSING");

      // "Prudence": stopping without any error this turn
      if (!state.hadErrorThisTurn) {
        teams = applyMissionTriggerToTeam(teams, state.activeTeamId, "TURN_NO_ERROR");
      }

      return endTurn({ ...state, teams, clue: null });
    }

    case "END_TURN": {
      if (state.phase !== "GUESS" && state.phase !== "CLUE") return state;
      return endTurn({ ...state, clue: null });
    }

    case "END_ROUND": {
      return finalizeRound(state, action.payload.winnerTeamId);
    }

    case "NEXT_ROUND": {
      if (state.phase !== "ROUND_OVER") return state;
      // start next round with deterministic seed bump
      const rng = mulberry32(state.seed ^ 0x85ebca6b);
      const nextSeed = ((rng() * 2 ** 32) >>> 0) || (state.seed + 1);
      return reduce(state, { type: "START_ROUND", payload: { seed: nextSeed } });
    }

    case "RESET_MATCH": {
      const seed = (state.seed + 1) >>> 0;
      const playersList = Object.values(state.players).map((p) => ({ name: p.name, teamId: p.teamId }));
      return reduce(null, { type: "CREATE_MATCH", payload: { config: state.config, players: playersList, seed } });
    }

    default:
      return state;
  }
}

