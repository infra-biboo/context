import { Component } from 'solid-js';
import Button from '../../components/Button';
import { CheckCircle } from 'lucide-solid';

interface Step6FinalProps {
  onFinish: () => void;
}

const Step6_Final: Component<Step6FinalProps> = (props) => {
  return (
    <div class="onboarding-step text-center">
      <h1 class="text-2xl font-bold mb-4">¡Todo Listo y Capturando!</h1>
      <ul class="summary-list list-none p-0 mb-8">
        <li class="mb-2 flex items-center justify-center"><CheckCircle class="text-green-500 mr-2" /> <strong>Servidor Activado:</strong> Listo para Claude.</li>
        <li class="mb-2 flex items-center justify-center"><CheckCircle class="text-green-500 mr-2" /> <strong>Captura Automática Habilitada:</strong> Observando Git y archivos.</li>
        <li class="mb-2 flex items-center justify-center"><CheckCircle class="text-green-500 mr-2" /> <strong>Captura Inteligente "Eureka!" Lista:</strong> Esperando tu momento de inspiración.</li>
        <li class="mb-2 flex items-center justify-center"><CheckCircle class="text-green-500 mr-2" /> <strong>Contexto Centralizado:</strong> Preparado para tus notas manuales.</li>
      </ul>
      <p class="mb-8">
        Recuerda, tú tienes el control. Edita o elimina cualquier contexto en cualquier momento.
      </p>
      <Button variant="primary" size="large" onClick={props.onFinish}>
        Finalizar y Empezar a Trabajar
      </Button>
    </div>
  );
};

export default Step6_Final;
