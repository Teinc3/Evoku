import { loadSlim } from '@tsparticles/slim';
import { NgxParticlesModule } from '@tsparticles/angular';
import { Component } from '@angular/core';

import type { Container, Engine, ISourceOptions } from '@tsparticles/engine';


@Component({
  selector: 'app-particles-background',
  standalone: true,
  imports: [NgxParticlesModule],
  templateUrl: './particles-background.component.html',
  styleUrl: './particles-background.component.scss'
})
export default class ParticlesBackgroundComponent {
  protected id = 'tsparticles';

  protected particlesOptions: ISourceOptions = {
    background: {
      color: {
        value: 'transparent'
      }
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onClick: {
          enable: false
        },
        onHover: {
          enable: true,
          mode: 'repulse'
        },
        resize: {
          enable: true,
          delay: 0.5
        }
      },
      modes: {
        repulse: {
          distance: 100,
          duration: 0.4
        }
      }
    },
    particles: {
      color: {
        value: ['#00ffff', '#ff00ff', '#ffffff']
      },
      links: {
        color: '#ffffff',
        distance: 150,
        enable: true,
        opacity: 0.3,
        width: 1
      },
      move: {
        direction: 'none',
        enable: true,
        outModes: {
          default: 'bounce'
        },
        random: false,
        speed: 1,
        straight: false
      },
      number: {
        density: {
          enable: true,
          width: 1920,
          height: 1080
        },
        value: 80
      },
      opacity: {
        value: 0.5
      },
      shape: {
        type: 'circle'
      },
      size: {
        value: { min: 1, max: 3 }
      }
    },
    detectRetina: true
  };

  protected async particlesInit(engine: Engine): Promise<void> {
    await loadSlim(engine);
  }

  protected particlesLoaded(_container: Container): void {
  }
}
