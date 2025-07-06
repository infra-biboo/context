import { Component, createSignal, Show, onMount } from 'solid-js';
import { store, actions } from '../../core/store';
import { appController } from '../../core/app-controller';
import Button from '../../components/Button';
import Step1_Welcome from './Step1_Welcome';
import Step2_CreateContext from './Step2_CreateContext';
import Step3_MeetTheTeam from './Step3_MeetTheTeam';
import Step4_Collaboration from './Step4_Collaboration';
import Step5_CaptureModes from './Step5_CaptureModes';
import Step6_Final from './Step6_Final';
import ProgressIndicator from './ProgressIndicator';
import type { CollaborationMode } from '../../core/types';

const ONBOARDING_PROGRESS_KEY = 'claude-context-onboarding-progress';

const OnboardingWizard: Component = () => {
  const [step, setStep] = createSignal(1);
  
  // Función para guardar progreso
  const saveProgress = (currentStep: number) => {
    const progress = {
      step: currentStep,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify(progress));
  };
  
  // Función para cargar progreso guardado
  const loadSavedProgress = (): number => {
    try {
      const saved = localStorage.getItem(ONBOARDING_PROGRESS_KEY);
      if (saved) {
        const progress = JSON.parse(saved);
        return progress.step || 1;
      }
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    }
    return 1;
  };
  
  // Función para limpiar progreso
  const clearProgress = () => {
    localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
  };
  
  const STEP_TITLES = [
    'Activar Servidor',
    'Crear Contexto',
    'Conocer Equipo',
    'Configurar Colaboración',
    'Modos de Captura',
    'Finalizar'
  ];

  const handleActivateServer = async () => {
    if (store.session?.mcpStatus?.connected) {
      actions.setSuccess('¡Servidor ya está activo!');
      setTimeout(() => {
        actions.setSuccess(null);
        const newStep = 2;
        setStep(newStep);
        saveProgress(newStep);
      }, 1500);
      return;
    }

    try {
      actions.setLoading(true);
      await appController.startMcpServer();
      actions.setSuccess('¡Servidor activado con éxito!');
      setTimeout(() => {
        actions.setSuccess(null);
        const newStep = 2;
        setStep(newStep);
        saveProgress(newStep);
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const contextualMessage = `Error al activar servidor (Paso 1): ${errorMessage}`;
      actions.setError(contextualMessage);
      console.error('OnboardingWizard - Failed to start MCP server:', error);
    } finally {
      actions.setLoading(false);
    }
  };

  const handleCreateContext = async (contextContent: string) => {
    try {
      actions.setLoading(true);
      await appController.createCustomContext({
        content: contextContent,
        type: 'decision',
        importance: 5,
        tags: ['first-context'],
        projectPath: 'onboarding',
      });
      actions.setSuccess('¡Contexto creado exitosamente!');
      setTimeout(() => {
        actions.setSuccess(null);
        const newStep = 3;
        setStep(newStep);
        saveProgress(newStep);
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const contextualMessage = `Error al crear contexto (Paso 2): ${errorMessage}`;
      actions.setError(contextualMessage);
      console.error('OnboardingWizard - Failed to create context:', error);
    } finally {
      actions.setLoading(false);
    }
  };

  const handleMeetTheTeam = () => {
    const newStep = 4;
    setStep(newStep);
    saveProgress(newStep);
  };

  const handleCollaboration = async (mode: CollaborationMode) => {
    try {
      actions.setLoading(true);
      await appController.setCollaborationMode(mode);
      actions.setSuccess('¡Modo de colaboración configurado!');
      setTimeout(() => {
        actions.setSuccess(null);
        const newStep = 5;
        setStep(newStep);
        saveProgress(newStep);
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const contextualMessage = `Error al configurar colaboración (Paso 4): ${errorMessage}`;
      actions.setError(contextualMessage);
      console.error('OnboardingWizard - Failed to set collaboration mode:', error);
    } finally {
      actions.setLoading(false);
    }
  };

  const handleCaptureModes = () => {
    const newStep = 6;
    setStep(newStep);
    saveProgress(newStep);
  };

  const handleFinish = async () => {
    try {
      // Marcar onboarding como completado con todos los pasos
      if (appController.completeOnboarding) {
        await appController.completeOnboarding();
      }
      
      // Guardar métricas de completación
      const completionData = {
        completed: true,
        completedAt: new Date().toISOString(),
        stepsCompleted: 6,
        serverActivated: store.session?.mcpStatus?.connected || false,
        contextCreated: true,
        collaborationModeSet: true
      };
      
      localStorage.setItem('claude-context-onboarding-data', JSON.stringify(completionData));
      localStorage.setItem('claude-context-onboarding-completed', 'true');
      
      actions.setOnboardingCompleted(true);
      actions.setSuccess('¡Onboarding completado exitosamente! Todas las funciones están activadas.');
      
      // Limpiar progreso al completar
      clearProgress();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const contextualMessage = `Error al completar onboarding (Paso final): ${errorMessage}`;
      actions.setError(contextualMessage);
      console.error('OnboardingWizard - Failed to complete onboarding:', error);
    }
  };

  const handleSkip = () => {
    try {
      // Marcar como saltado con advertencias
      const skipData = {
        completed: false,
        skipped: true,
        skippedAt: new Date().toISOString(),
        currentStep: step(),
        serverActivated: store.session?.mcpStatus?.connected || false,
        contextCreated: false,
        collaborationModeSet: false
      };
      
      localStorage.setItem('claude-context-onboarding-data', JSON.stringify(skipData));
      localStorage.setItem('claude-context-onboarding-completed', 'true');
      
      // Limpiar progreso al saltar
      clearProgress();
      
      // Marcar como completado en el store (esto debería cerrar el onboarding)
      actions.setOnboardingCompleted(true);
      
      console.log('Onboarding skipped successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const contextualMessage = `Error al saltar tutorial: ${errorMessage}`;
      actions.setError(contextualMessage);
      console.error('OnboardingWizard - Failed to skip tutorial:', error);
    }
  };

  onMount(() => {
    // TEMPORAL: Limpiar localStorage para evitar estado previo SOLO si no estamos en modo development
    if (!localStorage.getItem('claude-context-onboarding-completed')) {
      localStorage.removeItem('claude-context-onboarding-data');
      
      // Actualizar el estado del store para reflejar que onboarding NO está completado
      actions.setOnboardingCompleted(false);
      
      // Cargar progreso guardado
      const savedStep = loadSavedProgress();
      if (savedStep > 1) {
        setStep(savedStep);
        console.log(`Onboarding resumed from step ${savedStep}`);
      }
    }
  });

  // No necesitamos esperar por store.session para mostrar el onboarding
  // El onboarding puede iniciarse inmediatamente

  return (
    <div class="onboarding-container">
      <ProgressIndicator 
        currentStep={step()} 
        totalSteps={6} 
        stepTitles={STEP_TITLES} 
      />
      <Show when={step() >= 1}>
        <div class="onboarding-skip">
          <Button variant="secondary" size="small" onClick={handleSkip}>
            Skip Tutorial
          </Button>
        </div>
      </Show>
      <Show when={step() === 1}>
        <Step1_Welcome onNext={handleActivateServer} />
      </Show>
      <Show when={step() === 2}>
        <Step2_CreateContext onNext={handleCreateContext} />
      </Show>
      <Show when={step() === 3}>
        <Step3_MeetTheTeam onNext={handleMeetTheTeam} />
      </Show>
      <Show when={step() === 4}>
        <Step4_Collaboration onNext={handleCollaboration} />
      </Show>
      <Show when={step() === 5}>
        <Step5_CaptureModes onNext={handleCaptureModes} />
      </Show>
      <Show when={step() === 6}>
        <Step6_Final onFinish={handleFinish} />
      </Show>
    </div>
  );
};

export default OnboardingWizard;
