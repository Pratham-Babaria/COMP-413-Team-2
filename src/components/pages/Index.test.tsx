import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { MemoryRouter, useNavigate } from "react-router-dom";
import Index from "./Index";
import { signInWithEmailAndPassword } from "firebase/auth";

// Helper functions as boilerplate
export const mockFirebaseSignInSuccess = (mockUser: any = { email: "test@example.com", uid: "123" }) => {
  (signInWithEmailAndPassword as Mock).mockResolvedValue({ user: mockUser });
};

export const mockFirebaseSignInFailure = (errorCode: string = "auth/invalid-credential") => {
  (signInWithEmailAndPassword as Mock).mockRejectedValue({ code: errorCode });
};

// Mocks
vi.mock("firebase/auth", async () => ({
  signInWithEmailAndPassword: vi.fn(),
}));

vi.mock("../../firebase", () => ({ auth: {} }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const mockedNavigate = vi.fn();
const mockUsers = [
  { id: "1", username: "adminUser", role: "admin" },
  { id: "2", username: "docUser", role: "doctor" },
];

// run before testing
beforeEach(() => {
  vi.resetAllMocks();
  (useNavigate as unknown as Mock).mockReturnValue(mockedNavigate);
  
  vi.stubGlobal("fetch", vi.fn((url: string) => {
    if (url.includes("/users")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  }));

  vi.stubGlobal("localStorage", {
    getItem: vi.fn(),
    setItem: vi.fn(),
  });
});

describe("Login page basic testing", () => {

  // go to the index page -- run before every test
  const setup = () => render(<MemoryRouter><Index /></MemoryRouter>);

  it("navigates to signup page on Sign Up click", () => {
    setup();
    fireEvent.click(screen.getByText(/sign up/i));
    expect(mockedNavigate).toHaveBeenCalledWith("/signup");
  });

  it("renders logo and input fields", () => {
    setup();
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByText("Login as Admin")).toBeInTheDocument();
  });

  it("shows error modal if username/password are missing", async () => {
    setup();
    fireEvent.click(screen.getByText(/login as doctor/i));
    expect(await screen.findByText(/missing info/i)).toBeInTheDocument();
  });

  it("calls Firebase login with valid inputs", async () => {
    mockFirebaseSignInSuccess({ email: "adminUser" });

    setup();
    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "adminUser" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "pass123" },
    });

    fireEvent.click(screen.getByText(/login as admin/i));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "adminUser",
        "pass123"
      );
    });
  });


  it("navigates to /admin on successful admin login", async () => {
    mockFirebaseSignInSuccess({ email: "adminUser" });

    setup();
    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "adminUser" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "pass123" },
    });
    fireEvent.click(screen.getByText(/login as admin/i));

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith("/admin");
    });
  });


  it("navigates to /doctor on successful doctor login", async () => {
    mockFirebaseSignInSuccess({ email: "docUser" });

    setup();
    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "docUser" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "docPass" },
    });
    fireEvent.click(screen.getByText(/login as doctor/i));

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith("/doctor");
    });
  });


  it("shows invalid email error from Firebase", async () => {
    mockFirebaseSignInFailure("auth/invalid-email");

    setup();
    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "invalid@" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByText(/login as admin/i));

    expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument();
  });


  it("shows wrong credential error from Firebase", async () => {
    mockFirebaseSignInFailure("auth/invalid-credential");

    setup();
    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "wrongUser" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "wrongPass" },
    });
    fireEvent.click(screen.getByText(/login as doctor/i));

    expect(await screen.findByText(/incorrect username or password/i)).toBeInTheDocument();
  });
});