import { RouterLink } from '@angular/router';
import { Component } from '@angular/core';

import ParticlesBackgroundComponent from
  '../../components/particles-background/particles-background.component';


@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, ParticlesBackgroundComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export default class HomePageComponent {}
