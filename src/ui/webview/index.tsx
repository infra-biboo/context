/// <reference path="./types/globals.d.ts" />
import { render } from 'solid-js/web';
import App from './App';
import { appController } from './core/app-controller';

// Initialize the application controller once
appController.initialize();

render(() => <App />, document.body);
