import seedrandom from 'seedrandom';
import BiMap from 'bidirectional-map';

import clientConfig from '@config/client.json' with { type: 'json' };
import ActionGuard from '../../types/utils/typeguards/actions';

import type ActionEnum from '../../types/enums/actions';


class PacketScrambler {
  private map: BiMap<number> | undefined;

  constructor() {
    const seed = clientConfig.security.packetScramblerSeed;

    // Only initialize the mapping if a seed is provided.
    // If no seed exists, the maps remain undefined, and IDs pass through unchanged.
    if (seed) {
      this.initializeMaps(seed);
    }
  }

  private initializeMaps(seed: string): void {
    this.map = new BiMap();

    const prng = seedrandom(seed);

    // Define the pool of all possible IDs (for a Byte, -128 to 127)
    const originalIds = Array.from({ length: 256 }, (_, i) => i - 128);
    const shuffledIds = [...originalIds];

    // Shuffle with the seeded PRNG
    for (let i = shuffledIds.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
    }

    // Create the 1-to-1 forward and reverse mappings
    for (let i = 0; i < originalIds.length; i++) {
      const devID = originalIds[i];
      const scrambledID = shuffledIds[i];

      this.map.set(devID.toString(), scrambledID);
    }
  }

  /**
     * Takes a static development ID and returns its scrambled version for network transmission.
     * @param packetID The internal, static packet ID.
     * @returns The scrambled packet ID.
     */
  public scrambleID(packetID: ActionEnum): number {
    // If the map doesn't exist, return the ID unchanged.
    if (!this.map) {
      return packetID;
    }

    const scrambled = this.map.get(packetID.toString());

    if (scrambled === undefined) {
      console.warn(`PacketScrambler: No mapping for packetID ${packetID} found.`);
      return packetID; // Fallback for safety
    }

    return scrambled;
  }

  /**
     * Takes a scrambled ID received from the network and returns the original development ID.
     * @param scrambledID The external, scrambled packet ID.
     * @returns The original static packet ID.
     */
  public unscrambleID(scrambledID: number): ActionEnum {
    // If the map doesn't exist, return the ID unchanged.
    if (!this.map) {
      return scrambledID;
    }

    const original = this.map.getKey(scrambledID);

    if (original === undefined) {
      console.warn(`PacketScrambler: Could not unscramble ID ${scrambledID}.`);
      return scrambledID; // Fallback for safety
    }

    const packetID = parseInt(original);
    if (!ActionGuard.isActionEnum(packetID)) {
      console.warn(
        `PacketScrambler: Unscrambled ID ${scrambledID} to invalid ActionEnum ${packetID}.`
      );
    }

    return packetID;
  }
}

// Export as a singleton instance for global use
const packetScrambler = new PacketScrambler();
export { packetScrambler as default, PacketScrambler };