import { SpineObjectController } from './SpineObjectController';

/**
 * Перечисление анимаций костра
 */
export enum BonfireAnimation {
  IDLE = 'idle',
  FIRE_IDLE = 'fire_idle',
  FIRE_ON = 'fire_on',
}

export class BonfireController extends SpineObjectController {
  public static readonly NAME: string = 'bonfire';

  /**
   * Создает контроллер для костра
   */
  constructor() {
    super(BonfireController.NAME);

    // Устанавливаем начальную анимацию
    this.state.setAnimation(0, BonfireAnimation.IDLE, true);
  }

  /**
   * Обрабатывает завершение анимации для костра
   */
  protected override onAnimationComplete(animName: string, entry: any): void {
    // После fire_on автоматически переходим к fire_idle
    if (animName === BonfireAnimation.FIRE_ON) {
      this.state.setAnimation(entry.trackIndex, BonfireAnimation.FIRE_IDLE, true);
    }
  }

  /**
   * Зажигает костер
   * @returns Promise, который разрешается, когда анимация разжигания (fire_on) завершится
   */
  public lightFire(): Promise<void> {
    return this.play(BonfireAnimation.FIRE_ON);
  }

  /**
   * Воспроизводит анимацию костра
   * @param animation Анимация из перечисления BonfireAnimation
   * @param loop Должна ли анимация зацикливаться
   * @param trackIndex Индекс трека для анимации
   * @returns Promise, который разрешается по завершении анимации (если не зацикленная)
   */
  public playBonfireAnimation(
    animation: BonfireAnimation,
    loop: boolean = false,
    trackIndex: number = 0,
  ): Promise<void> {
    return this.play(animation, loop, trackIndex);
  }
}
