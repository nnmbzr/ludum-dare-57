import { AnimationState, Spine } from '@esotericsoftware/spine-pixi-v8';

export class SpineObjectController {
  protected spine: Spine;
  protected state: AnimationState;
  protected animationCompletePromises: Map<string, { resolve: () => void; reject: (reason?: any) => void }>;

  /**
   * Создает контроллер для Spine-объекта
   * @param name Имя объекта (используется для подстановки в шаблоны .json и .atlas)
   */
  constructor(public readonly name: string) {
    this.spine = Spine.from({ skeleton: `${name}.json`, atlas: `${name}.atlas` });
    this.state = this.spine.state;
    this.state.timeScale = 0.5;
    this.animationCompletePromises = new Map();

    // Настраиваем слушатель завершения анимаций
    this.setupAnimationListener();
  }

  /**
   * Настраивает слушатель для отслеживания завершения анимаций
   */
  protected setupAnimationListener(): void {
    this.state.addListener({
      complete: (entry) => {
        if (!entry.animation) return;

        const animName = entry.animation.name;
        const promise = this.animationCompletePromises.get(animName);

        if (promise) {
          promise.resolve();
          this.animationCompletePromises.delete(animName);
        }

        // Переопределяется в потомках для обработки конкретных переходов анимации
        this.onAnimationComplete(animName, entry);
      },
    });
  }

  /**
   * Метод, который переопределяется в потомках для обработки завершения анимаций
   * @param animName Имя завершившейся анимации
   * @param entry Объект трека анимации
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onAnimationComplete(_animName: string, _entry: any): void {
    // Переопределяется в потомках
  }

  /**
   * Воспроизводит анимацию и, по желанию, ожидает ее завершения
   * @param animName Имя анимации для воспроизведения
   * @param loop Должна ли анимация зацикливаться
   * @param trackIndex Индекс трека для анимации
   * @returns Promise, который разрешается по завершении анимации (если не зацикленная)
   */
  public play(animName: string, loop: boolean = false, trackIndex: number = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      // Если анимация зацикленная, сразу разрешаем Promise
      if (loop) {
        this.state.setAnimation(trackIndex, animName, true);
        resolve();
        return;
      }

      this.state.setAnimation(trackIndex, animName, false);

      // Сохраняем коллбэк разрешения Promise для вызова после завершения анимации
      this.animationCompletePromises.set(animName, { resolve, reject });
    });
  }

  /**
   * Получить объект Spine
   * @returns Объект Spine
   */
  public getSpine(): Spine {
    return this.spine;
  }

  /**
   * Обновляет анимацию Spine
   * @param delta Время, прошедшее с предыдущего обновления в секундах
   */
  public update(delta: number): void {
    this.spine.update(delta);
  }
}
