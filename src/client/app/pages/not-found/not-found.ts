import { RouterLink } from '@angular/router';
import { Component } from '@angular/core';

import ParticlesBackgroundComponent from
  '../../components/particles-background/particles-background.component';


@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink, ParticlesBackgroundComponent],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss'
})
export default class NotFoundPageComponent {}