import { Container, Texture } from 'pixi.js';
import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { FX, ParticleEmitter } from 'revolt-fx';

export class MatchesEmitter {
  private container: Container;
  private fx: FX;
  private emitter: ParticleEmitter | null = null;
  private matchesSpine: Spine;
  private power: number = 0; // Power percentage (0-1)
  private lastMoveDirection: { x: number; y: number } = { x: 0, y: 0 };
  
  private defaultFrequency: number = 0.030; // Default from emitterSparks.json
  private minFrequency: number = 0.001; // Max emission rate (smallest time between particles)
  
  constructor(matchesSpine: Spine) {
    this.matchesSpine = matchesSpine;
    this.container = new Container();
    
    // Добавляем контейнер к спичке
    this.matchesSpine.addChild(this.container);
    
    // Создаем экземпляр FX
    this.fx = new FX();
    
    // Загружаем конфигурацию
    this.initRevoltFX();
  }
  
  private async initRevoltFX() {
    try {
      // Используем уже загруженные ресурсы из бандла 'main'
      // Загружаем текстуру из ассетов
      const texture = Texture.from('sparks');
      
      // Создаем более простой JSON для RevoltFX
      const revoltConfig = {
        name: "default-bundle",
        type: "bundle",
        particleEmitters: [
          {
            name: "sparks-emitter",
            type: "cpu",
            enabled: true,
            blendMode: "add",
            duration: -1,
            emitFrequency: 0.03,
            emitDelay: 0,
            maxParticles: 1000,
            addAtBack: false,
            spawnType: "point",
            particleSettings: {
              textureFrame: "sparks", // Используем текстуру 'sparks'
              depthSorting: false,
              ttl: {
                isRandom: true,
                min: 0.15,
                max: 0.35
              },
              velocity: {
                isRandom: true,
                initial: {
                  min: 200,
                  max: 1000
                },
                target: {
                  min: 200,
                  max: 1000
                }
              },
              angle: {
                isRandom: true,
                min: 225,
                max: 320
              },
              angleDelta: {
                isRandom: true,
                min: 0,
                max: 20
              },
              startScale: 0.5,
              endScale: 1,
              startAlpha: 1,
              endAlpha: 0.31,
              startColor: "#8f2b07",
              endColor: "#ff1500"
            }
          }
        ],
        sequences: [],
        colorSeeds: ["#FFFFFF"]
      };
      
      // Инициализируем бандл с нашей конфигурацией
      this.fx.initBundle(revoltConfig);
      
      // Регистрируем текстуру
      // @ts-expect-error - Текстурный атлас может иметь другую структуру
      this.fx.registerTexture('sparks', texture);
      
      // Создаем эмиттер
      this.emitter = this.fx.getParticleEmitter('sparks-emitter');
      if (this.emitter) {
        // Инициализируем эмиттер в нашем контейнере
        this.emitter.init(this.container);
        // Не запускаем эмиттер сразу
        this.emitter.paused = true;
      } else {
        console.error("Could not create sparks-emitter");
      }
    } catch (error) {
      console.error("Error initializing RevoltFX:", error);
    }
  }

  // Set power level (0-1) and update frequency
  public setPower(power: number): void {
    this.power = Math.max(0, Math.min(1, power));

    // Adjust frequency based on power
    // Map power 0-1 to frequency defaultFrequency-minFrequency
    if (this.emitter) {
      const newFrequency = this.defaultFrequency - (this.defaultFrequency - this.minFrequency) * this.power;
      
      // В revolt-fx свойство может иметь другое название
      // Используем любой из способов установки значения
      try {
        // @ts-expect-error - Обходим проверку типа, поскольку RevoltFX может иметь другое имя свойства
        this.emitter.emitFrequency = newFrequency;
      } catch (e) {
        console.warn('Could not set emitFrequency directly', e);
      }
    }
  }

  // Start emitting
  public start(): void {
    if (this.emitter) {
      this.emitter.paused = false;
    }
  }

  // Stop emitting (but let existing particles finish)
  public stop(): void {
    if (this.emitter) {
      this.emitter.paused = true;
    }
  }

  // Set movement direction (to point particles in opposite direction)
  public setMoveDirection(x: number, y: number): void {
    if (x !== 0 || y !== 0) {
      this.lastMoveDirection.x = x;
      this.lastMoveDirection.y = y;
    }
  }

  // Update particles and emit new ones
  public update(dt: number): void {
    // Если эмиттер не готов, ничего не делаем
    if (!this.emitter) return;
    
    // Move the container to match the match_move bone position
    const bone = this.matchesSpine.skeleton.findBone('match_move');
    if (bone) {
      // Position the container at the bone position
      this.container.position.set(bone.worldX, bone.worldY);
      
      // If we have movement direction, orient the container opposite to the direction
      if (this.lastMoveDirection.x !== 0 || this.lastMoveDirection.y !== 0) {
        // Calculate angle based on movement direction
        const angle = Math.atan2(this.lastMoveDirection.y, this.lastMoveDirection.x);
        // Set the container rotation opposite to movement
        this.container.rotation = angle + Math.PI; // Add PI to flip 180 degrees
      }
    }
    
    // Update the FX system
    this.fx.update(dt);
  }
}