import { Component } from 'solid-js';
import Button from '../../components/Button';
import { GitCommit, File, Lightbulb, Book } from 'lucide-solid';

interface Step5CaptureModesProps {
  onNext: () => void;
}

const Step5_CaptureModes: Component<Step5CaptureModesProps> = (props) => {
  return (
    <div class="onboarding-step text-center">
      <h1 class="text-2xl font-bold mb-4">Tres Formas de Construir la Memoria de tu Proyecto</h1>
      <p class="mb-8">
        Tu extensión te ofrece múltiples maneras de capturar conocimiento, desde lo automático hasta lo inteligente.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="capture-mode-card p-4 border rounded">
          <div class="text-2xl mb-2"><GitCommit /><File /></div>
          <div class="font-bold">La Captura Automática (El Observador)</div>
          <p class="text-sm">
            La extensión observa tus <strong>commits de Git</strong> y <strong>cambios en archivos</strong> importantes, guardándolos automáticamente.
          </p>
        </div>
        <div class="capture-mode-card p-4 border rounded">
          <div class="text-2xl mb-2"><Lightbulb /></div>
          <div class="font-bold">La Captura Inteligente (El Momento "Eureka!")</div>
          <p class="text-sm">
            Cuando llegues a una conclusión clave en tu chat con Claude, simplemente escribe la palabra mágica: <strong>`Eureka!`</strong>
          </p>
          <p class="text-xs mt-2">
            Claude <strong>analizará la conversación reciente, generará un resumen inteligente</strong> de la decisión o el hallazgo, y lo guardará como un nuevo contexto. No es una simple copia, es conocimiento destilado.
          </p>
        </div>
        <div class="capture-mode-card p-4 border rounded">
          <div class="text-2xl mb-2"><Book /></div>
          <div class="font-bold">La Captura Manual (El Cerebro Central)</div>
          <p class="text-sm">
            Usa el formulario de 'Crear Contexto' para centralizar conocimiento desde <strong>cualquier otra fuente</strong>: una conversación con <strong>Gemini</strong>, un chat de <strong>Slack</strong>, notas de una reunión, etc.
          </p>
        </div>
      </div>

      <Button variant="primary" size="large" onClick={props.onNext}>
        Entendido. ¡Activar todo y finalizar!
      </Button>
    </div>
  );
};

export default Step5_CaptureModes;
