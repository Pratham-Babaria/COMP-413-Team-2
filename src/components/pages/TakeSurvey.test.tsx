import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TakeSurvey from './TakeSurvey';

// run all mock stubs before running tests
beforeEach(() => {
  vi.resetAllMocks();

  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => '1'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  });

  vi.stubGlobal('GazeCloudAPI', {
    StartEyeTracking: vi.fn(),
    StopEyeTracking: vi.fn(),
    OnResult: vi.fn(),
  });

  vi.stubGlobal('fetch', vi.fn((url) => {
    if ((url as string).includes('/questions')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockQuestions) });
    }
    if ((url as string).includes('/surveys/1')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSurveyData) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  }) as any);

  // Force the image to report a visible bounding box
  Object.defineProperty(HTMLImageElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      top: 10,
      left: 10,
      bottom: 110,
      right: 110,
      toJSON: () => ''
    }),
  });
});

// to make sure eyetracking will work (not testing that the heatmap renders correctly)
vi.mock('heatmap.js', () => {
    return {
      default: {
        create: vi.fn(() => ({
          addData: vi.fn(),
          setData: vi.fn(),
          configure: vi.fn(),
        })),
      },
    };
});

const renderWithRouter = () => {
  render(
    <MemoryRouter initialEntries={['/survey/1']}>
      <Routes>
        <Route path="/survey/:surveyId" element={<TakeSurvey />} />
      </Routes>
    </MemoryRouter>
  );
};

const dismissCalibrationModal = async () => {
  const button = await screen.findByRole('button', { name: /begin survey/i });
  fireEvent.click(button);
  
};

const mockSurveyData = {
  id: 1,
  title: 'Mock Survey',
  description: 'This is a mock survey.',
  created_by: 1,
};

const mockQuestions = [
  {
    id: 101,
    survey_id: 1,
    question_text: 'What is your name?',
    question_type: 'short_answer',
  },
  {
    id: 102,
    survey_id: 1,
    question_text: 'Pick a date',
    question_type: 'date',
  },
  {
    id: 103,
    survey_id: 1,
    question_text: 'Choose',
    question_type: 'dropdown',
    options: ['A', 'B'],
  },
  {
    id: 104,
    survey_id: 1,
    question_text: 'Choose one',
    question_type: 'multiple_choice',
    options: ['X', 'Y'],
  },
  {
    id: 105,
    survey_id: 1,
    question_text: 'Image test',
    question_type: 'image',
    image_url: 'https://via.placeholder.com/150',
  }
];

describe('TakeSurvey component basic tests', () => {
  it('loads survey and displays questions after calibration', async () => {
    renderWithRouter();
    await dismissCalibrationModal();
    expect(await screen.findByText('Mock Survey')).toBeInTheDocument();
    expect(screen.getByText('What is your name?')).toBeInTheDocument();
  });

  it('handles short answer input change', async () => {
    renderWithRouter();
    await dismissCalibrationModal();
    const input = await screen.findByLabelText('What is your name?');
    fireEvent.change(input, { target: { value: 'Alice' } });
    expect(input).toHaveValue('Alice');
  });

  it('handles dropdown selection', async () => {
    renderWithRouter();
    await dismissCalibrationModal();
    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'A' } });
    expect(select).toHaveValue('A');
  });

  it('handles radio selection', async () => {
    renderWithRouter();
    await dismissCalibrationModal();
    const radio = await screen.findByDisplayValue('X');
    fireEvent.click(radio);
    expect(radio).toBeChecked();
  });

  it('submits answers and shows success modal', async () => {
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/responses?')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/responses')) {
        return Promise.resolve({ ok: true });
      }
      if (url.includes('/predict')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ result: 'success' }) });
      }
      if (url.includes('/questions')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockQuestions) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSurveyData) });
    });

    renderWithRouter();
    await dismissCalibrationModal();

    const submitButton = await screen.findByRole('button', { name: /submit survey/i });
    fireEvent.click(submitButton);
    expect(await screen.findByText('Survey Submitted!')).toBeInTheDocument();
  });
});

describe('TakeSurvey eye tracking basics', () => {
  it('renders start eye tracking button if image exists', async () => {
    renderWithRouter();
    await dismissCalibrationModal();
    
    const startBtn = await screen.findByRole('button', { name: /start eye tracking/i });
    expect(startBtn).toBeInTheDocument();
  });
  
//   it('renders stop eye tracking button after starting', async () => {
//     renderWithRouter();
//     await dismissCalibrationModal();
//     const startBtn = await screen.findByRole('button', { name: /start eye tracking/i });
//     fireEvent.click(startBtn);
//     const stopBtn = await screen.findByRole('button', { name: /stop eye tracking/i });
//     expect(stopBtn).toBeInTheDocument();
//   });
});
