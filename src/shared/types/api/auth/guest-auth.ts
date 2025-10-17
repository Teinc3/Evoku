/** Response interface for guest authentication endpoint */
interface IGuestAuthResponse {
  token: string;
  elo: number;
}

export default IGuestAuthResponse;
