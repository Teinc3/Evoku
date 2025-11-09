import { RouterLink } from '@angular/router';
import { Component } from '@angular/core';


@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss'
})
export default class NotFoundPageComponent {}
