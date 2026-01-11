import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  useMemoryRouter?: boolean;
}

/**
 * Custom render function that wraps components with required providers
 */
function customRender(
  ui: ReactElement,
  { route = '/', useMemoryRouter = true, ...renderOptions }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (useMemoryRouter) {
      return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
    }
    return <BrowserRouter>{children}</BrowserRouter>;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render with our custom version
export { customRender as render };
