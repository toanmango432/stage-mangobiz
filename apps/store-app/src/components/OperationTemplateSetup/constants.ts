/**
 * CSS styles for the OperationTemplateSetup component
 * These are injected via a style tag for scoped styling
 */
export const TEMPLATE_SETUP_STYLES = `
  @keyframes slideInUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-slideInUp {
    animation: slideInUp 0.3s ease-out forwards;
  }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.3); }
    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }
  .animate-pulse-green {
    animation: pulse 1.5s infinite;
  }
  .apple-scroll::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .apple-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .apple-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
  }
  .apple-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.2);
  }
  .apple-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
  }
  .template-card {
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .template-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
  }
  .template-card.suggested {
    border-color: #10B981;
    background-color: rgba(16, 185, 129, 0.05);
  }
  .template-card.selected {
    border-color: #10B981;
    background-color: rgba(16, 185, 129, 0.1);
  }
  .template-card.suggested::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 0.75rem;
    background: linear-gradient(45deg, #10B981, #3B82F6, #EC4899, #F97316);
    z-index: -1;
    opacity: 0.5;
    animation: border-glow 3s ease-in-out infinite;
  }
  @keyframes border-glow {
    0% { opacity: 0.3; }
    50% { opacity: 0.7; }
    100% { opacity: 0.3; }
  }
  .answer-option {
    transition: all 0.2s ease;
    border-width: 1px;
    border-color: #e5e7eb;
  }
  .answer-option:hover {
    border-color: #d1d5db;
    background-color: #f9fafb;
  }
  .answer-option.selected {
    border-color: #10B981;
    background-color: rgba(16, 185, 129, 0.05);
  }
  .swipe-indicator {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-top: 16px;
  }
  .swipe-indicator div {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #e5e7eb;
    transition: all 0.2s ease;
  }
  .swipe-indicator div.active {
    background-color: #10B981;
    width: 24px;
    border-radius: 4px;
  }
  .section-preview {
    position: relative;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
    border-radius: 0.375rem;
    overflow: hidden;
  }
  .section-preview-header {
    padding: 0.375rem 0.5rem;
    font-size: 0.7rem;
    font-weight: 500;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  .section-preview-content {
    padding: 0.5rem;
  }
  .section-preview-card {
    margin-bottom: 0.375rem;
    padding: 0.375rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.65rem;
    font-weight: 500;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  .appointments-rail {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.375rem 0.5rem;
    font-size: 0.65rem;
    font-weight: 500;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .settings-panel {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
  }
  .settings-panel.expanded {
    max-height: 500px;
    transition: max-height 0.5s ease-in;
  }
  .step-indicator {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #10B981;
    color: white;
    font-size: 12px;
    font-weight: 600;
    margin-right: 10px;
  }
  .question-card {
    transition: all 0.3s ease;
    border: 1px solid #f0f0f0;
  }
  .question-card.answered {
    opacity: 0.85;
  }
`;

/**
 * Toast notification display duration in milliseconds
 */
export const TOAST_DISPLAY_DURATION = 3000;

/**
 * Scroll delay for auto-scrolling between questions (ms)
 */
export const SCROLL_DELAY = 300;

/**
 * Mobile breakpoint width in pixels
 */
export const MOBILE_BREAKPOINT = 768;
