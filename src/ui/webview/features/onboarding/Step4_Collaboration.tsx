import { Component, createSignal, onMount } from 'solid-js';
import Button from '../../components/Button';
import type { CollaborationMode } from '../../core/types';
import { Users, User, GitBranch } from 'lucide-solid';

interface Step4CollaborationProps {
  onNext: (mode: CollaborationMode) => void;
}

const COLLABORATION_MODE_KEY = 'claude-context-onboarding-collaboration-mode';

const Step4_Collaboration: Component<Step4CollaborationProps> = (props) => {
  const [selectedMode, setSelectedMode] = createSignal<CollaborationMode>('collaborative');
  
  // Función para guardar selección
  const saveSelection = (mode: CollaborationMode) => {
    localStorage.setItem(COLLABORATION_MODE_KEY, mode);
  };
  
  // Función para cargar selección guardada
  const loadSavedSelection = (): CollaborationMode => {
    try {
      const saved = localStorage.getItem(COLLABORATION_MODE_KEY);
      if (saved && ['collaborative', 'individual', 'hierarchical'].includes(saved)) {
        return saved as CollaborationMode;
      }
    } catch (error) {
      console.error('Error loading collaboration mode selection:', error);
    }
    return 'collaborative'; // Default
  };
  
  // Cargar selección al montar componente
  onMount(() => {
    const savedMode = loadSavedSelection();
    setSelectedMode(savedMode);
  });
  
  // Manejar cambio de selección
  const handleModeChange = (mode: CollaborationMode) => {
    setSelectedMode(mode);
    saveSelection(mode);
  };

  return (
    <div class="onboarding-step text-center">
      <h1 class="text-2xl font-bold mb-4">Define su Estrategia de Colaboración</h1>
      <p class="mb-8">Ahora, decide cómo quieres que trabajen juntos.</p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div
          class={`mode-card p-4 border rounded cursor-pointer ${selectedMode() === 'collaborative' ? 'border-blue-500' : ''}`}
          onClick={() => handleModeChange('collaborative')}
        >
          <div class="text-2xl mb-2"><Users /></div>
          <div class="font-bold">Colaborativo (Recomendado)</div>
          <p class="text-sm">Todos los agentes activos opinan. Ideal para obtener múltiples perspectivas.</p>
        </div>
        <div
          class={`mode-card p-4 border rounded cursor-pointer ${selectedMode() === 'individual' ? 'border-blue-500' : ''}`}
          onClick={() => handleModeChange('individual')}
        >
          <div class="text-2xl mb-2"><User /></div>
          <div class="font-bold">Individual</div>
          <p class="text-sm">Claude elige al mejor especialista para la tarea.</p>
        </div>
        <div
          class={`mode-card p-4 border rounded cursor-pointer ${selectedMode() === 'hierarchical' ? 'border-blue-500' : ''}`}
          onClick={() => handleModeChange('hierarchical')}
        >
          <div class="text-2xl mb-2"><GitBranch /></div>
          <div class="font-bold">Jerárquico</div>
          <p class="text-sm">El Arquitecto lidera a los demás.</p>
        </div>
      </div>

      <Button variant="primary" size="large" onClick={() => props.onNext(selectedMode())}>
        Entendido, ¡muéstrame la magia!
      </Button>
    </div>
  );
};

export default Step4_Collaboration;
