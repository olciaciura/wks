import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../lib/api";

export default function ForgotPasswordPage() {
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isSuccess, setIsSuccess] = useState(false);

   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "");

      try {
         await requestPasswordReset(email);
         setIsSuccess(true);
      } catch (err) {
         // Nawet jak jest błąd, udajemy sukces (bezpieczeństwo)
         setIsSuccess(true);
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <section className="auth-screen">
         <form className="auth-card page-stack" onSubmit={handleSubmit}>
            <div className="auth-brand"><span className="auth-brand__name">OriSuS</span></div>
            <h2 style={{ textAlign: "center" }}>Reset hasła</h2>

            {isSuccess ? (
               <div className="info-card info-card--success" style={{ textAlign: "center" }}>
                  <p>Sprawdź konsolę backendu! Wygenerowano tam link do zmiany hasła (udajemy email).</p>
                  <Link className="primary-btn" to="/login" style={{ marginTop: "16px" }}>Wróć do logowania</Link>
               </div>
            ) : (
               <>
                  <p className="page-copy" style={{ textAlign: "center", fontSize: "0.9rem" }}>
                     Podaj email. W konsoli serwera pojawi się link ważny 15 minut.
                  </p>
                  <label className="field-group">
                     <span className="field-label">Email</span>
                     <input className="field-input" type="email" name="email" required />
                  </label>
                  <button className="primary-btn" type="submit" disabled={isSubmitting}>
                     {isSubmitting ? "Wysyłanie..." : "Wyślij link"}
                  </button>
                  <Link className="ghost-btn" to="/login" style={{ display: "flex", justifyContent: "center" }}>Wróć</Link>
               </>
            )}
         </form>
      </section>
   );
}