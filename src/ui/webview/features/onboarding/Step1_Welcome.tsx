import { Component, Show } from 'solid-js';
import { store, actions } from '../../core/store';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Rocket } from 'lucide-solid';

interface Step1Props {
  onNext: () => void;
}

const Step1_Welcome: Component<Step1Props> = (props) => {
  const handleActivate = () => {
    props.onNext();
  };
  
  const handleRetry = () => {
    actions.setError(null);
    props.onNext();
  };
  
  return (
    <div class="onboarding-step text-center">
      <h1 class="text-2xl font-bold mb-4">Bienvenido al Gestor de Contexto de Claude</h1>
      <p class="mb-8">
        Vamos a activar el motor de la extensión. Esto permite la comunicación segura con Claude y habilita la captura de contexto.
      </p>
      <div class="button-group">
        <Button
          variant="primary"
          size="large"
          onClick={handleActivate}
          disabled={store.ui.isLoading}
        >
          {store.ui.isLoading ? (
            <>
              <LoadingSpinner size="small" />
              Activando...
            </>
          ) : (
            <><Rocket class="mr-2" /> Activar Servidor MCP</>
          )}
        </Button>
      </div>
      <Show when={store.ui.errorMessage}>
        <div class="error-section mt-4">
          <div class="error-message text-red-500 mb-2">
            {store.ui.errorMessage}
          </div>
          <Button
            variant="secondary"
            size="medium"
            onClick={handleRetry}
          >
            Reintentar
          </Button>
        </div>
      </Show>
      <Show when={store.ui.successMessage && !store.ui.isLoading}>
        <div class="success-message mt-4 text-green-500">
          {store.ui.successMessage}
        </div>
      </Show>
    </div>
  );
};

export default Step1_Welcome;
