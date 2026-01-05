import { lazy } from 'react';

// Barrel export for all setting section components
export { OperationTemplatesSection } from './OperationTemplatesSection';
export { TeamSection } from './TeamSection';
export { TicketSection } from './TicketSection';
export { WorkflowRulesSection } from './WorkflowRulesSection';
export { LayoutSection } from './LayoutSection';

// Lazy-loaded versions for code splitting (optional performance optimization)
export const LazyOperationTemplatesSection = lazy(() =>
  import('./OperationTemplatesSection').then(m => ({ default: m.OperationTemplatesSection }))
);
export const LazyTeamSection = lazy(() =>
  import('./TeamSection').then(m => ({ default: m.TeamSection }))
);
export const LazyTicketSection = lazy(() =>
  import('./TicketSection').then(m => ({ default: m.TicketSection }))
);
export const LazyWorkflowRulesSection = lazy(() =>
  import('./WorkflowRulesSection').then(m => ({ default: m.WorkflowRulesSection }))
);
export const LazyLayoutSection = lazy(() =>
  import('./LayoutSection').then(m => ({ default: m.LayoutSection }))
);