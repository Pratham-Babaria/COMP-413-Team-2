import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DoctorResponses from './DoctorResponses';

beforeEach(() => {
  vi.resetAllMocks();

  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key) => {
      if (key === 'userId') return '1';
      return null;
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  });

  vi.stubGlobal('fetch', vi.fn((url) => {
    if ((url as string).includes('/surveys/')) {
      if ((url as string).endsWith('/questions')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([
          { id: 1, question_text: 'Question 1', question_type: 'short_answer' },
          { id: 2, question_text: 'Image Q', question_type: 'image', image_url: 'http://example.com/image.png' }
        ]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ title: 'Test Survey' }) });
    }

    if ((url as string).includes('/responses?')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([
        { id: 1, survey_id: 123, user_id: 1, question_id: 1, response_text: 'My answer' },
        { id: 2, survey_id: 123, user_id: 1, question_id: 2, response_text: 'Seen image' }
      ]) });
    }

    if ((url as string).includes('/gaze_data')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([
        { gaze_x: 10, gaze_y: 20, image_width: 100, image_height: 100, timestamp: 1 },
        { gaze_x: 30, gaze_y: 40, image_width: 100, image_height: 100, timestamp: 2 }
      ]) });
    }

    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  }) as any);
});

const renderComponent = () => {
  render(
    <MemoryRouter initialEntries={["/doctor/surveys/123"]}>
      <Routes>
        <Route path="/doctor/surveys/:surveyId" element={<DoctorResponses />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('DoctorResponses component', () => {
  it('renders survey title', async () => {
    renderComponent();
    expect(await screen.findByText(/My Responses for Test Survey/i)).toBeInTheDocument();
  });

  it('displays all questions', async () => {
    renderComponent();
    expect(await screen.findByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Image Q')).toBeInTheDocument();
  });

  it('renders response text as readonly', async () => {
    renderComponent();
    expect(await screen.findByDisplayValue('My answer')).toBeInTheDocument();
  });

  it('displays image for image question', async () => {
    renderComponent();
    const img = await screen.findByAltText('Question');
    expect(img).toHaveAttribute('src', 'http://example.com/image.png');
  });
});
