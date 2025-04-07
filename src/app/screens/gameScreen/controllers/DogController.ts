import { SpineObjectController } from './SpineObjectController';

/**
 * Перечисление анимаций собаки
 */
export enum DogAnimation {
  IDLE = 'idle',
  IDLE_SCREAM = 'idle_scream',
}

export class DogController extends SpineObjectController {
  /**
   * Статическое имя для создания и идентификации
   */
  public static readonly NAME: string = 'dog';

  // Состояние собаки
  private hasBall: boolean = false;

  /**
   * Создает контроллер для собаки
   */
  constructor() {
    super(DogController.NAME);

    this.state.data.defaultMix = 0.2;

    // Устанавливаем начальную анимацию - по умолчанию собака скулит
    this.state.setAnimation(0, DogAnimation.IDLE_SCREAM, true);
  }

  /**
   * Обновляет idle-анимацию в зависимости от текущего состояния
   * @param trackIndex Индекс трека анимации
   */
  private updateIdleAnimation(trackIndex: number = 0): void {
    // Выбираем анимацию на основе наличия мячика
    const animation = this.hasBall ? DogAnimation.IDLE : DogAnimation.IDLE_SCREAM;

    // Устанавливаем соответствующую idle-анимацию
    this.state.setAnimation(trackIndex, animation, true);
  }

  /**
   * Дает мячик собаке
   */
  public giveBall(): void {
    // Если у собаки уже есть мячик, ничего не делаем
    if (this.hasBall) {
      return;
    }

    this.hasBall = true;
    this.updateIdleAnimation();
  }

  /**
   * Проверяет, есть ли у собаки мячик
   * @returns true, если у собаки есть мячик
   */
  public hasDogBall(): boolean {
    return this.hasBall;
  }

  /**
   * Воспроизводит конкретную анимацию собаки
   * @param animation Анимация из перечисления DogAnimation
   * @param loop Должна ли анимация зацикливаться
   * @param trackIndex Индекс трека для анимации
   * @returns Promise, который разрешается по завершении анимации (если не зацикленная)
   */
  public playDogAnimation(animation: DogAnimation, loop: boolean = false, trackIndex: number = 0): Promise<void> {
    return this.play(animation, loop, trackIndex);
  }

  /**
   * Сбрасывает состояние собаки к начальному
   */
  public reset(): void {
    this.hasBall = false;
    this.state.setAnimation(0, DogAnimation.IDLE_SCREAM, true);
  }
}
