import { SpineObjectController } from './SpineObjectController';

/**
 * Перечисление анимаций персонажа
 */
export enum BoyAnimation {
  IDLE = 'idle',
  IDLE_FIRE = 'idle_fire',
  IDLE_GUITAR = 'idle_guitar',
  IDLE_GUITAR_FIRE = 'idle_guitar_fire',
  GUITAR_ON = 'guitar_on',
}

export class BoyController extends SpineObjectController {
  /**
   * Статическое имя для создания и идентификации
   */
  public static readonly NAME: string = 'boy';

  // Состояние персонажа
  private hasGuitar: boolean = false;
  private fireLit: boolean = false;

  /**
   * Создает контроллер для персонажа
   */
  constructor() {
    super(BoyController.NAME);

    this.state.data.defaultMix = 0.2;

    // Устанавливаем начальную анимацию
    this.state.setAnimation(0, BoyAnimation.IDLE, true);
  }

  /**
   * Обрабатывает завершение анимации для персонажа
   */
  protected override onAnimationComplete(animName: string): void {
    // После получения гитары переходим к соответствующей idle анимации
    if (animName === BoyAnimation.GUITAR_ON) {
      this.hasGuitar = true;
      this.updateIdleAnimation();
    }
  }

  /**
   * Обновляет idle-анимацию в зависимости от текущего состояния
   * @param trackIndex Индекс трека анимации
   */
  private updateIdleAnimation(trackIndex: number = 0): void {
    let animation: BoyAnimation;

    // Выбираем анимацию на основе комбинации состояний
    if (this.hasGuitar && this.fireLit) {
      animation = BoyAnimation.IDLE_GUITAR_FIRE;
    } else if (this.hasGuitar && !this.fireLit) {
      animation = BoyAnimation.IDLE_GUITAR;
    } else if (!this.hasGuitar && this.fireLit) {
      animation = BoyAnimation.IDLE_FIRE;
    } else {
      animation = BoyAnimation.IDLE;
    }

    // Устанавливаем соответствующую idle-анимацию
    this.state.setAnimation(trackIndex, animation, true);
  }

  /**
   * Дает гитару персонажу
   * @returns Promise, который разрешается, когда анимация получения гитары завершится
   */
  public giveGuitar(): Promise<void> {
    // Если у персонажа уже есть гитара, просто обновляем анимацию
    if (this.hasGuitar) {
      return Promise.resolve();
    }

    // Запускаем анимацию получения гитары
    return this.play(BoyAnimation.GUITAR_ON);
  }

  /**
   * Устанавливает состояние костра и обновляет анимацию
   * @param isLit Горит ли костер
   */
  public setFireState(isLit: boolean): void {
    // Если состояние не изменилось, ничего не делаем
    if (this.fireLit === isLit) {
      return;
    }

    this.fireLit = isLit;
    this.updateIdleAnimation();
  }

  /**
   * Получает текущее состояние персонажа
   * @returns Объект с информацией о текущем состоянии
   */
  public getState(): { hasGuitar: boolean; fireLit: boolean } {
    return {
      hasGuitar: this.hasGuitar,
      fireLit: this.fireLit,
    };
  }

  /**
   * Воспроизводит конкретную анимацию персонажа
   * @param animation Анимация из перечисления BoyAnimation
   * @param loop Должна ли анимация зацикливаться
   * @param trackIndex Индекс трека для анимации
   * @returns Promise, который разрешается по завершении анимации (если не зацикленная)
   */
  public playBoyAnimation(animation: BoyAnimation, loop: boolean = false, trackIndex: number = 0): Promise<void> {
    return this.play(animation, loop, trackIndex);
  }

  /**
   * Сбрасывает состояние персонажа к начальному
   */
  public reset(): void {
    this.hasGuitar = false;
    this.fireLit = false;
    this.state.setAnimation(0, BoyAnimation.IDLE, true);
  }
}
