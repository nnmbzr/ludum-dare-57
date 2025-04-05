import { AnimationState, MixBlend, Spine } from '@esotericsoftware/spine-pixi-v8';
import { Container } from 'pixi.js';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../../main';

export class ParallaxBack extends Container {
  private readonly backWidth: number = 2880;
  private readonly backHeight: number = 1080;

  private currentCameraOffset: number = 0;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private needRecalculate: boolean = true;

  private readonly directionTracks = {
    up: 2,
    down: 3,
    right: 4,
    left: 5,
  };

  private spine: Spine;
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

    this.spine = Spine.from({ skeleton: `${name}.json`, atlas: `${name}.atlas` });
    this.state = this.spine.state;

    this.setupAnimations();

    this.addChild(this.spine);
  }

  public onMouseMove(mouseX: number, mouseY: number) {
    // Проверяем, изменилась ли позиция мыши
    if (this.lastMouseX !== mouseX || this.lastMouseY !== mouseY) {
      this.lastMouseX = mouseX;
      this.lastMouseY = mouseY;
      this.needRecalculate = true;
    }
  }

  public update(delta: number, cameraOffset: number) {
    // Проверяем, изменился ли сдвиг камеры
    if (this.currentCameraOffset !== cameraOffset) {
      this.currentCameraOffset = cameraOffset;
      this.needRecalculate = true;
    }

    // Пересчитываем веса только при необходимости
    if (this.needRecalculate) {
      // Получаем центр экрана/области
      const centerX = this.x;
      const centerY = this.y;

      // Используем сохраненные координаты мыши
      const relativeX = this.lastMouseX;
      const relativeY = this.lastMouseY;

      // Нормализуем к ширине/высоте экрана
      const maxDistanceW = SCREEN_WIDTH / 2;
      const maxDistanceH = SCREEN_HEIGHT / 2;

      // Вычисляем веса анимаций
      this.updateDirectionWeightsSpineStyle(relativeX, relativeY, centerX, centerY, maxDistanceW, maxDistanceH);

      // Сбрасываем флаг после пересчета
      this.needRecalculate = false;
    }

    // Интерполяционный фактор для плавности (меньше = плавнее)
    // TODO: сделать меньше или разобраться между центром
    const interpolationFactor = 0.1;

    // Интерполируем текущие веса к целевым для плавности
    Object.keys(this.currentWeights).forEach((direction) => {
      const targetWeight = this.targetWeights[direction as keyof typeof this.targetWeights];
      this.currentWeights[direction] += (targetWeight - this.currentWeights[direction]) * interpolationFactor;
    });

    const animationState = this.spine.state;

    // Применяем интерполированные веса к трекам анимации
    Object.entries(this.currentWeights).forEach(([direction, weight]) => {
      const trackIndex = this.directionTracks[direction as keyof typeof this.directionTracks];
      if (animationState.tracks[trackIndex]) {
        animationState.tracks[trackIndex].alpha = weight;
      }
    });

    this.spine.update(delta);
  }

  private setupAnimations() {
    // this.state.setAnimation(0, 'idle', true);

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

    const backW = this.backWidth;
    const pureWidth = (backW - SCREEN_WIDTH) / backW;

    const baseOffsetL = (backW / 2 + (this.currentCameraOffset * (backW - SCREEN_WIDTH)) / 2) / backW;
    const baseOffsetR = 1 - (backW / 2 + (this.currentCameraOffset * (backW - SCREEN_WIDTH)) / 2) / backW;

    const smoothingFactor = 1;

    this.targetWeights.up = mouseY < centerY ? (1 - mouseY / centerY) * smoothingFactor : 0;
    this.targetWeights.down = mouseY > centerY ? ((mouseY - centerY) / maxDistanceH) * smoothingFactor : 0;
    this.targetWeights.left =
      mouseX < centerX ? (baseOffsetL + pureWidth * (1 - mouseX / centerX)) * smoothingFactor : 0;
    this.targetWeights.right =
      mouseX > centerX ? (baseOffsetR + pureWidth * ((mouseX - centerX) / maxDistanceW)) * smoothingFactor : 0;
  }

  public get width(): number {
    return this.backWidth;
  }

  public get height(): number {
    return this.backHeight;
  }
}
