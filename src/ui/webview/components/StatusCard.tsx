import { Component } from 'solid-js';

interface StatusCardProps {
  title: string;
  value: string | number;
  icon?: string;
  className?: string;
}

const StatusCard: Component<StatusCardProps> = (props) => {
  return (
    <div class={`status-card ${props.className || ''}`}>
      <div class="status-card-header">
        {props.icon && <span class="status-card-icon">{props.icon}</span>}
        <h3 class="status-card-title">{props.title}</h3>
      </div>
      <div class="status-card-value">{props.value}</div>
    </div>
  );
};

export default StatusCard;