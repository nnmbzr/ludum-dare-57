import { AnimationState, MixBlend, Spine } from '@esotericsoftware/spine-pixi-v8';
import { Container } from 'pixi.js';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../../main';

export class ParallaxOwl extends Container {
  private readonly directionTracks = {
    up: 2,
    down: 3,
    right: 4,
    left: 5,
  };

  private owlSpine: Spine;
  private state: AnimationState;
  private currentWeights: { [key: string]: number } = {
    up: 0,
    down: 0,
    right: 0,
    left: 0,
  };

  private targetWeights: { [key: string]: number } = {
    up: 0,
    down: 0,
    right: 0,
    left: 0,
  };

  constructor(name: string) {
    super();

    this.owlSpine = Spine.from({ skeleton: `${name}.json`, atlas: `${name}.atlas` });
    this.state = this.owlSpine.state;

    this.setupAnimations();

    this.addChild(this.owlSpine);
  }

  public onMouseMove(mouseX: number, mouseY: number) {
    // Получаем центр экрана/области
    const centerX = this.x;
    const centerY = this.y;

    // Вычисляем относительное положение курсора
    const relativeX = mouseX;
    const relativeY = mouseY;

    // Нормализуем к ширине/высоте экрана
    const maxDistanceW = SCREEN_WIDTH / 2;
    const maxDistanceH = SCREEN_HEIGHT / 2;

    // Вычисляем веса анимаций на основе официальной формулы Spine
    this.updateDirectionWeightsSpineStyle(relativeX, relativeY, centerX, centerY, maxDistanceW, maxDistanceH);
  }

  public update(delta: number) {
    // Интерполяционный фактор для плавности (меньше = плавнее)
    const interpolationFactor = 0.1;

    // Интерполируем текущие веса к целевым для плавности
    Object.keys(this.currentWeights).forEach((direction) => {
      const targetWeight = this.targetWeights[direction as keyof typeof this.targetWeights];

      this.currentWeights[direction] += (targetWeight - this.currentWeights[direction]) * interpolationFactor;
    });

    const animationState = this.owlSpine.state;

    // Применяем интерполированные веса к трекам анимации
    Object.entries(this.currentWeights).forEach(([direction, weight]) => {
      const trackIndex = this.directionTracks[direction as keyof typeof this.directionTracks];
      if (animationState.tracks[trackIndex]) {
        animationState.tracks[trackIndex].alpha = weight;
      }
    });

    this.owlSpine.update(delta);
  }

  private setupAnimations() {
    this.state.setAnimation(0, 'idle', true);
    const blinkTrack = this.state.setAnimation(1, 'blink', true);
    blinkTrack.mixBlend = MixBlend.add;

    Object.entries(this.directionTracks).forEach(([direction, trackIndex]) => {
      const track = this.state.setAnimation(trackIndex, direction, true);
      // TODO: но неплохо было бы разобраться, почему ADD не работает
      // с ним визуально ощущается лучше
      track.mixBlend = MixBlend.first; // Используем add вместо first
      track.alpha = 0; // Начальный вес 0
    });
  }

  private updateDirectionWeightsSpineStyle(
    mouseX: number,
    mouseY: number,
    centerX: number,
    centerY: number,
    maxDistanceW: number,
    maxDistanceH: number,
  ) {
    // Вычисляем веса по формуле из официального примера Spine
    this.targetWeights.up = mouseY < centerY ? (1 - mouseY / centerY) * 0.7 : 0;
    this.targetWeights.down = mouseY > centerY ? ((mouseY - centerY) / maxDistanceH) * 0.7 : 0;
    this.targetWeights.right = mouseX < centerX ? (1 - mouseX / centerX) * 0.7 : 0;
    this.targetWeights.left = mouseX > centerX ? ((mouseX - centerX) / maxDistanceW) * 0.7 : 0;
  }
}
