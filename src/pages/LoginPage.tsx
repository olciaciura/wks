import type { FormEvent } from "react";
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

   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const login = String(formData.get("login") ?? "");
      const password = String(formData.get("password") ?? "");

      const user = isRegister
         ? await registerUser({
              email: String(formData.get("email") ?? ""),
              login,
              password,
              birth_year: formData.get("birth_year") ? Number(formData.get("birth_year")) : undefined,
              gender: String(formData.get("gender") ?? "") || undefined,
              category: String(formData.get("category") ?? "") || undefined,
           })
         : await loginUser({ login, password });

      setCurrentUser(user);
      navigate("/dashboard");
   };

   return (
      <section className="auth-screen">
         <form className="auth-card page-stack" onSubmit={handleSubmit}>
            <div className="page-stack page-stack--compact">
               <p className="eyebrow">{isRegister ? "Nowe konto" : "Witaj"}</p>
               <div>
                  <h1>{isRegister ? "Rejestracja" : "Logowanie"}</h1>
                  <p className="page-copy">
                     {isRegister
                        ? "Załóż konto i przejdź od razu do listy wydarzeń."
                        : "Wejdź do aplikacji i przejdź do swojego panelu."}
                  </p>
               </div>
            </div>

            <label className="field-group">
               <span className="field-label">Login</span>
               <input className="field-input" type="text" name="login" autoComplete="username" />
            </label>

            {isRegister ? (
               <label className="field-group">
                  <span className="field-label">Email</span>
                  <input className="field-input" type="email" name="email" autoComplete="email" />
               </label>
            ) : null}

            <label className="field-group">
               <span className="field-label">Haslo</span>
               <input className="field-input" type="password" name="password" autoComplete="current-password" />
            </label>

            {isRegister ? (
               <>
                  <label className="field-group">
                     <span className="field-label">Rok urodzenia</span>
                     <input className="field-input" type="number" name="birth_year" min={1900} max={2100} />
                  </label>

                  <label className="field-group">
                     <span className="field-label">Płeć</span>
                     <input className="field-input" type="text" name="gender" placeholder="np. female / male / other" />
                  </label>

                  <label className="field-group">
                     <span className="field-label">Kategoria</span>
                     <input className="field-input" type="text" name="category" placeholder="np. M21" />
                  </label>
               </>
            ) : null}

            <button className="primary-btn" type="submit">
               {isRegister ? "Utwórz konto" : "Zaloguj"}
            </button>

            <div className="auth-links">
               {isRegister ? (
                  <Link className="ghost-btn" to="/login">
                     Mam już konto
                  </Link>
               ) : (
                  <Link className="ghost-btn" to="/register">
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
