/** Response interface for guest authentication endpoint */
interface IGuestAuthResponse<UUIDType = string> {
  token: string;
  elo: number;
  userID: UUIDType;
}

export default IGuestAuthResponse;
