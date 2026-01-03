import { Injectable } from '@angular/core';

import NetworkService from '../../../app/services/network';
import MatchActionListener from './MatchActionListener';


@Injectable()
export default class DuelActionListener extends MatchActionListener {
  public constructor(networkService: NetworkService) {
    super(networkService);
  }
}
