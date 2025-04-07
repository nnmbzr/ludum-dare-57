// src/app/screens/game/controllers/GirlController.ts

import { SpineObjectController } from './SpineObjectController';

/**
 * Перечисление анимаций персонажа girl
 */
export enum GirlAnimation {
  IDLE = 'idle',
  IDLE_FIRE = 'idle_fire',
  IDLE_STICK_ON = 'idle_stik_on', // хммм... очепятка!
  IDLE_STICK = 'idle_stick',
}

export class GirlController extends SpineObjectController {
  /**
   * Статическое имя для создания и идентификации
   */
  public static readonly NAME: string = 'girl';

  // Состояние персонажа
  private hasStick: boolean = false;
  private fireLit: boolean = false;

  /**
   * Создает контроллер для персонажа girl
   */
  constructor() {
    super(GirlController.NAME);

    this.state.data.defaultMix = 0.2;

    // Устанавливаем начальную анимацию
    this.state.setAnimation(0, GirlAnimation.IDLE, true);
    this.spine.scale.set(0.5 * 0.8);
  }

  /**
   * Обрабатывает завершение анимации для персонажа
   */
  protected override onAnimationComplete(animName: string, entry: any): void {
    // После получения палки с маршмеллоу переходим к соответствующей idle анимации
    if (animName === GirlAnimation.IDLE_STICK_ON) {
      this.hasStick = true;
      this.state.setAnimation(entry.trackIndex, GirlAnimation.IDLE_STICK, true);
    }
  }

  /**
   * Обновляет idle-анимацию в зависимости от текущего состояния
   * @param trackIndex Индекс трека анимации
   */
  private updateIdleAnimation(trackIndex: number = 0): void {
    let animation: GirlAnimation;

    // Выбираем анимацию на основе комбинации состояний
    if (this.hasStick && this.fireLit) {
      animation = GirlAnimation.IDLE_STICK;
    } else if (!this.hasStick && this.fireLit) {
      animation = GirlAnimation.IDLE_FIRE;
    } else {
      animation = GirlAnimation.IDLE;
    }

    // Устанавливаем соответствующую idle-анимацию
    this.state.setAnimation(trackIndex, animation, true);
  }

  /**
   * Дает маршмеллоу персонажу (только если костер уже горит)
   * @returns Promise, который разрешается, когда анимация получения маршмеллоу завершится,
   *          или null, если костер не горит
   */
  public giveStick(): Promise<void> | null {
    // Если костер не горит, нельзя дать маршмеллоу
    if (!this.fireLit) {
      return null;
    }

    // Если у персонажа уже есть маршмеллоу, просто обновляем анимацию
    if (this.hasStick) {
      return Promise.resolve();
    }

    // Запускаем анимацию получения маршмеллоу
    return this.play(GirlAnimation.IDLE_STICK_ON);
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
  public getState(): { hasStick: boolean; fireLit: boolean } {
    return {
      hasStick: this.hasStick,
      fireLit: this.fireLit,
    };
  }

  /**
   * Проверяет, может ли персонаж получить маршмеллоу
   * @returns true, если костер горит и персонаж еще не имеет маршмеллоу
   */
  public canReceiveStick(): boolean {
    return this.fireLit && !this.hasStick;
  }

  /**
   * Воспроизводит конкретную анимацию персонажа
   * @param animation Анимация из перечисления GirlAnimation
   * @param loop Должна ли анимация зацикливаться
   * @param trackIndex Индекс трека для анимации
   * @returns Promise, который разрешается по завершении анимации (если не зацикленная)
   */
  public playGirlAnimation(animation: GirlAnimation, loop: boolean = false, trackIndex: number = 0): Promise<void> {
    return this.play(animation, loop, trackIndex);
  }

  /**
   * Сбрасывает состояние персонажа к начальному
   */
  public reset(): void {
    this.hasStick = false;
    this.fireLit = false;
    this.state.setAnimation(0, GirlAnimation.IDLE, true);
  }
}
