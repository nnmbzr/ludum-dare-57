import { Container } from 'pixi.js';
import { SCREEN_WIDTH } from '../../../main';
import gsap from 'gsap';

export class CameraHorizontalMove {
  readonly minLeft: number = SCREEN_WIDTH * 0.1;
  readonly maxRight: number = SCREEN_WIDTH * 0.9;

  private currentPosition: number = 0;
  private gameContainer: Container;
  private screenAdditive: number;

  private cameraMoveTweener: gsap.core.Tween | null = null;

  constructor(gameContainer: Container, screenMaxWidth: number) {
    this.gameContainer = gameContainer;
    this.screenAdditive = (screenMaxWidth - SCREEN_WIDTH) / 2;
  }

  public onMouseMove(mouseX: number): void {
    if (this.cameraMoveTweener) return;

    if (mouseX <= this.minLeft && this.currentPosition < 1) {
      // смещаем камеру влево
      this.currentPosition++;
      this.changeCameraPosition();
    } else if (mouseX >= this.maxRight && this.currentPosition > -1) {
      // смещаем камеру вправо
      this.currentPosition--;
      this.changeCameraPosition();
    }
  }

  private changeCameraPosition(): void {
    if (this.cameraMoveTweener) {
      this.cameraMoveTweener.kill();
    }

    this.cameraMoveTweener = gsap.to(this.gameContainer, {
      duration: 0.75,
      x: this.currentPosition * this.screenAdditive,
      ease: 'power1.out',
      // ease: 'sine.inOut',
      onComplete: () => {
        this.cameraMoveTweener = null;
      },
    });
  }

  public getCameraOffset(): number {
    return this.gameContainer.x / this.screenAdditive;
  }
}
