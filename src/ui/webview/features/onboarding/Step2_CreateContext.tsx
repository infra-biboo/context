import { Component, createSignal, Show, For } from 'solid-js';
import Button from '../../components/Button';

interface Step2CreateContextProps {
  onNext: (contextContent: string) => void;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const validateContextContent = (content: string): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  const trimmed = content.trim();
  
  // Validaciones de error (bloquean el envío)
  if (trimmed.length === 0) {
    result.errors.push('El contenido no puede estar vacío');
    result.isValid = false;
  }
  
  if (trimmed.length < 10) {
    result.errors.push('El contenido debe tener al menos 10 caracteres');
    result.isValid = false;
  }
  
  if (trimmed.length > 1000) {
    result.errors.push('El contenido no puede exceder 1000 caracteres');
    result.isValid = false;
  }
  
  // Validaciones de advertencia (no bloquean pero sugieren mejoras)
  if (trimmed.length < 30) {
    result.warnings.push('Contextos más detallados son más útiles');
  }
  
  if (!/[.!?]$/.test(trimmed)) {
    result.warnings.push('Considera terminar con puntuación');
  }
  
  if (trimmed.toLowerCase() === trimmed) {
    result.warnings.push('Considera usar mayúsculas apropiadas');
  }
  
  return result;
};

const Step2_CreateContext: Component<Step2CreateContextProps> = (props) => {
  const [content, setContent] = createSignal('');
  const [validation, setValidation] = createSignal<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });
  
  const handleInput = (e: InputEvent) => {
    const value = (e.currentTarget as HTMLTextAreaElement).value;
    setContent(value);
    setValidation(validateContextContent(value));
  };
  
  const handleSave = () => {
    const currentValidation = validateContextContent(content());
    setValidation(currentValidation);
    
    if (currentValidation.isValid) {
      props.onNext(content().trim());
    }
  };

  return (
    <div class="onboarding-step text-center">
      <h1 class="text-2xl font-bold mb-4">¡Perfecto! Ahora, capturemos tu primer contexto.</h1>
      <p class="mb-8">
        El contexto es cualquier información clave: una decisión importante, una conversación, un fragmento de código útil, etc.
      </p>
      <div class="form-group mb-4">
        <textarea
          class={`form-textarea w-full p-2 border rounded ${validation().errors.length > 0 ? 'border-red-500' : 'border-gray-300'}`}
          rows="4"
          value={content()}
          onInput={handleInput}
          placeholder="Ej: Se decidió usar SolidJS para el frontend por su rendimiento y reactividad granular."
        />
        
        <div class="text-right text-sm text-gray-500 mt-1">
          {content().trim().length}/1000 caracteres
        </div>
        
        <Show when={validation().errors.length > 0}>
          <div class="validation-errors mt-2">
            <For each={validation().errors}>
              {(error) => (
                <div class="text-red-500 text-sm">{error}</div>
              )}
            </For>
          </div>
        </Show>
        
        <Show when={validation().warnings.length > 0}>
          <div class="validation-warnings mt-2">
            <For each={validation().warnings}>
              {(warning) => (
                <div class="text-yellow-600 text-sm">Ὂ1 {warning}</div>
              )}
            </For>
          </div>
        </Show>
      </div>
      
      <Button
        variant="primary"
        size="large"
        onClick={handleSave}
        disabled={!validation().isValid}
      >
        Guardar Primer Contexto
      </Button>
    </div>
  );
};

export default Step2_CreateContext;
