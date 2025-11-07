import { loadSlim } from "@tsparticles/slim"
import { NgParticlesService, NgxParticlesModule } from '@tsparticles/angular';
import { RouterOutlet } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import NetworkService from './services/network';
import DynamicFaviconService from './services/dynamic-favicon';

import type { ISourceOptions } from '@tsparticles/engine';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgxParticlesModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export default class App implements OnInit {
  particlesOptions: ISourceOptions = {
    fpsLimit: 144,
    interactivity: {
      events: {
        resize: {
          enable: true,
          delay: 0
        }
      }
    },
    particles: {
      move: {
        enable: true,
        direction: 'top',
        speed: { min: 3, max: 10 },
        straight: false
      },
      number: {
        value: 75
      },
      opacity: {
        value: 0.8
      },
      shape: {
        type: "image",
        options: {
          image: {
            src: '/assets/background/particle.png',
          }
        }
      },
      size: {
        value: { min: 1, max: 6 }
      }
    },
    detectRetina: true,
  };

  constructor(
    private readonly ngParticleService: NgParticlesService,
    protected readonly faviconService: DynamicFaviconService,
    private readonly networkService: NetworkService
  ) {}

  async ngOnInit(): Promise<void> {
    this.ngParticleService.init(async engine => {
      await loadSlim(engine);
    });
    try {
      await this.networkService.initGuestAuth();
    } catch (error) {
      console.error('Failed to initialize guest authentication:', error);
    }
  }
}
