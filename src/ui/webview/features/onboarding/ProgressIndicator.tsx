import { Component, For } from 'solid-js';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

const ProgressIndicator: Component<ProgressIndicatorProps> = (props) => {
  return (
    <div class="progress-indicator mb-8">
      <div class="progress-bar-container relative w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          class="progress-bar-fill absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
          style={{width: `${(props.currentStep / props.totalSteps) * 100}%`}}
        />
      </div>
      
      <div class="progress-steps flex justify-between items-center">
        <For each={props.stepTitles}>
          {(title, index) => (
            <div 
              class={`progress-step flex flex-col items-center ${
                index() + 1 === props.currentStep ? 'text-blue-500 font-semibold' : 
                index() + 1 < props.currentStep ? 'text-green-500' : 'text-gray-400'
              }`}
            >
              <div class={`step-number w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${
                index() + 1 === props.currentStep ? 'bg-blue-500 text-white' : 
                index() + 1 < props.currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {index() + 1}
              </div>
              <div class="step-title text-xs text-center max-w-16">{title}</div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

export default ProgressIndicator;