import { Component, JSX } from 'solid-js';

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  children: JSX.Element;
}

const Button: Component<ButtonProps> = (props) => {
  const variant = props.variant || 'primary';
  const size = props.size || 'medium';
  
  return (
    <button 
      class={`btn btn-${variant} btn-${size}`}
      onClick={props.onClick}
      disabled={props.disabled}
      type={props.type || 'button'}
    >
      {props.children}
    </button>
  );
};

export default Button;