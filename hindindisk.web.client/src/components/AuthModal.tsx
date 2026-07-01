import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User as UserIcon, Phone, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import { apiFetch } from "@/lib/api/client";

type Alert = { type: "success" | "error" | "info"; message: string };

export function AuthModal() {
  const { modalOpen, closeModal, modalMode, setModalMode, login, register } = useAuth();
  const { t } = useI18n();
  const [loading,    setLoading]    = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [alert,      setAlert]      = useState<Alert | null>(null);
  const [resetToken, setResetToken] = useState("");
  const [form, setForm] = useState({
    firstname: "", lastname: "", email: "", phone: "", password: "", confirm: "", otp: "", newpwd: "", newpwdConfirm: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setAlert(null);
    setForm({ ...form, [k]: e.target.value });
  };

  useEffect(() => {
    if (modalOpen) {
      setForm({ firstname: "", lastname: "", email: "", phone: "", password: "", confirm: "", otp: "", newpwd: "", newpwdConfirm: "" });
      setAlert(null);
      setResetToken("");
    } else {
      setForgotStep(1);
    }
  }, [modalOpen]);

  useEffect(() => {
    if (modalMode !== "forgot") setForgotStep(1);
    setAlert(null);
  }, [modalMode]);

  useEffect(() => { setAlert(null); }, [forgotStep]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      await login(form.email, form.password);
      closeModal();
    } catch {
      setAlert({ type: "error", message: "Invalid email or password." });
    } finally {
      setLoading(false);
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setAlert({ type: "error", message: "Password must be at least 8 characters." }); return;
    }
    if (form.password !== form.confirm) {
      setAlert({ type: "error", message: "Passwords do not match." }); return;
    }
    if (form.phone && !/^\d{8,13}$/.test(form.phone.trim().replace(/[+ ]/g, ""))) {
      setAlert({ type: "error", message: "Phone must be 8–13 digits. You may use + and spaces (e.g. +45 12 34 56 78)." }); return;
    }
    setLoading(true);
    setAlert(null);
    try {
      await register({ firstname: form.firstname, lastname: form.lastname, email: form.email, phone: form.phone || undefined, password: form.password });
      closeModal();
    } catch (err: unknown) {
      setAlert({ type: "error", message: err instanceof Error ? err.message : "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot: Step 1 — send OTP ──────────────────────────────────────────────
  const onSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: form.email }),
      });
      setForgotStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not send OTP. Please try again.";
      // Active OTP exists (too soon / daily limit + still valid) → skip to OTP input
      const hasActiveOtp = msg.includes("OTP_ALREADY_ACTIVE") || msg.toLowerCase().includes("please wait");
      if (hasActiveOtp) {
        setForgotStep(2);
        setAlert({ type: "info", message: "OTP already sent to your email. Please check your inbox." });
      } else {
        setAlert({ type: "error", message: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot: Step 2 — verify OTP via API ───────────────────────────────────
  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.otp.length !== 6 || !/^\d{6}$/.test(form.otp)) {
      setAlert({ type: "error", message: "Please enter the 6-digit OTP sent to your email." }); return;
    }
    setLoading(true);
    setAlert(null);
    try {
      const res = await apiFetch<{ resetToken: string }>("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email: form.email, otp: form.otp }),
      });
      setResetToken(res.resetToken);
      setForgotStep(3);
    } catch (err: unknown) {
      setAlert({ type: "error", message: err instanceof Error ? err.message : "Invalid OTP. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot: Step 3 — reset password ───────────────────────────────────────
  const onResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newpwd.length < 8) {
      setAlert({ type: "error", message: "Password must be at least 8 characters." }); return;
    }
    if (form.newpwd !== form.newpwdConfirm) {
      setAlert({ type: "error", message: "Passwords do not match." }); return;
    }
    setLoading(true);
    setAlert(null);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email: form.email, resetToken, newPassword: form.newpwd }),
      });
      setAlert({ type: "success", message: t("auth.resetSuccess") });
      setTimeout(() => { setForgotStep(1); setModalMode("login"); }, 1500);
    } catch (err: unknown) {
      setAlert({ type: "error", message: err instanceof Error ? err.message : "Failed to reset password." });
    } finally {
      setLoading(false);
    }
  };

  // ── Inline alert banner ────────────────────────────────────────────────────
  const AlertBanner = () => alert ? (
    <div className={`rounded-xl px-4 py-3 text-sm flex items-start gap-2 ${
      alert.type === "error"   ? "bg-destructive/10 border border-destructive/20 text-destructive" :
      alert.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400" :
                                 "bg-primary/5 border border-primary/20 text-muted-foreground"
    }`}>
      {alert.type === "error"   && <AlertCircle  className="h-4 w-4 shrink-0 mt-0.5" />}
      {alert.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
      {alert.type === "info"    && <Info         className="h-4 w-4 shrink-0 mt-0.5" />}
      <span>{alert.message}</span>
    </div>
  ) : null;

  return (
    <AnimatePresence>
      {modalOpen && (
        <>
          <motion.div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} />
          <motion.div
            className="fixed left-1/2 top-1/2 z-[101] w-[94%] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-card shadow-elegant"
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b p-5">
              <div className="font-display text-xl font-semibold">
                {modalMode === "login"    && t("auth.loginTitle")}
                {modalMode === "register" && t("auth.registerTitle")}
                {modalMode === "forgot"   && t("auth.forgotTitle")}
              </div>
              <button onClick={closeModal} className="rounded-full p-2 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-6">

              {/* ── Login ─────────────────────────────────────────────────── */}
              {modalMode === "login" && (
                <form onSubmit={onLogin} className="space-y-4">
                  <Field icon={<Mail className="h-4 w-4" />} label={t("auth.email")}>
                    <Input required type="email" value={form.email} onChange={set("email")} placeholder="you@email.dk" />
                  </Field>
                  <Field icon={<Lock className="h-4 w-4" />} label={t("auth.password")}>
                    <Input required type="password" value={form.password} onChange={set("password")} />
                  </Field>
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2"><Checkbox /> {t("auth.remember")}</label>
                    <button type="button" onClick={() => setModalMode("forgot")} className="text-primary hover:underline">{t("auth.forgot")}</button>
                  </div>
                  <AlertBanner />
                  <Button disabled={loading} className="w-full gradient-primary text-primary-foreground">{t("actions.login")}</Button>
                  <div className="relative my-2 text-center text-xs text-muted-foreground">
                    <span className="bg-card px-2 relative z-10">or</span>
                    <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
                  </div>
                  <p className="pt-2 text-center text-sm text-muted-foreground">
                    {t("auth.noAccount")}{" "}
                    <button type="button" onClick={() => setModalMode("register")} className="font-semibold text-primary hover:underline">{t("actions.register")}</button>
                  </p>
                </form>
              )}

              {/* ── Register ──────────────────────────────────────────────── */}
              {modalMode === "register" && (
                <form onSubmit={onRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field icon={<UserIcon className="h-4 w-4" />} label="First Name">
                      <Input required placeholder="John" value={form.firstname} onChange={set("firstname")} />
                    </Field>
                    <Field label="Last Name">
                      <Input required placeholder="Doe" value={form.lastname} onChange={set("lastname")} />
                    </Field>
                  </div>
                  <Field icon={<Mail className="h-4 w-4" />} label={t("auth.email")}>
                    <Input required type="email" value={form.email} onChange={set("email")} placeholder="you@email.dk" />
                  </Field>
                  <Field icon={<Phone className="h-4 w-4" />} label={
                    <span className="flex items-center gap-1">
                      {t("auth.phone")}
                      <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                    </span>
                  }>
                    <Input type="tel" value={form.phone} onChange={set("phone")} placeholder="+45 12 34 56 78" />
                  </Field>
                  <Field icon={<Lock className="h-4 w-4" />} label={t("auth.password")}>
                    <Input required type="password" value={form.password} onChange={set("password")} placeholder="Min. 8 characters" />
                  </Field>
                  <Field icon={<Lock className="h-4 w-4" />} label={t("auth.confirmPassword")}>
                    <Input required type="password" value={form.confirm} onChange={set("confirm")} placeholder="Repeat password" />
                  </Field>
                  <label className="flex items-start gap-2 text-sm"><Checkbox required className="mt-0.5" /> <span>{t("auth.acceptTerms")}</span></label>
                  <AlertBanner />
                  <Button disabled={loading} className="w-full gradient-primary text-primary-foreground">{t("actions.register")}</Button>
                  <p className="pt-2 text-center text-sm text-muted-foreground">
                    {t("auth.haveAccount")}{" "}
                    <button type="button" onClick={() => setModalMode("login")} className="font-semibold text-primary hover:underline">{t("actions.login")}</button>
                  </p>
                </form>
              )}

              {/* ── Forgot password ────────────────────────────────────────── */}
              {modalMode === "forgot" && (
                <div className="space-y-4">
                  {/* Progress bar */}
                  <div className="mb-2 flex items-center gap-2">
                    {([1, 2, 3] as const).map((n) => (
                      <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${forgotStep >= n ? "bg-primary" : "bg-muted"}`} />
                    ))}
                  </div>

                  {/* Step 1: enter email */}
                  {forgotStep === 1 && (
                    <form onSubmit={onSendOtp} className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Enter the email address linked to your account. We'll send you a 6-digit OTP.
                      </p>
                      <Field icon={<Mail className="h-4 w-4" />} label={t("auth.email")}>
                        <Input required type="email" value={form.email} onChange={set("email")} placeholder="you@email.dk" />
                      </Field>
                      <AlertBanner />
                      <Button disabled={loading} className="w-full gradient-primary text-primary-foreground">
                        {loading ? "Sending…" : "Send OTP"}
                      </Button>
                    </form>
                  )}

                  {/* Step 2: enter OTP */}
                  {forgotStep === 2 && (
                    <form onSubmit={onVerifyOtp} className="space-y-4">
                      <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          OTP sent to <strong className="text-foreground">{form.email}</strong>. Check your inbox (and spam folder).
                        </p>
                      </div>
                      <Field label={t("auth.otpCode")}>
                        <Input
                          required
                          inputMode="numeric"
                          pattern="\d{6}"
                          maxLength={6}
                          value={form.otp}
                          onChange={set("otp")}
                          placeholder="6-digit code"
                          className="text-center text-xl tracking-widest font-mono"
                        />
                      </Field>
                      <AlertBanner />
                      <Button disabled={loading} className="w-full gradient-primary text-primary-foreground">
                        {loading ? "Verifying…" : "Verify OTP"}
                      </Button>
                      <button
                        type="button"
                        className="block w-full text-center text-xs text-muted-foreground hover:text-primary transition"
                        onClick={() => { setForgotStep(1); }}
                      >
                        Didn't receive it? Go back and resend
                      </button>
                    </form>
                  )}

                  {/* Step 3: new password */}
                  {forgotStep === 3 && (
                    <form onSubmit={onResetPassword} className="space-y-4">
                      <p className="text-sm text-muted-foreground">OTP verified. Enter your new password.</p>
                      <Field icon={<Lock className="h-4 w-4" />} label={t("auth.newPassword")}>
                        <Input required type="password" value={form.newpwd} onChange={set("newpwd")} placeholder="At least 8 characters" />
                      </Field>
                      <Field icon={<Lock className="h-4 w-4" />} label={t("auth.confirmPassword")}>
                        <Input required type="password" value={form.newpwdConfirm} onChange={set("newpwdConfirm")} placeholder="Repeat new password" />
                      </Field>
                      <AlertBanner />
                      <Button disabled={loading} className="w-full gradient-primary text-primary-foreground">
                        {loading ? "Saving…" : t("actions.save")}
                      </Button>
                    </form>
                  )}

                  <button
                    onClick={() => setModalMode("login")}
                    className="block w-full text-center text-sm text-primary hover:underline"
                  >
                    {t("actions.back")}
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, icon, children }: { label: React.ReactNode; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm">{icon}{label}</Label>
      {children}
    </div>
  );
}
