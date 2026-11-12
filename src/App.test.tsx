import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import App from './App';

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="location">{location.pathname}{location.search}</output><button onClick={() => navigate(-1)}>Back</button></>;
}
function open(path: string) {
  return render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /><LocationProbe /></MemoryRouter>);
}
beforeEach(() => {
  sessionStorage.clear();
  window.scrollTo = jest.fn();
  global.fetch = jest.fn();
});

test('internal navigation and browser history render the correct pages', async () => {
  open('/');
  fireEvent.click(screen.getByRole('link', { name: 'Creator login' }));
  expect(await screen.findByLabelText('EMAIL ADDRESS')).toBeInTheDocument();
  expect(screen.getByTestId('location')).toHaveTextContent('/login');
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/'));
});

test('protected page redirects to login and preserves the return path', async () => {
  open('/manage/community/neighbors');
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login?next=%2Fmanage%2Fcommunity%2Fneighbors'));
  expect(await screen.findByLabelText('PASSWORD')).toBeInTheDocument();
});

test('signing in navigates to the protected dashboard without reloading', async () => {
  (global.fetch as jest.Mock).mockImplementation((url: string) => Promise.resolve({
    ok: true, status: 200,
    json: async () => url.endsWith('/login') ? { token: 'test-token' } : { user: { name: 'Ada', email: 'ada@example.com' }, organizations: [] },
  }));
  open('/login?next=%2Fdashboard');
  fireEvent.change(screen.getByLabelText('EMAIL ADDRESS'), { target: { value: 'ada@example.com' } });
  fireEvent.change(screen.getByLabelText('PASSWORD'), { target: { value: 'test-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in →' }));
  expect(await screen.findByRole('heading', { name: 'My communities & groups' })).toBeInTheDocument();
  expect(screen.getByTestId('location').textContent).toBe('/dashboard');
  fireEvent.click(screen.getByRole('button', { name: /logout/i }));
  await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/'));
});

test('invitation parameters load the organization and independent join resets it', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
  open('/c/neighbors');
  fireEvent.click(await screen.findByRole('link', { name: 'Join independently' }));
  await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/join'));
  expect(screen.queryByText('This invitation link is unavailable.')).not.toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/organization/community/neighbors'));
});

test('unknown URLs show a not-found page', () => {
  open('/missing-page');
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
});
