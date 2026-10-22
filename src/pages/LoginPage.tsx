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

   // Stany do obsługi błędów i haseł na bieżąco
   const [error, setError] = useState<string | null>(null);
   const [password, setPassword] = useState("");
   const [passwordRepeat, setPasswordRepeat] = useState("");

   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      // Czyścimy poprzedni błąd przy nowej próbie wysłania formularza
      setError(null);

      const formData = new FormData(event.currentTarget);
      const login = String(formData.get("login") ?? "");
      
      try {
         if (isRegister) {
            const birthYearRaw = formData.get("birth_year");
            const birthYear = birthYearRaw ? Number(birthYearRaw) : undefined;
            const gender = String(formData.get("gender") ?? "");
            
            let category: string | undefined = undefined;

            // Logika wyliczania kategorii na podstawie płci i wieku
            if (birthYear && (gender === "female" || gender === "male")) {
               const currentYear = new Date().getFullYear();
               const age = currentYear - birthYear;
               
               const genderPrefix = gender === "female" ? "K" : "M"; 

               if (age <= 10) {
                  category = `${genderPrefix}10`;
               } else if (age <= 12) {
                  category = `${genderPrefix}12`;
               } else if (age <= 14) {
                  category = `${genderPrefix}14`;
               } else if (age <= 16) {
                  category = `${genderPrefix}16`;
               } else if (age <= 18) {
                  category = `${genderPrefix}18`;
               } else if (age <= 20) {
                  category = `${genderPrefix}20`;
               } else if (age < 35) {
                  category = `${genderPrefix}21`;
               } else {
                  // Powyżej 35 lat - skok co 5 (np. 35, 40, 45, 50...)
                  const veteranAge = Math.floor(age / 5) * 5;
                  category = `${genderPrefix}${veteranAge}`;
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
               category: category, 
            });
            const normalizedUser = { ...user, user_id: user.user_id || (user as any).id };

            setCurrentUser(normalizedUser);
            navigate("/dashboard");
         } else {
            const user = await loginUser({ login, password });
            setCurrentUser(user);
            navigate("/dashboard");
         }
      } catch (err) {
         if (isRegister) {
            setError("Błąd podczas rejestracji. Sprawdź poprawność danych.");
         } else {
            setError("Nieprawidłowy login lub hasło.");
         }
      }
   };

   // Przycisk jest zablokowany tylko w trybie rejestracji, jeśli hasła się nie zgadzają lub są puste
   const isButtonDisabled = isRegister && (password !== passwordRepeat || password.length === 0);

   return (
      <section className="auth-screen">
         <form className="auth-card page-stack" onSubmit={handleSubmit}>
            <div className="auth-brand">
               <span className="auth-brand__name">OriSuS</span>
            </div>

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
                     <input className="field-input" type="text" name="first_name" autoComplete="given-name" required />
                  </label>
                  <label className="field-group">
                     <span className="field-label">Nazwisko</span>
                     <input className="field-input" type="text" name="last_name" autoComplete="family-name" required/>
                  </label>
               </>
            ) : null}

            <label className="field-group">
               <span className="field-label">Hasło</span>
               <input 
                  className="field-input" 
                  type="password" 
                  name="password" 
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
               />
            </label>

            {/* Powtórz hasło - teraz widoczne TYLKO przy rejestracji */}
            {isRegister ? (
               <label className="field-group">
                  <span className="field-label">Powtórz hasło</span>
                  <input 
                     className="field-input" 
                     type="password" 
                     name="password_repeat" 
                     autoComplete="new-password" 
                     required 
                     value={passwordRepeat}
                     onChange={(e) => setPasswordRepeat(e.target.value)}
                  />
                  {/* Mała podpowiedź wizualna dla użytkownika */}
                  {password !== passwordRepeat && passwordRepeat.length > 0 && (
                     <span style={{ color: "var(--color-accent)", fontSize: "0.8rem", marginTop: "4px" }}>
                        Hasła nie są identyczne!
                     </span>
                  )}
               </label>
            ) : null}

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

            {/* Zablokowanie przycisku */}
            <button 
               className="primary-btn" 
               type="submit" 
               disabled={isButtonDisabled}
               style={{ opacity: isButtonDisabled ? 0.5 : 1, cursor: isButtonDisabled ? "not-allowed" : "pointer" }}
            >
               {isRegister ? "Utwórz konto" : "Zaloguj"}
            </button>

            <div className="auth-links">
               {isRegister ? (
                  <Link className="ghost-btn" to="/login" style={{ display: "flex", justifyContent: "center" }}>
                     Mam już konto
                  </Link>
               ) : (
                  <>
                     <Link className="ghost-btn" to="/register" style={{ display: "flex", justifyContent: "center" }}>
                        Stwórz nowe konto
                     </Link>
                     <Link className="ghost-btn" to="/forgot-password" style={{ display: "hide", justifyContent: "center" }}>
                        Zapomniałeś hasła?
                     </Link>
                  </>
               )}
               
            </div>
         </form>
      </section>
   );
}