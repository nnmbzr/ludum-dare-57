import { AnimationState, Spine } from '@esotericsoftware/spine-pixi-v8';
import { Container } from 'pixi.js';

// Константы для игровой механики

export class MarshmeloGame extends Container {
  private spine: Spine;
  private state: AnimationState;

  private ready = false;
  private endGame = false;

  // Коллбеки
  private inCallBack: () => void;
  private endGameCallBack: () => void;

  constructor(inCallBack: () => void, endGameCallBack: () => void) {
    super();

    this.inCallBack = inCallBack;
    this.endGameCallBack = endGameCallBack;

    // Инициализация Spine
    this.spine = Spine.from({ skeleton: 'bagpack.json', atlas: 'bagpack.atlas' });
    this.state = this.spine.state;

    // Устанавливаем начальные анимации
    this.state.setAnimation(0, 'in');

    // Настраиваем слушатель для отслеживания завершения анимаций
    this.setupListeners();

    this.addChild(this.spine);
  }

  private setupListeners() {
    this.state.addListener({
      complete: (entry) => {
        if (entry.animation?.name === 'in') {
          // Анимация появления завершена, можно начинать игру
          this.inCallBack();
          this.ready = true;
          this.state.setAnimation(0, 'idle', true);
        } else if (entry.animation?.name === 'out') {
          // Анимация завершения игры
          console.log('Игра завершена!');
          this.endGameCallBack();
          this.endGame = true;
        }
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onDown(_x: number, _y: number) {
    if (!this.ready || this.endGame) return;
  }

  public onUp() {
    if (!this.ready || this.endGame) return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onMove(_x: number, _y: number) {
    if (!this.ready || this.endGame) return;
  }

  /* private finishGame() {
    // Завершаем игру
    this.ready = false;
    this.state.setAnimation(0, 'out', false);
  } */

  public update(dt: number) {
    if (this.endGame) return;

    // Обновляем Spine анимацию
    this.spine.update(dt);

    if (!this.ready) return;
  }

  public getPhoto(): string {
    return 'art_backpack'; // Название изображения для фона в PhotoPopup
  }
}
