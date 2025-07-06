import { Component } from 'solid-js';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

const LoadingSpinner: Component<LoadingSpinnerProps> = (props) => {
  const size = props.size || 'medium';
  
  return (
    <div class={`loading-spinner ${size}`}>
      <div class="spinner"></div>
      {props.text && <span class="loading-text">{props.text}</span>}
    </div>
  );
};

export default LoadingSpinner;