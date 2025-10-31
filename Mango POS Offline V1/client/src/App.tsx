import { Provider } from 'react-redux';
import { store } from './store';
import { AppShell } from './components/layout/AppShell';

export function App() {
  return (
    <Provider store={store}>
      <AppShell />
    </Provider>
  );
}