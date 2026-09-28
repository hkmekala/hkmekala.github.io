import { render, screen } from '@testing-library/react';
import App from './App';

test('renders backend profile content', () => {
  render(<App />);
  expect(screen.getByText(/Harikrishna Mekala/i)).toBeInTheDocument();
  expect(screen.getByText(/Hi, there!/i)).toBeInTheDocument();
  expect(screen.getByText(/KeenAi Global/i)).toBeInTheDocument();
});
