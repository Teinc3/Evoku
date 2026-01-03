import type AugmentAction from '@shared/types/utils/AugmentAction';
import type PUPElements from '@shared/types/enums/elements';
import type ActionEnum from '@shared/types/enums/actions/';


export interface MatchActionListenerContext {
  onDisconnect?: () => void;
  onCellRejection?: (cellIndex: number, value: number) => void;
  onBeginPupSettling?: () => void;
  onSetPupSettlingType?: (element: PUPElements) => void;
}

export type PacketHandler<GenericAction extends ActionEnum>
  = (data: AugmentAction<GenericAction>) => void;
