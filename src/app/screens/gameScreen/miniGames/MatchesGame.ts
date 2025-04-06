import { AnimationState, Spine } from '@esotericsoftware/spine-pixi-v8';
import { Container } from 'pixi.js';
import gsap from 'gsap';

export class MatchesGame extends Container {
  private spine: Spine;
  private state: AnimationState;

  private prevX: number = 0;
  private prevY: number = 0;
  private mouseHold: boolean = false;

  private ready = false;

  private inCallBack: () => void;

  constructor(inCallBack: () => void) {
    super();

    this.inCallBack = inCallBack;

    // мини-игра, в которой игроку нужно зажечь спички о коробок.
    // анимации
    // in - появление
    // idle - постоянно
    // normal - обычное состояние спички (не фейл и не вин)
    // fail - когда спичка сломалась
    // win - спичка загорелась
    // out - уходим

    // match_move - кость, которую нужно двигать

    // Цель игры - "провести мышкой" с зажатой левой кнопкой по зажигательной области коробка
    // расстояние от 350 до 450 пикселей
    // при этом скорость движения мыши должна быть не меньше 100 пикселей в секунду и не больше 200 пикселей в секунду
    // если хотя бы одно из этих условий не выполняется, ready = false и проигрываем анимацию "fail"
    // ждём окончания этой анимации и после устанавливаем ready = true и запускаем анимацию "idle"
    // если всё ок, то запускаем анимацию "win" и ждём окончания этой анимации
    // после этого вызываем анимацию "out"

    // Пример управления костью
    /* const bone = this.spine.skeleton.findBone('match_move');
    if (bone) {
      bone.y = -150;
      gsap.to(bone, {
        duration: 1,
        ease: 'power1.out',
        x: 250,
        y: 150,
        onStart: () => {
          setTimeout(() => {
            this.state.setAnimation(2, 'fail', false); // анимация спички
          }, 1000);
        },
      });
    }
 */
    this.spine = Spine.from({ skeleton: 'matches.json', atlas: 'matches.atlas' });
    this.state = this.spine.state;

    this.listenerSetup();

    this.state.setAnimation(0, 'in'); // анимация появления
    this.state.setAnimation(1, 'normal'); // анимация спички

    this.addChild(this.spine);
  }

  private listenerSetup() {
    this.state.addListener({
      complete: (entry) => {
        if (entry.animation?.name === 'in') {
          this.inCallBack();
          this.ready = true;
          this.state.setAnimation(0, 'idle', true);
        }
      },
    });
  }

  public onDown(x: number, y: number) {
    if (!this.ready) return;

    this.mouseHold = true;
    this.prevX = x;
    this.prevY = y;
    // Начинаем водить спичку за мышкой.
  }

  public onUp(x: number, y: number) {
    if (!this.ready) return;

    this.mouseHold = false;
    // Отпускаем спичку.
  }

  public onMove(x: number, y: number) {
    if (!this.ready) return;

    if (!this.mouseHold) return;
    // Двигаем спичку за мышкой.

    this.prevX = x;
    this.prevY = y;
  }

  public update(dt: number) {
    this.spine.update(dt);

    if (!this.ready) return;
  }
}
