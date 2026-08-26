import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type LoginPageProps = {
   mode?: "login" | "register";
};

export default function LoginPage({ mode = "login" }: LoginPageProps) {
   const navigate = useNavigate();
   const { setCurrentUser } = useAuth();
   const isRegister = mode === "register";

   // Dodajemy stan do przechowywania wiadomości o błędzie
   const [error, setError] = useState<string | null>(null);

   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      // Czyścimy poprzedni błąd przy nowej próbie wysłania formularza
      setError(null);

      const formData = new FormData(event.currentTarget);
      const login = String(formData.get("login") ?? "");
      const password = String(formData.get("password") ?? "");

      try {
         if (isRegister) {
            const birthYearRaw = formData.get("birth_year");
            const birthYear = birthYearRaw ? Number(birthYearRaw) : undefined;
            const gender = String(formData.get("gender") ?? "");
            
            let category: string | undefined = undefined;

            // Logika wyliczania kategorii na podstawie płci i wieku
            if (birthYear && (gender === "K" || gender === "M")) {
               const currentYear = new Date().getFullYear();
               const age = currentYear - birthYear;
               
               if (age <= 10) {
                  category = `${gender}10`;
               } else if (age <= 12) {
                  category = `${gender}12`;
               } else if (age <= 14) {
                  category = `${gender}14`;
               } else if (age <= 16) {
                  category = `${gender}16`;
               } else if (age <= 18) {
                  category = `${gender}18`;
               } else if (age <= 20) {
                  category = `${gender}20`;
               } else if (age < 35) {
                  category = `${gender}21`;
               } else {
                  // Powyżej 35 lat - skok co 5 (np. 35, 40, 45, 50...)
                  const veteranAge = Math.floor(age / 5) * 5;
                  category = `${gender}${veteranAge}`;
               }
            }

            const user = await registerUser({
               email: String(formData.get("email") ?? ""),
               login,
               password,
               first_name: String(formData.get("first_name") ?? "") || undefined,
               last_name: String(formData.get("last_name") ?? "") || undefined,
               birth_year: birthYear,
               gender: gender || undefined,
               category: category, // Wyliczona kategoria
            });
            const normalizedUser = { ...user, user_id: user.user_id || user.id };

            setCurrentUser(normalizedUser);
            navigate("/dashboard");
         } else {
            const user = await loginUser({ login, password });
            setCurrentUser(user);
            navigate("/dashboard");
         }
      } catch (err) {
         // Wychwytujemy błąd z API i ustawiamy odpowiedni komunikat
         if (isRegister) {
            setError("Błąd podczas rejestracji. Sprawdź poprawność danych.");
         } else {
            setError("Nieprawidłowy login lub hasło.");
         }
      }
   };

   return (
      <section className="auth-screen">
         <form className="auth-card page-stack" onSubmit={handleSubmit}>
            <div className="auth-brand">
               <span className="auth-brand__name">OriSuS</span>
            </div>

            {/* Renderowanie komunikatu o błędzie, jeśli istnieje */}
            {error && (
               <div
                  className="error-message"
                  style={{ color: "var(--color-accent)", textAlign: "center", margin: "10px 0", fontWeight: "bold" }}
               >
                  {error}
               </div>
            )}

            <label className="field-group">
               <span className="field-label">Login</span>
               <input className="field-input" type="text" name="login" autoComplete="username" required />
            </label>

            {isRegister ? (
               <>
                  <label className="field-group">
                     <span className="field-label">Email</span>
                     <input className="field-input" type="email" name="email" autoComplete="email" required />
                  </label>
                  <label className="field-group">
                     <span className="field-label">Imię</span>
                     <input className="field-input" type="text" name="first_name" autoComplete="given-name" />
                  </label>
                  <label className="field-group">
                     <span className="field-label">Nazwisko</span>
                     <input className="field-input" type="text" name="last_name" autoComplete="family-name" />
                  </label>
               </>
            ) : null}

            <label className="field-group">
               <span className="field-label">Hasło</span>
               <input className="field-input" type="password" name="password" autoComplete="current-password" required />
            </label>

            {isRegister ? (
               <>
                  <label className="field-group">
                     <span className="field-label">Rok urodzenia</span>
                     <input className="field-input" type="number" name="birth_year" min={1900} max={new Date().getFullYear()} required />
                  </label>

                  <label className="field-group">
                     <span className="field-label">Płeć</span>
                     <select className="field-input field-select" name="gender" defaultValue="" required>
                        <option value="" disabled>Wybierz płeć...</option>
                        <option value="female">Kobieta</option>
                        <option value="male">Mężczyzna</option>
                     </select>
                  </label>
               </>
            ) : null}

            <button className="primary-btn" type="submit">
               {isRegister ? "Utwórz konto" : "Zaloguj"}
            </button>

            <div className="auth-links">
               {isRegister ? (
                  <Link className="ghost-btn" to="/login" style={{ display: "flex", justifyContent: "center" }}>
                     Mam już konto
                  </Link>
               ) : (
                  <Link className="ghost-btn" to="/register" style={{ display: "flex", justifyContent: "center" }}>
                     Stwórz nowe konto
                  </Link>
               )}
               <button className="ghost-btn" type="button">
                  Zapomniałeś hasła?
               </button>
            </div>
         </form>
      </section>
   );
}