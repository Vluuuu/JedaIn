import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button, Dialog } from "../../components/ui";
import { LOGIN_ATMOSPHERE_VISUAL } from "../../lib/assets/packageImages";
import { sessionStore } from "../onboarding/sessionStore";
import { GoogleIcon } from "./GoogleIcon";
import { defaultAuthAdapter } from "./mockAdapter";
import { getAuthRedirectPath } from "./routing";
import {
  AuthError,
  type AuthAdapter,
  type AuthMethod,
  type AuthState,
  type AuthUser,
} from "./types";
import "./auth.css";

export interface TravelerLoginScreenProps {
  adapter?: AuthAdapter;
  onSuccess?: (user: AuthUser, redirectPath: string) => void;
  enableEmailAuth?: boolean;
}

export function TravelerLoginScreen({
  adapter = defaultAuthAdapter,
  onSuccess,
}: TravelerLoginScreenProps) {
  const navigate = useNavigate();

  const [tabMode, setTabMode] = useState<"SIGN_IN" | "SIGN_UP">("SIGN_IN");
  const [, setAuthState] = useState<AuthState>("IDLE");
  const [activeMethod, setActiveMethod] = useState<AuthMethod>(null);

  // Form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Errors
  const [authError, setAuthError] = useState<string | undefined>();

  // Modals for Forgot Password & Legal
  const [modalState, setModalState] = useState<
    "forgot_password" | "terms" | "privacy" | null
  >(null);

  const isAnyLoading = activeMethod !== null;

  const handleTabChange = (mode: "SIGN_IN" | "SIGN_UP") => {
    setTabMode(mode);
    setAuthError(undefined);
  };

  const handleAuthSuccess = (user: AuthUser) => {
    sessionStore.setUser(user);
    setActiveMethod(null);
    setAuthState("IDLE");
    const redirectPath = getAuthRedirectPath({
      isNewUser: user.isNewUser,
      onboardingStatus: user.onboardingStatus,
    });

    if (onSuccess) {
      onSuccess(user, redirectPath);
    } else {
      navigate(redirectPath);
    }
  };

  const handleGoogleLogin = async () => {
    if (isAnyLoading) return;
    setAuthError(undefined);
    setActiveMethod("GOOGLE");
    setAuthState("AUTHENTICATING");

    try {
      const user = await adapter.loginWithGoogle();
      handleAuthSuccess(user);
    } catch (err: unknown) {
      setActiveMethod(null);
      if (err instanceof AuthError && err.code === "CANCELLED") {
        setAuthState("IDLE");
      } else {
        setAuthState("ERROR");
        setAuthError(
          err instanceof Error ? err.message : "Failed to sign in with Google.",
        );
      }
    }
  };

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isAnyLoading) return;

    const formData = new FormData(e.currentTarget);
    const formName = (
      (formData.get("name") as string | null) ||
      name ||
      ""
    ).trim();
    const formEmail = (
      (formData.get("email") as string | null) ||
      email ||
      ""
    ).trim();
    const formPassword = (
      (formData.get("password") as string | null) ||
      password ||
      ""
    ).trim();
    const formConfirmPassword = (
      (formData.get("confirmPassword") as string | null) ||
      confirmPassword ||
      ""
    ).trim();

    if (tabMode === "SIGN_UP" && formPassword !== formConfirmPassword) {
      setAuthError("Password and Confirm Password do not match.");
      return;
    }

    setAuthError(undefined);
    setActiveMethod("PASSWORD");
    setAuthState("AUTHENTICATING");

    try {
      let user: AuthUser;
      if (tabMode === "SIGN_IN") {
        if (adapter.loginWithPassword) {
          user = await adapter.loginWithPassword(formEmail, formPassword);
        } else {
          // fallback mock signin
          user = {
            id: `usr_${Date.now()}`,
            name: formEmail.split("@")[0] || "Traveler",
            email: formEmail,
            isNewUser: false,
            onboardingStatus: "COMPLETED",
          };
        }
      } else {
        if (adapter.signupWithPassword) {
          user = await adapter.signupWithPassword(
            formEmail,
            formPassword,
            formName || undefined,
          );
        } else {
          // fallback mock signup
          user = {
            id: `usr_${Date.now()}`,
            name: formName || formEmail.split("@")[0] || "Traveler",
            email: formEmail,
            isNewUser: true,
            onboardingStatus: "NOT_STARTED",
          };
        }
      }
      handleAuthSuccess(user);
    } catch (err: unknown) {
      setActiveMethod(null);
      setAuthState("ERROR");
      setAuthError(
        err instanceof Error
          ? err.message
          : tabMode === "SIGN_IN"
            ? "Sign in failed. Please check your credentials."
            : "Sign up failed. Please check your details.",
      );
    }
  };

  return (
    <div className="auth-screen">
      {/* Full-Screen Immersive Nature Backdrop */}
      <div className="auth-screen__backdrop" aria-hidden="true">
        <img
          src={LOGIN_ATMOSPHERE_VISUAL.svgDataUri}
          alt=""
          className="auth-screen__backdrop-image"
          loading="eager"
          width="1000"
          height="800"
        />
        <div className="auth-screen__backdrop-scrim" />
        <div className="auth-screen__backdrop-grain" />
      </div>

      {/* Floating Viewport Container */}
      <div className="auth-screen__container">
        {/* Subtle return home link outside card */}
        <header className="auth-screen__topbar">
          <Link
            to="/"
            className="auth-back-action"
            aria-label="Kembali ke halaman awal"
          >
            <svg
              viewBox="0 0 20 20"
              width="16"
              height="16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Kembali ke Beranda</span>
          </Link>
        </header>

        {/* Centered Floating Dark Forest Glass Card */}
        <main className="auth-card" aria-label="Sign in to JedaIn">
          {/* 1. Small JedaIn brand mark / symbol */}
          <div className="auth-card__brand">
            <Link to="/" aria-label="JedaIn Brand Mark">
              <svg
                width="38"
                height="38"
                viewBox="250 220 270 330"
                className="auth-card__mark"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="markGrad"
                    x1="0%"
                    y1="30%"
                    x2="100%"
                    y2="70%"
                  >
                    <stop offset="0%" stopColor="#A7C98B" />
                    <stop offset="50%" stopColor="#86AF84" />
                    <stop offset="100%" stopColor="#4A8F8F" />
                  </linearGradient>
                </defs>
                <path
                  d="M 428 259 L 424 261 L 413 263 L 390 273 L 388 275 L 384 276 L 369 284 L 367 284 L 348 295 L 336 304 L 331 306 L 313 320 L 297 335 L 287 347 L 275 365 L 273 371 L 267 381 L 263 392 L 260 413 L 259 414 L 259 423 L 258 424 L 259 425 L 258 429 L 259 430 L 259 443 L 262 454 L 263 466 L 268 487 L 270 506 L 271 507 L 269 527 L 264 539 L 264 542 L 266 544 L 265 545 L 262 544 L 261 546 L 277 543 L 293 538 L 301 534 L 304 534 L 333 519 L 350 506 L 362 494 L 371 482 L 381 462 L 381 459 L 384 453 L 388 437 L 389 400 L 388 399 L 388 388 L 387 387 L 387 376 L 386 375 L 386 352 L 387 351 L 388 330 L 391 321 L 391 317 L 403 290 L 413 276 Z M 371 303 L 372 304 L 371 308 L 366 317 L 361 331 L 360 342 L 358 349 L 358 358 L 357 359 L 357 368 L 358 370 L 357 375 L 358 376 L 359 409 L 360 411 L 359 412 L 359 428 L 355 449 L 349 465 L 338 485 L 326 500 L 315 511 L 303 520 L 302 517 L 314 505 L 324 490 L 329 480 L 336 458 L 336 453 L 338 446 L 338 437 L 339 436 L 338 434 L 339 432 L 338 395 L 337 394 L 337 362 L 338 361 L 338 349 L 337 347 L 333 349 L 326 356 L 317 370 L 313 374 L 304 393 L 297 416 L 297 423 L 295 431 L 295 456 L 294 457 L 292 456 L 290 446 L 290 438 L 289 437 L 289 410 L 290 409 L 290 402 L 292 393 L 302 368 L 309 357 L 322 341 L 335 328 L 352 314 L 364 306 Z"
                  fill="url(#markGrad)"
                />
                <path
                  d="M 516 224 L 512 224 L 505 228 L 488 234 L 483 238 L 477 240 L 458 253 L 447 262 L 434 276 L 420 298 L 414 314 L 410 335 L 409 355 L 411 365 L 411 391 L 412 392 L 411 410 L 412 412 L 411 413 L 410 432 L 406 452 L 420 444 L 439 428 L 454 411 L 464 395 L 470 382 L 477 361 L 478 350 L 480 343 L 481 315 L 482 314 L 484 315 L 484 320 L 486 325 L 486 333 L 487 334 L 486 336 L 487 338 L 487 362 L 486 363 L 485 374 L 480 387 L 480 390 L 471 409 L 455 431 L 436 450 L 431 453 L 425 459 L 410 469 L 393 478 L 383 491 L 368 506 L 385 501 L 391 497 L 393 497 L 407 489 L 417 485 L 446 467 L 452 461 L 466 451 L 481 436 L 494 419 L 502 406 L 502 404 L 509 391 L 513 379 L 516 364 L 516 356 L 517 355 L 516 325 L 515 324 L 514 312 L 510 301 L 507 286 L 506 271 L 505 270 L 506 245 L 509 236 Z"
                  fill="url(#markGrad)"
                />
              </svg>
            </Link>
          </div>

          {/* 2. SIGN IN / SIGN UP Underline Tabs */}
          <div
            className="auth-tabs"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              type="button"
              role="tab"
              id="tab-sign-in"
              aria-selected={tabMode === "SIGN_IN"}
              aria-controls="auth-panel"
              className={`auth-tab ${tabMode === "SIGN_IN" ? "auth-tab--active" : ""}`}
              onClick={() => handleTabChange("SIGN_IN")}
            >
              <span>SIGN IN</span>
            </button>
            <button
              type="button"
              role="tab"
              id="tab-sign-up"
              aria-selected={tabMode === "SIGN_UP"}
              aria-controls="auth-panel"
              className={`auth-tab ${tabMode === "SIGN_UP" ? "auth-tab--active" : ""}`}
              onClick={() => handleTabChange("SIGN_UP")}
            >
              <span>SIGN UP</span>
            </button>
          </div>

          {/* Form Panel */}
          <div
            id="auth-panel"
            role="tabpanel"
            aria-labelledby={
              tabMode === "SIGN_IN" ? "tab-sign-in" : "tab-sign-up"
            }
            className="auth-panel"
          >
            {authError && (
              <div className="auth-error-banner" role="alert">
                <p>{authError}</p>
              </div>
            )}

            <form
              className="auth-form"
              onSubmit={handleSubmitForm}
              aria-label={
                tabMode === "SIGN_IN"
                  ? "Sign in with Email"
                  : "Sign up with Email"
              }
            >
              {/* Name Input (Sign Up only) */}
              {tabMode === "SIGN_UP" && (
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-name">
                    Name
                  </label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      id="auth-name"
                      type="text"
                      name="name"
                      autoComplete="name"
                      placeholder="Your Name"
                      className="auth-input"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (authError) setAuthError(undefined);
                      }}
                      disabled={isAnyLoading}
                    />
                  </div>
                </div>
              )}

              {/* 3. Email Input */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-email">
                  Email
                </label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    id="auth-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="auth-input"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (authError) setAuthError(undefined);
                    }}
                    disabled={isAnyLoading}
                  />
                </div>
              </div>

              {/* 4. Password Input */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-password">
                  Password
                </label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete={
                      tabMode === "SIGN_IN"
                        ? "current-password"
                        : "new-password"
                    }
                    required
                    placeholder="••••••••••••"
                    className="auth-input"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (authError) setAuthError(undefined);
                    }}
                    disabled={isAnyLoading}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* 5. Forgot password? (Directly below/right of password field) */}
                {tabMode === "SIGN_IN" && (
                  <div className="auth-forgot-wrap">
                    <button
                      type="button"
                      className="auth-forgot-link"
                      onClick={() => setModalState("forgot_password")}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {/* Confirm Password Input (Sign Up only) */}
              {tabMode === "SIGN_UP" && (
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-confirm-password">
                    Confirm your password
                  </label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      autoComplete="new-password"
                      required
                      placeholder="••••••••••••"
                      className="auth-input"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (authError) setAuthError(undefined);
                      }}
                      disabled={isAnyLoading}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" y1="2" x2="22" y2="22" />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 6. SIGN IN / SIGN UP Primary Button (Warm near-white CTA with dark forest text) */}
              <button
                type="submit"
                className="auth-primary-btn"
                disabled={isAnyLoading}
              >
                <span>
                  {activeMethod === "PASSWORD"
                    ? "PROCESSING..."
                    : tabMode === "SIGN_IN"
                      ? "SIGN IN"
                      : "SIGN UP"}
                </span>
              </button>
            </form>

            {/* 7. "or continue with" divider */}
            <div className="auth-divider" role="separator">
              <span className="auth-divider__line" />
              <span className="auth-divider__text">or continue with</span>
              <span className="auth-divider__line" />
            </div>

            {/* 8. Continue with Google button */}
            <button
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleLogin}
              disabled={isAnyLoading}
            >
              <GoogleIcon />
              <span>
                {activeMethod === "GOOGLE"
                  ? "Connecting..."
                  : "Continue with Google"}
              </span>
            </button>

            {/* 9. Bottom switch prompt: "Don't have an account? Sign up" */}
            <div className="auth-bottom-switch">
              {tabMode === "SIGN_IN" ? (
                <p>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="auth-switch-action"
                    onClick={() => {
                      setTabMode("SIGN_UP");
                      setAuthError(undefined);
                    }}
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="auth-switch-action"
                    onClick={() => {
                      setTabMode("SIGN_IN");
                      setAuthError(undefined);
                    }}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </main>

        {/* Secondary Unobtrusive Footer: Terms/Privacy & Partner link */}
        <footer className="auth-screen__footer">
          <div className="auth-screen__footer-links">
            <button
              type="button"
              className="auth-sub-link"
              onClick={() => setModalState("terms")}
            >
              Terms &amp; Conditions
            </button>
            <span className="auth-sub-dot">•</span>
            <button
              type="button"
              className="auth-sub-link"
              onClick={() => setModalState("privacy")}
            >
              Privacy Policy
            </button>
          </div>
          <Link to="/partner" className="auth-sub-partner">
            Partner Portal &rarr;
          </Link>
        </footer>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog
        open={modalState === "forgot_password"}
        title="Forgot password?"
        description="Password reset for JedaIn account"
        onClose={() => setModalState(null)}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalState(null)}
          >
            Close
          </Button>
        }
      >
        <p className="auth-dialog-text">
          Password recovery functionality is a placeholder prototype in this
          demo. For assistance or mock access, please continue with Google or
          enter any valid email and password.
        </p>
      </Dialog>

      {/* Terms & Conditions Dialog */}
      <Dialog
        open={modalState === "terms"}
        title="Terms & Conditions"
        description="JedaIn terms of service and usage guidelines"
        onClose={() => setModalState(null)}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalState(null)}
          >
            Close
          </Button>
        }
      >
        <p className="auth-dialog-text">
          Full Terms &amp; Conditions documentation will be finalized prior to
          production release. By using JedaIn, you agree to mindful and
          respectful travel practices.
        </p>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog
        open={modalState === "privacy"}
        title="Privacy Policy"
        description="Personal data management and privacy commitments"
        onClose={() => setModalState(null)}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalState(null)}
          >
            Close
          </Button>
        }
      >
        <p className="auth-dialog-text">
          JedaIn respects your privacy and personal data. Detailed data
          processing agreements will be provided prior to production launch.
        </p>
      </Dialog>
    </div>
  );
}
