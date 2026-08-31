import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../lib/api";

export default function ResetPasswordPage() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const token = searchParams.get("token"); // Wyciąga ?token=XYZ z linku

   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!token) return;
      setError(null);

      const formData = new FormData(event.currentTarget);
      const password = String(formData.get("password") ?? "");
      const confirmPassword = String(formData.get("confirmPassword") ?? "");

      if (password !== confirmPassword) {
         setError("Hasła nie są identyczne!");
         return;
      }

      try {
         setIsSubmitting(true);
         await resetPassword(token, password);
         navigate("/login"); // Sukces! Przenosi do logowania
      } catch (err: any) {
         setError(err.message || "Link wygasł lub jest nieprawidłowy.");
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <section className="auth-screen">
         <form className="auth-card page-stack" onSubmit={handleSubmit}>
            <div className="auth-brand">
               <span className="auth-brand__name">OriSuS</span>
            </div>
            <h2 style={{ textAlign: "center" }}>Nowe hasło</h2>

            {error && (
               <div
                  className="error-message"
                  style={{ color: "var(--color-accent)", textAlign: "center", fontWeight: "bold" }}
               >
                  {error}
               </div>
            )}

            {!token ? (
               <div className="info-card info-card--muted" style={{ textAlign: "center" }}>
                  <p>Brak tokenu. Otwórz link z konsoli ponownie.</p>
               </div>
            ) : (
               <>
                  <label className="field-group">
                     <span className="field-label">Nowe hasło</span>
                     <input className="field-input" type="password" name="password" required />
                  </label>
                  <label className="field-group">
                     <span className="field-label">Powtórz nowe hasło</span>
                     <input className="field-input" type="password" name="confirmPassword" required />
                  </label>
                  <button className="primary-btn" type="submit" disabled={isSubmitting}>
                     {isSubmitting ? "Zapisywanie..." : "Zmień hasło"}
                  </button>
               </>
            )}
         </form>
      </section>
   );
}
