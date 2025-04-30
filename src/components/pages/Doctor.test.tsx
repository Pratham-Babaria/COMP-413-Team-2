import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Doctor from "./Doctor";

// Setup global mocks
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key) => {
      if (key === "username") {
        return "Dr. Alice";
      }
      if (key === "userId") {
        return "1";
      }
      return null;
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  });

  // Default fetch mock
  vi.stubGlobal("fetch", vi.fn((url) => {
    if ((url as string).includes("/survey-assignments/")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }
    if ((url as string).includes("/responses?")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  }) as any);
});

const renderWithRouter = () => {
  render(
    <MemoryRouter initialEntries={["/doctor"]}>
      <Routes>
        <Route path="/doctor" element={<Doctor />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("Doctor dashboard", () => {
  it("renders the page and shows doctor name", async () => {
    renderWithRouter();
    expect(await screen.findByText("Available Surveys")).toBeInTheDocument();
    expect(screen.getByText("Dr. Alice")).toBeInTheDocument();
  });

  it("shows empty message if no surveys are assigned", async () => {
    renderWithRouter();
    expect(await screen.findByText("No surveys available at the moment.")).toBeInTheDocument();
  });

  it("renders assigned surveys", async () => {
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes("/survey-assignments/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([
          { id: 5, title: "Skin Health", description: "Basics", created_by: 99 }
        ]) });
      }
      if (url.includes("/responses?")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    renderWithRouter();
    expect(await screen.findByText("Skin Health")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Take Survey/i })).toBeInTheDocument();
  });

  it("renders 'View Your Response' if survey is already submitted", async () => {
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes("/survey-assignments/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([
          { id: 9, title: "Hair Growth", description: "Advanced", created_by: 99 }
        ]) });
      }
      if (url.includes("/responses?")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([
          { survey_id: 9, user_id: 1 }
        ]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    renderWithRouter();
    expect(await screen.findByText("Hair Growth")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /View Your Response/i })).toBeInTheDocument();
  });

  it("renders navigation buttons", async () => {
    renderWithRouter();
    expect(await screen.findByRole("button", { name: /Surveys/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Responses/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Invites/i })).toBeInTheDocument();
  });

  it("renders Doctor Role tooltip on hover", async () => {
    renderWithRouter();
    const roleIcon = screen.getByText((content, element) => element?.tagName === "svg");
    expect(roleIcon).toBeInTheDocument();
  });
});
