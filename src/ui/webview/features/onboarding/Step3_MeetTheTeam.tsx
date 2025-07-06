import { Component, For, Show, createSignal, onMount } from 'solid-js';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { store } from '../../core/store';
import { appController } from '../../core/app-controller';
import { Building, Code, Paintbrush, User } from 'lucide-solid';

interface Step3MeetTheTeamProps {
  onNext: () => void;
}

const Step3_MeetTheTeam: Component<Step3MeetTheTeamProps> = (props) => {
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  
  onMount(async () => {
    try {
      // Los agentes se cargan de forma asíncrona, no bloqueamos el onboarding
      // Si no están disponibles, mostramos un estado de carga
      if (!store.data?.agents || store.data.agents.length === 0) {
        // Lanzar carga en background sin bloquear
        appController.requestInitialData().catch(err => {
          const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
          setError(`Error al cargar agentes: ${errorMessage}`);
          console.error('Failed to load agents in Step3:', err);
        });
      } else {
        setIsLoading(false);
      }
      
      // Después de un tiempo razonable, terminar loading aunque no tengamos datos
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al cargar agentes: ${errorMessage}`);
      setIsLoading(false);
      console.error('Failed to load agents in Step3:', err);
    }
  });
  
  const getDisplayAgents = () => {
    return store.data?.agents?.slice(0, 3) || [];
  };
  
  const getAgentIcon = (agentName: string) => {
    switch (agentName) {
      case 'Architect':
        return <Building />;
      case 'Backend':
        return <Code />;
      case 'Frontend':
        return <Paintbrush />;
      default:
        return <User />;
    }
  };
  
  return (
    <div class="onboarding-step text-center">
      <h1 class="text-2xl font-bold mb-4">Conoce a tu Equipo de Expertos de IA</h1>
      <p class="mb-8">
        No tienes un solo asistente, tienes un equipo. Estos son tus agentes iniciales. Puedes activarlos o desactivarlos según tus necesidades.
      </p>
      <Show when={isLoading()}>
        <div class="loading-section mb-8 text-center">
          <LoadingSpinner size="large" />
          <p class="mt-4">Cargando tu equipo de agentes...</p>
        </div>
      </Show>
      
      <Show when={error()}>
        <div class="error-section mb-8 text-center">
          <div class="text-red-500 mb-4">{error()}</div>
          <button 
            class="btn btn-secondary"
            onClick={() => {
              setError(null);
              setIsLoading(true);
              appController.requestInitialData().then(() => {
                setIsLoading(false);
              }).catch((err) => {
                setError(err instanceof Error ? err.message : 'Error al cargar agentes');
                setIsLoading(false);
              });
            }}
          >
            Reintentar
          </button>
        </div>
      </Show>
      
      <Show when={!isLoading() && !error()}>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <For each={getDisplayAgents()}>
            {(agent) => (
              <div class="agent-card p-4 border rounded">
                <div class="text-2xl mb-2">
                  {getAgentIcon(agent.name)}
                </div>
                <div class="font-bold">{agent.name}</div>
                <p class="text-sm">{agent.description}</p>
                <div class="status-indicator active">
                  Activo
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
      <p class="mb-8">
        Más adelante, en la pestaña 'Agentes', podrás <strong>crear tus propios agentes personalizados</strong>.
      </p>
      <Show when={!isLoading() && !error()}>
        <Button variant="primary" size="large" onClick={props.onNext}>
          Siguiente: Elige cómo colaboran
        </Button>
      </Show>
    </div>
  );
};

export default Step3_MeetTheTeam;
