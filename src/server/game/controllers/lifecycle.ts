import MatchStatus from "../../types/enums/matchstatus";
import GameOverReason from "../../../shared/types/enums/GameOverReason";
import LifecycleActions from "../../../shared/types/enums/actions/match/lifecycle";

import type { GameLogicCallbacks } from "../../types/gamelogic";
import type RoomModel from "../../models/networking/Room";
import type GameStateController from "./state";


/**
 * LifecycleController orchestrates match lifecycle transitions for a Room.
 * - Owns matchStatus for the room
 * - Starts games (e.g., after N players joined, after delay)
 * - Subscribes to GameLogic via callbacks (e.g., game over)
 * - Broadcasts lifecycle packets (GAME_INIT, GAME_OVER)
 */
export default class LifecycleController {
  private status: MatchStatus = MatchStatus.PREINIT;
  private startTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly room: RoomModel,
    private readonly stateController: GameStateController
  ) {
    const callbacks: GameLogicCallbacks = {
      getMatchStatus: () => this.status,
      onBoardProgressUpdate: progressData => this.onBoardProgressUpdate(progressData)
    };
    this.stateController.setCallbacks(callbacks);
  }

  public get matchStatus(): MatchStatus {
    return this.status;
  }

  /** Schedule game start 5s after 2 players joined (idempotent). */
  public onPlayerJoined(): void {
    if (this.status !== MatchStatus.PREINIT || this.room.participants.size < 2 || this.startTimer) {
      return;
    }

    this.startTimer = setTimeout(() => {
      this.startTimer = null;
      this.initGame();
    }, 5000);
  }

  /** Declare victory for the remaining player if one leaves. */
  public onPlayerLeft(): void {
    if (this.status === MatchStatus.ENDED || this.room.participants.size === 2) {
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
    if (this.status !== MatchStatus.PREINIT) {
      return;
    }

    this.status = MatchStatus.ONGOING;

    // Initialise the timeservice
    this.room.timeService.start();

    // Initialize players' boards from logic
    const cellValues = this.stateController.initGameStates();

    // Broadcast initial board to each participant
    this.room.broadcast(LifecycleActions.GAME_INIT, { cellValues });
  }

  /** Handle game over callbacks from GameLogic and broadcast to room. */
  private onGameOver(winnerID: number, reason: GameOverReason): void {
    if (this.status === MatchStatus.ENDED) {
      return;
    }

    this.status = MatchStatus.ENDED;
    this.room.broadcast(LifecycleActions.GAME_OVER, { winnerID, reason });
  }

  /** Handle board progress updates from GameLogic and determine phase transitions. */
  private onBoardProgressUpdate(progressData: { playerID: number; progress: number }[]): void {
    if (this.status !== MatchStatus.ONGOING) {
      return;
    }

    // Check for game completion (100% progress)
    const completedPlayer = progressData.find(p => p.progress >= 100);
    if (completedPlayer) {
      this.onGameOver(completedPlayer.playerID, GameOverReason.SCORE);
      return;
    }

    // TODO: Future phase transitions
    // Check for phase 2 completion (66% progress) 
    // const phase2Players = progressData.filter(p => p.progress >= 66);
    // if (phase2Players.length > 0) {
    //   // Handle phase 2 completion logic
    // }
    // Check for phase 1 completion (33% progress)
    // const phase1Players = progressData.filter(p => p.progress >= 33);
    // if (phase1Players.length > 0) {
    //   // Handle phase 1 completion logic
    // }
  }

  /** Reset state when closing room. */
  public close(): void {
    if (this.startTimer) {
      clearTimeout(this.startTimer);
      this.startTimer = null;
    }
    this.status = MatchStatus.ENDED;
  }
}
