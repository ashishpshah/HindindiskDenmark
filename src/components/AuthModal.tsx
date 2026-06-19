import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User as UserIcon, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";

export function AuthModal() {
  const { modalOpen, closeModal, modalMode, setModalMode, login, register } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "", otp: "", newpwd: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    await login(form.email, form.password); setLoading(false);
    toast.success("Logged in"); closeModal();
  };
  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
    setLoading(false); toast.success("Account created"); closeModal();
  };

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
            <div className="flex items-center justify-between border-b p-5">
              <div className="font-display text-xl font-semibold">
                {modalMode === "login" && t("auth.loginTitle")}
                {modalMode === "register" && t("auth.registerTitle")}
                {modalMode === "forgot" && t("auth.forgotTitle")}
              </div>
              <button onClick={closeModal} className="rounded-full p-2 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-6">
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
                  <Button disabled={loading} className="w-full gradient-primary text-primary-foreground">{t("actions.login")}</Button>
                  <div className="relative my-2 text-center text-xs text-muted-foreground">
                    <span className="bg-card px-2 relative z-10">or</span>
                    <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
                  </div>
                  <Button type="button" variant="outline" className="w-full" onClick={() => { toast.info("Google sign-in (mock)"); }}>
                    {t("auth.continueGoogle")}
                  </Button>
                  <p className="pt-2 text-center text-sm text-muted-foreground">
                    {t("auth.noAccount")}{" "}
                    <button type="button" onClick={() => setModalMode("register")} className="font-semibold text-primary hover:underline">{t("actions.register")}</button>
                  </p>
                </form>
              )}

              {modalMode === "register" && (
                <form onSubmit={onRegister} className="space-y-4">
                  <Field icon={<UserIcon className="h-4 w-4" />} label={t("auth.name")}>
                    <Input required value={form.name} onChange={set("name")} />
                  </Field>
                  <Field icon={<Mail className="h-4 w-4" />} label={t("auth.email")}>
                    <Input required type="email" value={form.email} onChange={set("email")} />
                  </Field>
                  <Field icon={<Phone className="h-4 w-4" />} label={t("auth.phone")}>
                    <Input required type="tel" value={form.phone} onChange={set("phone")} placeholder="+45 …" />
                  </Field>
                  <Field icon={<Lock className="h-4 w-4" />} label={t("auth.password")}>
                    <Input required type="password" value={form.password} onChange={set("password")} />
                  </Field>
                  <Field icon={<Lock className="h-4 w-4" />} label={t("auth.confirmPassword")}>
                    <Input required type="password" value={form.confirm} onChange={set("confirm")} />
                  </Field>
                  <label className="flex items-start gap-2 text-sm"><Checkbox required className="mt-0.5" /> <span>{t("auth.acceptTerms")}</span></label>
                  <Button disabled={loading} className="w-full gradient-primary text-primary-foreground">{t("actions.register")}</Button>
                  <p className="pt-2 text-center text-sm text-muted-foreground">
                    {t("auth.haveAccount")}{" "}
                    <button type="button" onClick={() => setModalMode("login")} className="font-semibold text-primary hover:underline">{t("actions.login")}</button>
                  </p>
                </form>
              )}

              {modalMode === "forgot" && (
                <div className="space-y-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    {[1,2,3].map((n) => (
                      <div key={n} className={`h-1 flex-1 rounded-full ${forgotStep >= n ? "bg-primary" : "bg-muted"}`} />
                    ))}
                  </div>
                  {forgotStep === 1 && (
                    <form onSubmit={(e) => { e.preventDefault(); toast.success(t("auth.otpSent")); setForgotStep(2); }} className="space-y-4">
                      <Field icon={<Mail className="h-4 w-4" />} label={t("auth.email")}>
                        <Input required type="email" value={form.email} onChange={set("email")} />
                      </Field>
                      <Button className="w-full gradient-primary text-primary-foreground">{t("actions.continue")}</Button>
                    </form>
                  )}
                  {forgotStep === 2 && (
                    <form onSubmit={(e) => { e.preventDefault(); setForgotStep(3); }} className="space-y-4">
                      <Field label={t("auth.otpCode")}>
                        <Input required value={form.otp} onChange={set("otp")} maxLength={6} placeholder="123456" />
                      </Field>
                      <Button className="w-full gradient-primary text-primary-foreground">{t("actions.continue")}</Button>
                    </form>
                  )}
                  {forgotStep === 3 && (
                    <form onSubmit={(e) => { e.preventDefault(); toast.success(t("auth.resetSuccess")); setForgotStep(1); setModalMode("login"); }} className="space-y-4">
                      <Field icon={<Lock className="h-4 w-4" />} label={t("auth.newPassword")}>
                        <Input required type="password" value={form.newpwd} onChange={set("newpwd")} />
                      </Field>
                      <Button className="w-full gradient-primary text-primary-foreground">{t("actions.save")}</Button>
                    </form>
                  )}
                  <button onClick={() => setModalMode("login")} className="block w-full text-center text-sm text-primary hover:underline">{t("actions.back")}</button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm">{icon}{label}</Label>
      {children}
    </div>
  );
}