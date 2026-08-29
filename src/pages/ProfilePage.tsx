import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateUserData, changeUserPassword } from "../lib/api"; // Dodaj import changeUserPassword!
import { GrEdit } from "react-icons/gr";

// Definiujemy możliwe tryby widoku
type ViewMode = "view" | "edit-personal" | "edit-account" | "change-password";

export default function ProfilePage() {
   const { currentUser, setCurrentUser, logout } = useAuth();
   const navigate = useNavigate();

   const [mode, setMode] = useState<ViewMode>("view");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [successMsg, setSuccessMsg] = useState<string | null>(null);

   function handleLogout() {
      logout();
      navigate("/login");
   }

   function displayGender(gender?: string) {
      if (gender === "female" || gender === "K") return "Kobieta";
      if (gender === "male" || gender === "M") return "Mężczyzna";
      return gender || "-";
   }

   function displayRole(role?: string) {
      if (role === "admin") return "Administrator";
      if (role === "trainer") return "Trener";
      if (role === "user") return "Zawodnik";
      return role || "-";
   }

   // Zabezpieczone pobranie ID z kontekstu
   // @ts-ignore
   const userId = currentUser?.id || currentUser?.user_id;

   // 1. Zapis Danych Osobowych
   async function handlePersonalSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setError(null);
      setSuccessMsg(null);
      setIsSubmitting(true);

      const formData = new FormData(event.currentTarget);
      const first_name = String(formData.get("first_name") ?? "").trim();
      const last_name = String(formData.get("last_name") ?? "").trim();
      const birthYearRaw = formData.get("birth_year");
      const birth_year = birthYearRaw ? Number(birthYearRaw) : undefined;
      const gender = String(formData.get("gender") ?? "");

      let category: string | undefined = undefined;
      if (birth_year && (gender === "female" || gender === "male")) {
         const currentYear = new Date().getFullYear();
         const age = currentYear - birth_year;
         const genderPrefix = gender === "female" ? "K" : "M";

         if (age <= 10) category = `${genderPrefix}10`;
         else if (age <= 12) category = `${genderPrefix}12`;
         else if (age <= 14) category = `${genderPrefix}14`;
         else if (age <= 16) category = `${genderPrefix}16`;
         else if (age <= 18) category = `${genderPrefix}18`;
         else if (age <= 20) category = `${genderPrefix}20`;
         else if (age < 35) category = `${genderPrefix}21`;
         else {
            const veteranAge = Math.floor(age / 5) * 5;
            category = `${genderPrefix}${veteranAge}`;
         }
      }

      try {
         if (!userId) throw new Error("Brak ID użytkownika");

         const updatedUser = (await updateUserData(userId, {
            first_name: first_name || undefined,
            last_name: last_name || undefined,
            birth_year,
            gender: gender || undefined,
            category,
         })) as any;

         const normalizedUser = { ...updatedUser, user_id: updatedUser.user_id || updatedUser.id };
         setCurrentUser(normalizedUser);
         setMode("view");
         setSuccessMsg("Dane osobowe zostały zaktualizowane.");
      } catch (err) {
         setError("Nie udało się zapisać zmian. Spróbuj ponownie.");
      } finally {
         setIsSubmitting(false);
      }
   }

   // 2. Zapis Danych Konta (Email / Login)
   async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setError(null);
      setSuccessMsg(null);
      setIsSubmitting(true);

      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "").trim();
      const login = String(formData.get("login") ?? "").trim();

      try {
         if (!userId) throw new Error("Brak ID");

         const updatedUser = (await updateUserData(userId, {
            email: email || undefined,
            login: login || undefined,
         })) as any;

         const normalizedUser = { ...updatedUser, user_id: updatedUser.user_id || updatedUser.id };
         setCurrentUser(normalizedUser);
         setMode("view");
         setSuccessMsg("Dane konta zostały zaktualizowane.");
      } catch (err) {
         setError("Taki login lub email może być już zajęty.");
      } finally {
         setIsSubmitting(false);
      }
   }

   // 3. Zmiana Hasła
   async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setError(null);
      setSuccessMsg(null);

      const formData = new FormData(event.currentTarget);
      const old_password = String(formData.get("old_password") ?? "");
      const new_password = String(formData.get("new_password") ?? "");
      const new_password_repeat = String(formData.get("new_password_repeat") ?? "");

      if (new_password !== new_password_repeat) {
         setError("Nowe hasła nie są identyczne!");
         return;
      }
      if (new_password.length < 6) {
         setError("Nowe hasło musi mieć co najmniej 6 znaków.");
         return;
      }

      setIsSubmitting(true);
      try {
         if (!userId) throw new Error("Brak ID");

         await changeUserPassword(userId, {
            old_password,
            new_password,
         });

         setMode("view");
         setSuccessMsg("Hasło zostało pomyślnie zmienione!");
      } catch (err: any) {
         setError(err.message || "Stare hasło jest nieprawidłowe lub wystąpił błąd serwera.");
      } finally {
         setIsSubmitting(false);
      }
   }

   const fullName = `${currentUser?.first_name || ""} ${currentUser?.last_name || ""}`.trim();
   const headerTitle = fullName.length > 0 ? fullName : currentUser?.login;

   return (
      <section className="page-stack">
         <div className="page-stack page-stack--compact">
            <p className="eyebrow">Profil</p>
            <div>
               <h1>{headerTitle}</h1>
               <p className="page-copy">Twoje konto i ustawienia.</p>
            </div>
         </div>

         {error && (
            <div className="error-message" style={{ color: "var(--color-accent)", fontWeight: "bold" }}>
               {error}
            </div>
         )}
         {successMsg && (
            <div className="info-card info-card--success" style={{ color: "var(--color-success)", fontWeight: "bold" }}>
               {successMsg}
            </div>
         )}

         {mode === "view" && (
            <>
               <div className="page-card page-stack">
                  <h2 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Dane osobowe</h2>
                  <div className="detail-list profile-grid">
                     <div>
                        <span>Imię i nazwisko</span>
                        <p><strong>{fullName || "-"}</strong></p>
                     </div>
                     <div>
                        <span>Kategoria</span>
                        <p><strong>{currentUser?.category || "-"}</strong></p>
                     </div>
                     <div>
                        <span>Rok urodzenia</span>
                        <p><strong>{currentUser?.birth_year || "-"}</strong></p>
                     </div>
                     <div>
                        <span>Płeć</span>
                        <p><strong>{displayGender(currentUser?.gender)}</strong></p>
                     </div>
                     <button type="button" className="ghost-btn edit-profile-btn" onClick={() => { setMode("edit-personal"); setError(null); setSuccessMsg(null); }}>
                        <GrEdit size={20} />
                     </button>
                  </div>
               </div>

               <div className="page-card page-stack">
                  <h2 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Dane konta</h2>
                  <div className="detail-list profile-grid">
                     <div>
                        <span>Adres Email</span>
                        <p><strong>{currentUser?.email || "-"}</strong></p>
                     </div>
                     <div>
                        <span>Login</span>
                        <p><strong>{currentUser?.login || "-"}</strong></p>
                     </div>
                     <div> 
                        <span>Rola</span>
                        <p><strong>{displayRole(currentUser?.role)}</strong></p>
                     </div>

                     <div></div>
                     
                     <button type="button" className="ghost-btn edit-profile-btn" onClick={() => { setMode("edit-account"); setError(null); setSuccessMsg(null); }}>
                        <GrEdit size={20} />
                     </button>
                  </div>
               </div>

               <div className="action-row" style={{ marginTop: "8px" }}>
                  <button type="button" className="ghost-btn" onClick={() => { setMode("change-password"); setError(null); setSuccessMsg(null); }} style={{ color: "var(--color-primary)", border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)", width: "100%" }}>
                     Zmień hasło
                  </button>
                  <button type="button" className="ghost-btn" onClick={handleLogout} style={{ color: "var(--color-accent)", border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)", width: "100%" }}>
                     Wyloguj się
                  </button>
               </div>
            </>
         )}

         {/* --- TRYB: EDYCJA DANYCH OSOBOWYCH --- */}
         {mode === "edit-personal" && (
            <form className="page-card page-stack" onSubmit={handlePersonalSubmit}>
               <h2 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Edycja danych osobowych</h2>
               <div className="form-grid">
                  <label className="field-group">
                     <span className="field-label">Imię</span>
                     <input className="field-input" type="text" name="first_name" defaultValue={currentUser?.first_name} />
                  </label>
                  <label className="field-group">
                     <span className="field-label">Nazwisko</span>
                     <input className="field-input" type="text" name="last_name" defaultValue={currentUser?.last_name} />
                  </label>
                  <label className="field-group">
                     <span className="field-label">Rok urodzenia</span>
                     <input className="field-input" type="number" name="birth_year" min={1900} max={new Date().getFullYear()} defaultValue={currentUser?.birth_year} required />
                  </label>
                  <label className="field-group">
                     <span className="field-label">Płeć</span>
                     <select className="field-input field-select" name="gender" defaultValue={currentUser?.gender || ""} required>
                        <option value="" disabled>Wybierz płeć...</option>
                        <option value="female">Kobieta</option>
                        <option value="male">Mężczyzna</option>
                     </select>
                  </label>
               </div>
               <div className="action-row" style={{ marginTop: "12px" }}>
                  <button type="button" className="ghost-btn" onClick={() => setMode("view")}>Anuluj</button>
                  <button type="submit" className="primary-btn" disabled={isSubmitting}>{isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}</button>
               </div>
            </form>
         )}

         {/* --- TRYB: EDYCJA KONTA --- */}
         {mode === "edit-account" && (
            <form className="page-card page-stack" onSubmit={handleAccountSubmit}>
               <h2 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Edycja danych konta</h2>
               <div className="form-grid">
                  <label className="field-group field-group--full">
                     <span className="field-label">Login</span>
                     <input className="field-input" type="text" name="login" defaultValue={currentUser?.login} required />
                  </label>
                  <label className="field-group field-group--full">
                     <span className="field-label">Adres Email</span>
                     <input className="field-input" type="email" name="email" defaultValue={currentUser?.email} required />
                  </label>
               </div>
               <div className="action-row" style={{ marginTop: "12px" }}>
                  <button type="button" className="ghost-btn" onClick={() => setMode("view")}>Anuluj</button>
                  <button type="submit" className="primary-btn" disabled={isSubmitting}>{isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}</button>
               </div>
            </form>
         )}

         {/* --- TRYB: ZMIANA HASŁA --- */}
         {mode === "change-password" && (
            <form className="page-card page-stack" onSubmit={handlePasswordSubmit}>
               <h2 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Zmiana hasła</h2>
               <div className="form-grid">
                  <label className="field-group field-group--full">
                     <span className="field-label">Obecne hasło</span>
                     <input className="field-input" type="password" name="old_password" required />
                  </label>
                  <label className="field-group field-group--full">
                     <span className="field-label">Nowe hasło</span>
                     <input className="field-input" type="password" name="new_password" required />
                  </label>
                  <label className="field-group field-group--full">
                     <span className="field-label">Powtórz nowe hasło</span>
                     <input className="field-input" type="password" name="new_password_repeat" required />
                  </label>
               </div>
               <div className="action-row" style={{ marginTop: "12px" }}>
                  <button type="button" className="ghost-btn" onClick={() => setMode("view")}>Anuluj</button>
                  <button type="submit" className="primary-btn" disabled={isSubmitting}>{isSubmitting ? "Zmienianie..." : "Zmień hasło"}</button>
               </div>
            </form>
         )}

      </section>
   );
}