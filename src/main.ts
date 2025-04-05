import { setEngine } from './app/getEngine';
// import { LoadScreen } from './app/screens/LoadScreen';
import { TestingScreen } from './app/screens/main/TestingScreen';
// import { LoadScreen } from './app/screens/LoadScreen';
import { userSettings } from './app/utils/userSettings';
import { CreationEngine } from './engine/engine';
import { initDevtools } from '@pixi/devtools';

export const SCREEN_WIDTH = 1920;
export const SCREEN_HEIGHT = 1080;

/**
 * Importing these modules will automatically register there plugins with the engine.
 */
import '@pixi/sound';
// import { setupVirtualInteraction } from './engine/interaction/VirtualInteraction';
// import "@esotericsoftware/spine-pixi-v8";

// TODO: Добавить игнор реакции на ПКМ
// TODO: Оптимизировать использование foreach

// Create a new creation engine instance
const engine = new CreationEngine();
setEngine(engine);

(async () => {
  // Initialize the creation engine instance
  await engine.init({
    background: '#1E1E1E',
    resizeOptions: {
      virtualWidth: SCREEN_WIDTH, // Фиксированное виртуальное разрешение по ширине
      virtualHeight: SCREEN_HEIGHT, // Фиксированное виртуальное разрешение по высоте
      letterbox: true, // Включаем режим letterbox
      letterboxColor: 0xffffff, // Цвет заглушек по бокам (совпадает с фоном)
    },
  });

  // TODO: временно отключаем, так как не работает корректно
  // setupVirtualInteraction(engine);

  // Initialize the user settings
  userSettings.init();

  initDevtools({ stage: engine.stage, renderer: engine.renderer });

  // Show the load screen
  // Нужно будет не забыть раскоментировать
  // await engine.navigation.showScreen(LoadScreen);

  // Show the main screen once the load screen is dismissed
  await engine.navigation.showScreen(TestingScreen);
})();
