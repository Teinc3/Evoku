import { RouterLink } from '@angular/router';
import { Component } from '@angular/core';


@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export default class HomePageComponent {}
