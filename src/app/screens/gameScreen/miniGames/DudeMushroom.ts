import { AnimationState, Spine } from '@esotericsoftware/spine-pixi-v8';
import { Container } from 'pixi.js';
import gsap from 'gsap';

// Константы для игровой механики

export class DudeMushroom extends Container {
  private spine: Spine;
  private state: AnimationState;

  private ready = false;
  private endGame = false;

  private readonly directionTracks = {
    progres: 1,
  };

  private currentWeights: { [key: string]: number } = {
    progres: 0,
  };

  private currentProgress = 0;

  private canclick = false;

  // Коллбеки
  private inCallBack: () => void;
  private endGameCallBack: () => void;

  constructor(inCallBack: () => void, endGameCallBack: () => void) {
    super();

    this.inCallBack = inCallBack;
    this.endGameCallBack = endGameCallBack;

    // Инициализация Spine
    this.spine = Spine.from({ skeleton: 'mini_dude.json', atlas: 'mini_dude.atlas' });
    this.state = this.spine.state;

    // Устанавливаем начальные анимации
    this.state.setAnimation(0, 'in');

    this.state.setAnimation(1, 'progres');

    // Настраиваем слушатель для отслеживания завершения анимаций
    this.setupListeners();
    // this.setupAnimations();

    this.addChild(this.spine);
  }

  /* private setupAnimations() {
    Object.entries(this.directionTracks).forEach(([direction, trackIndex]) => {
      const track = this.state.setAnimation(trackIndex, direction, true);
      // TODO: но неплохо было бы разобраться, почему ADD не работает
      // с ним визуально ощущается лучше
      track.mixBlend = MixBlend.add; // Используем add вместо first
      track.alpha = 0; // Начальный вес 0
    });
  } */

  private setupListeners() {
    this.state.addListener({
      complete: (entry) => {
        if (entry.animation?.name === 'in') {
          // Анимация появления завершена, можно начинать игру
          this.inCallBack();
          this.ready = true;
          this.canclick = true;
          this.state.setAnimation(0, 'idle', true);
        } else if (entry.animation?.name === 'out') {
          // Анимация завершения игры
          // console.log('Игра завершена!');
        }
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onDown(_x: number, _y: number) {
    if (!this.ready || this.endGame || !this.canclick) return;

    this.canclick = false;

    const bone = this.spine.skeleton.findBone('jaw_move');
    if (bone) {
      // TODO: вернуть обратно!
      this.currentProgress += 0.05;

      gsap.to(bone, {
        x: 50,
        duration: 0.15,
        repeat: 1,
        yoyo: true,
        ease: 'power1.inOut',
        onComplete: () => {
          if (this.currentProgress >= 1) {
            this.finishGame();
          } else {
            this.canclick = true;
          }
        },
      });

      gsap.to(this.currentWeights, {
        progres: this.currentProgress + 0.1,
        duration: 0.15,
        ease: 'back.Out',
        onComplete: () => {
          this.state.setAnimation(2, 'part');
          gsap.to(this.currentWeights, {
            progres: this.currentProgress,
            duration: 0.15,
            ease: 'back.Out',
          });
        },
      });
    }
  }

  public onUp() {
    if (!this.ready || this.endGame) return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onMove(_x: number, _y: number) {
    if (!this.ready || this.endGame) return;
  }

  private finishGame() {
    // Завершаем игру
    this.state.setAnimation(0, 'out', false);

    this.endGameCallBack();
    this.endGame = true;
  }

  public update(dt: number) {
    if (this.endGame) return;

    // Обновляем Spine анимацию
    this.spine.update(dt);

    const animationState = this.spine.state;

    // Применяем интерполированные веса к трекам анимации
    Object.entries(this.currentWeights).forEach(([direction, weight]) => {
      const trackIndex = this.directionTracks[direction as keyof typeof this.directionTracks];
      if (animationState.tracks[trackIndex]) {
        animationState.tracks[trackIndex].alpha = weight;
      }
    });

    if (!this.ready) return;

    // this.currentWeights.progres = 1;
  }

  public getPhoto(): string {
    return 'art_backpack'; // Название изображения для фона в PhotoPopup
  }
}
