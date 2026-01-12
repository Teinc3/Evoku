import MatchStatus from "@shared/types/enums/matchstatus";
import GameOverReason from "@shared/types/enums/GameOverReason";
import { ProtocolActions, LifecycleActions } from "@shared/types/enums/actions";
import RatingCalculator from "../../utils/rating";
import guestAuthService from "../../services/auth";

import type { UUID } from "crypto";
import type { IPUPSlotState } from "@shared/types/gamestate/powerups";
import type { GameLogicCallbacks } from "../../types/gamelogic";
import type { RoomModel } from "../../models/networking";
import type GameStateController from "./state";


/**
 * LifecycleController orchestrates match lifecycle transitions for a Room.
 * - Owns matchStatus for the room
 * - Starts games (e.g., after N players joined, after delay)
 * - Subscribes to GameLogic via callbacks (e.g., game over)
 * - Broadcasts lifecycle packets (GAME_INIT, GAME_OVER)
 */
export default class LifecycleController {
  private startTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly room: RoomModel,
    private readonly stateController: GameStateController
  ) {
    const callbacks: GameLogicCallbacks = {
      onProgressUpdate: this.updateProgress.bind(this),
      onCellSolved: this.onCellSolved.bind(this),
    };
    this.stateController.setCallbacks(callbacks);
  }

  /** Schedule game start 5s after 2 players joined (idempotent). */
  public onPlayerJoined(): void {
    if (this.stateController.matchState.status !== MatchStatus.PREINIT
      || this.room.participants.size < 2 || this.startTimer) {
      return;
    }
    this.startTimer = setTimeout(() => {
      this.startTimer = null;
      try {
        this.initGame();
      } catch (error) {
        console.error('Game initialization failed:', error);
        this.stateController.matchState.status = MatchStatus.ENDED;
        // Optionally notify participants of initialization failure
      }
    }, 5000);
  }

  /** Declare victory for the remaining player if one leaves. */
  public async onPlayerLeft(session: UUID): Promise<void> {
    if (this.stateController.matchState.status === MatchStatus.ENDED) {
      return;
    }

    if (this.startTimer) {
      clearTimeout(this.startTimer);
      this.startTimer = null;
    }

    // If only one player remains after this leaves, they win
    if (this.room.participants.size === 2) {
      const remainingUUID = this.room.participants.values()
        .find(s => s.uuid !== session)?.uuid;
      if (!remainingUUID) {
        return;
      }
      const winnerID = this.room.playerMap.get(remainingUUID);
      if (winnerID !== undefined) {
        await this.onGameOver(winnerID, GameOverReason.FORFEIT);
      }
    }
  }

  /** Initialises the game, setting up player states and timers */
  public initGame(): void {
    if (this.stateController.matchState.status !== MatchStatus.PREINIT) {
      return;
    }

    this.stateController.matchState.status = MatchStatus.ONGOING;
    // Initialise the timeservice
    this.room.timeService.start();

    // Initialize players' boards from logic
    const cellValues = this.stateController.initGameStates();

    // Broadcast initial board to each participant
    this.room.broadcast(LifecycleActions.GAME_INIT, { cellValues });
  }

  /** Handle game over callbacks from GameLogic and broadcast to room. */
  private async onGameOver(winnerID: number, reason: GameOverReason): Promise<void> {
    if (this.stateController.matchState.status === MatchStatus.ENDED) {
      return;
    }

    this.stateController.matchState.status = MatchStatus.ENDED;

    // Get winner and loser UUIDs
    const winnerUUID = this.room.playerMap.getKey(winnerID) as UUID;
    const loserUUID = this.room.playerMap.getKey(1 - winnerID) as UUID;

    if (!winnerUUID || !loserUUID) {
      // Fallback if UUIDs not found
      this.room.broadcast(LifecycleActions.GAME_OVER, { winnerID, reason, eloChange: 0 });
      return;
    }

    // Get sessions
    const winnerSession = this.room.participants.get(winnerUUID);
    const loserSession = this.room.participants.get(loserUUID);

    if (!winnerSession || !loserSession) {
      this.room.broadcast(LifecycleActions.GAME_OVER, { winnerID, reason, eloChange: 0 });
      return;
    }

    // Get current ELOs
    const winnerElo = winnerSession.getElo();
    const loserElo = loserSession.getElo();

    // Calculate ELO changes
    const {
      newWinnerElo,
      newLoserElo,
      eloChange
    } = RatingCalculator.calculateEloUpdate(winnerElo, loserElo);

    // Update Redis
    try {
      await Promise.all([
        (async () => {
          await guestAuthService.updateElo(winnerUUID, newWinnerElo);
          winnerSession.setElo(newWinnerElo);
        })(),
        (async () => {
          await guestAuthService.updateElo(loserUUID, newLoserElo);
          loserSession.setElo(newLoserElo);
        })()
      ]);
    } catch (error) {
      console.error('Failed to update ELO in Redis:', error);
    }

    // Broadcast with ELO change
    this.room.broadcast(LifecycleActions.GAME_OVER, { winnerID, reason, eloChange });
  }

  /** Handle board progress updates from GameLogic and determine phase transitions. */
  private async updateProgress(
    isBoard: boolean,
    progressData: { playerID: number; progress: number }[]
  ): Promise<void> {
    if (this.stateController.matchState.status !== MatchStatus.ONGOING) {
      return;
    }

    // Broadcast board progress updates to all players
    for (const { playerID, progress } of progressData) {
      this.room.broadcast(ProtocolActions.UPDATE_PROGRESS, {
        playerID,
        isBoard,
        progress
      });
    }

    // Following checks are for board progress only
    if (!isBoard) {
      return;
    }

    // Check for game completion (100% progress)
    const completedPlayer = progressData.find(p => p.progress >= 100);
    if (completedPlayer) {
      await this.onGameOver(completedPlayer.playerID, GameOverReason.SCORE);
      return;
    }

    // Future phase transitions
    const nextPhasePlayers
      = progressData.filter(p => p.progress >= (this.stateController.matchState.phase + 1) * 33.4);
    if (nextPhasePlayers.length > 0) {
      this.stateController.matchState.phase += 1;
      // Handle phase transition logic (e.g., notify players)
      this.room.broadcast(LifecycleActions.PHASE_TRANSITION, {
        newPhase: this.stateController.matchState.phase
      });
    }
  }

  public onThreatExpired(
    attackerID: number,
    pupID: number,
    serverTime: number,
    timeoutId: ReturnType<typeof setTimeout>
  ): void {
    if (this.stateController.matchState.status !== MatchStatus.ONGOING) {
      return;
    }

    const slot = this.stateController.findPUPSlotByPupID(attackerID, pupID);
    const pendingEffect = slot?.pup?.pendingEffect;
    if (!pendingEffect || pendingEffect.serverTimeoutID !== timeoutId) {
      return;
    }

    this.applyEffect(attackerID, slot, serverTime, false);
    this.stateController.setPUPPendingEffect(attackerID, pupID, undefined);
  }

  private async onCellSolved(
    playerID: number,
    cellIndex: number,
    serverTime: number
  ): Promise<void> {
    if (this.stateController.matchState.status !== MatchStatus.ONGOING) {
      return;
    }

    const opponentID = 1 - playerID;
    const oppPups = this.stateController.getPlayerPowerups(opponentID);
    if (!oppPups) {
      return;
    }

    for (const slot of oppPups) {
      const pup = slot.pup;
      const pendingEffect = pup?.pendingEffect;
      const timeoutId = pendingEffect?.serverTimeoutID;

      if (!pup || !pendingEffect || timeoutId === undefined
        || pendingEffect.targetID !== playerID || serverTime >= slot.lastCooldownEnd) {
        continue;
      }

      const objectiveType = slot.slotIndex;
      if (!this.stateController.isObjectiveSolvedForCell(playerID, objectiveType, cellIndex)) {
        continue;
      }

      this.applyEffect(playerID, slot, serverTime, true);
      this.room.clearTrackedTimeout(timeoutId);
    }
  }

  private applyEffect(
    playerID: number,
    slot: IPUPSlotState,
    serverTime: number,
    diffused: boolean
  ): void {
    if (!slot.pup || !slot.pup.pendingEffect) {
      return;
    }

    const targetID = diffused ? playerID : slot.pup.pendingEffect.targetID;

    // TODO: Implement effect application logic based on pup type
    // this.stateController.applyPUPEffect(slot.pup, targetID);

    // Broadcast result to players
    this.room.broadcast(LifecycleActions.APPLY_EFFECT, {
      serverTime,
      playerID,
      targetID,
      pupID: slot.pup.pupID,
    });

    // Finally, delete the pup from the attacker's inventory
    slot.pup = undefined;
  }

  /** Reset state when closing room. */
  public close(): void {
    if (this.startTimer) {
      clearTimeout(this.startTimer);
      this.startTimer = null;
    }
    this.stateController.matchState.status = MatchStatus.ENDED;
  }
}
