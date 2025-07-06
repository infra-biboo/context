import { Component, JSX } from 'solid-js';

interface ContentCardProps {
  title: string;
  icon?: string | JSX.Element;
  className?: string;
  children: JSX.Element;
}

const ContentCard: Component<ContentCardProps> = (props) => {
  return (
    <div class={`status-card ${props.className || ''}`}>
      <div class="status-card-header">
        {props.icon && <span class="status-card-icon">{props.icon}</span>}
        <h3 class="status-card-title">{props.title}</h3>
      </div>
      <div class="status-card-content">
        {props.children}
      </div>
    </div>
  );
};

export default ContentCard;
