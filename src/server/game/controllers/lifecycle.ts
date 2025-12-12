import MatchStatus from "@shared/types/enums/matchstatus";
import GameOverReason from "@shared/types/enums/GameOverReason";
import { ProtocolActions, LifecycleActions } from "@shared/types/enums/actions";

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
  public onPlayerLeft(): void {
    if (this.stateController.matchState.status === MatchStatus.ENDED
      || this.room.participants.size === 2) {
      return;
    }

    if (this.startTimer) {
      clearTimeout(this.startTimer);
      this.startTimer = null;
    }

    // If only one player remains, declare them the winner
    if (this.room.participants.size === 1) {
      const [remainingSession] = this.room.participants.values();
      const winnerID = this.room.playerMap.get(remainingSession.uuid);
      if (winnerID !== undefined) {
        this.onGameOver(winnerID, GameOverReason.FORFEIT);
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
  private onGameOver(winnerID: number, reason: GameOverReason): void {
    if (this.stateController.matchState.status === MatchStatus.ENDED) {
      return;
    }

    this.stateController.matchState.status = MatchStatus.ENDED;
    this.room.broadcast(LifecycleActions.GAME_OVER, { winnerID, reason });
  }

  /** Handle board progress updates from GameLogic and determine phase transitions. */
  private updateProgress(
    isBoard: boolean,
    progressData: { playerID: number; progress: number }[]
  ): void {
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
      this.onGameOver(completedPlayer.playerID, GameOverReason.SCORE);
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

  /** Reset state when closing room. */
  public close(): void {
    if (this.startTimer) {
      clearTimeout(this.startTimer);
      this.startTimer = null;
    }
    this.stateController.matchState.status = MatchStatus.ENDED;
  }
}
