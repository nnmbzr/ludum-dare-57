import { AnimationState, MixBlend, Spine } from '@esotericsoftware/spine-pixi-v8';
import { Container } from 'pixi.js';
import { SCREEN_WIDTH } from '../../../main';

export class ParallaxStartScreen extends Container {
  private readonly directionTracks = {
    startscreen_left: 2,
    startscreen_right: 3,
    startscreen_lamp_right: 4,
    startscreen_lamp_middle: 5,
    startscreen_lamp_left: 6,
  };

  private startScreenSpine: Spine;
  private state: AnimationState;
  private currentWeights: { [key: string]: number } = {
    startscreen_left: 0,
    startscreen_right: 0,
    startscreen_lamp_right: 0,
    startscreen_lamp_middle: 0,
    startscreen_lamp_left: 0,
  };

  private targetWeights: { [key: string]: number } = {
    startscreen_left: 0,
    startscreen_right: 0,
    startscreen_lamp_right: 0,
    startscreen_lamp_middle: 0,
    startscreen_lamp_left: 1,
  };

  constructor(name: string) {
    super();

    this.startScreenSpine = Spine.from({ skeleton: `${name}.json`, atlas: `${name}.atlas` });
    this.state = this.startScreenSpine.state;

    this.setupAnimations();

    this.addChild(this.startScreenSpine);
  }

  public onMouseMove(mouseX: number) {
    // Получаем центр экрана/области
    const centerX = this.x;

    // Вычисляем относительное положение курсора
    const relativeX = mouseX;

    // Нормализуем к ширине/высоте экрана
    const maxDistanceW = SCREEN_WIDTH / 2;

    // Вычисляем веса анимаций на основе официальной формулы Spine
    this.updateDirectionWeightsSpineStyle(relativeX, centerX, maxDistanceW);
  }

  public update(delta: number) {
    // Интерполяционный фактор для плавности (меньше = плавнее)
    const interpolationFactor = 0.1;

    // Интерполируем текущие веса к целевым для плавности
    Object.keys(this.currentWeights).forEach((direction) => {
      const targetWeight = this.targetWeights[direction as keyof typeof this.targetWeights];

      this.currentWeights[direction] += (targetWeight - this.currentWeights[direction]) * interpolationFactor;
    });

    const animationState = this.startScreenSpine.state;

    // Применяем интерполированные веса к трекам анимации
    Object.entries(this.currentWeights).forEach(([direction, weight]) => {
      const trackIndex = this.directionTracks[direction as keyof typeof this.directionTracks];
      if (animationState.tracks[trackIndex]) {
        animationState.tracks[trackIndex].alpha = weight;
      }
    });

    this.startScreenSpine.update(delta);
  }

  private setupAnimations() {
    this.state.setAnimation(0, 'startscreen_in');
    this.state.addListener({
      complete: (entry) => {
        // console.log('complete', entry.animation?.name);
        if (entry.animation?.name === 'startscreen_in') {
          this.state.setAnimation(0, 'startscreen_idle', true);

          /* setTimeout(() => {
            this.state.setAnimation(0, 'startscreen_out', false);
          }, 1500); */
        } else if (entry.animation?.name === 'startscreen_out') {
          // this.alpha = 0;
        }
      },
    });

    /*     
        // startscreen_in
        // startscreen_idle
        // startscreen_out
    
        // startscreen_lamb_right
        // startscreen_lamb_middle
        // startscreen_lamb_left
    
        // startscreen_left
        // startscreen_right */

    Object.entries(this.directionTracks).forEach(([direction, trackIndex]) => {
      const track = this.state.setAnimation(trackIndex, direction, true);
      // TODO: но неплохо было бы разобраться, почему ADD не работает
      // с ним визуально ощущается лучше
      track.mixBlend = MixBlend.first; // Используем add вместо first
      track.alpha = 0; // Начальный вес 0
    });
  }

  private updateDirectionWeightsSpineStyle(mouseX: number, centerX: number, maxDistanceW: number) {
    const smoothingFactor = 1;

    // Вычисляем веса для направлений left и right (существующая логика)
    this.targetWeights.startscreen_right = mouseX < centerX ? (1 - mouseX / centerX) * smoothingFactor : 0;
    this.targetWeights.startscreen_left = mouseX > centerX ? ((mouseX - centerX) / maxDistanceW) * smoothingFactor : 0;

    // Разделяем экран на три равные области
    const leftThreshold = SCREEN_WIDTH * 0.33;
    const rightThreshold = SCREEN_WIDTH * 0.67;

    // По умолчанию все лампы выключены
    this.targetWeights.startscreen_lamp_left = 0;
    this.targetWeights.startscreen_lamp_middle = 0;
    this.targetWeights.startscreen_lamp_right = 0;

    // Определяем, в какой области находится мышь и активируем соответствующую лампу
    if (mouseX < leftThreshold) {
      // Левая область (0-33%)
      this.targetWeights.startscreen_lamp_left = 1;
    } else if (mouseX < rightThreshold) {
      // Средняя область (34-66%)
      this.targetWeights.startscreen_lamp_middle = 1;
    } else {
      // Правая область (67-100%)
      this.targetWeights.startscreen_lamp_right = 1;
    }
  }

  public playOutAnimation() {
    this.state.setAnimation(0, 'startscreen_out', false);
  }

  public get readyToGo(): boolean {
    return this.state.tracks[0]?.animation?.name === 'startscreen_idle';
  }
}
