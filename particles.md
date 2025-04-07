Спрайт для партикла 'sparks', настройки партикла - грузится через json как 'emitterSparks'

Я хочу чтобы ты реализовал класс MatchesEmitter, который будет должен управлять эмиттером.
Эмиттер должен перемещаться (жестко, без интерполяций) за спичкой. Класс нужно создать в отдельном одноимённом файле в папке 'miniGames'
В момент, когда мы ведём спичку (из класса MatchesGame, файл MatchesGame.ts) с оптимальной скоростью, нужно его активировать, а когда
скорость не оптимальна или игрок ведёт его за пределами области - переставать эмитить частицы (но уже созданные должны доиграть, т.е. нужно апдейтить эмиттер).

Его нужно класть на слот 'matches' спайна. Эмиттер нужно поворачивать в сторону противоположную движению спички.
Так-же в класс, управляющий эмиттером нужно передавать результат successTimer/SUCCESS_TIME
Это будет процент мощности эмиттера. Чем он больше, тем больше SpawnFrequency (от дефолтного значения из настроек эмиттера в json (0.030) до максимального 0.001).

Пример использования эмиттера:

```js
import { ParticleContainer, Particle, Texture } from 'pixi.js';

// Create a particle container with default options
const container = new ParticleContainer({
  // this is the default, but we show it here for clarity
  dynamicProperties: {
    position: true, // Allow dynamic position changes (default)
    scale: false, // Static scale for extra performance
    rotation: false, // Static rotation
    color: false, // Static color
  },
});

// Add particles
const texture = Texture.from('path/to/bunny.png');

for (let i = 0; i < 100000; ++i) {
  let particle = new Particle({
    texture,
    x: Math.random() * 800,
    y: Math.random() * 600,
  });

  container.addParticle(particle);
}

// Add container to the Pixi stage
app.stage.addChild(container);
```
