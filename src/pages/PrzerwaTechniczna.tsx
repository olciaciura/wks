export default function PrzerwaTechniczna() {
   return (
      <div 
         className="page-container" 
         style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "flex-start", 
            height: "100vh", 
            textAlign: "center",
            padding: "20px",
            paddingTop: "100px",
            
            backgroundColor: "rgba(20, 20, 20, 1)", 
            color: "white", 
            
            backgroundImage: `
               linear-gradient(
                  to bottom, 
                  rgba(20, 20, 20, 1) 35%,   
                  rgba(20, 20, 20, 0.8) 45%,  
                  rgba(20, 20, 20, 0) 100%
               ),
               url('/mapa.jpg') 
            `,
            backgroundPosition: "-150px 80px",
            backgroundSize: "cover",
            backgroundRepeat: "repeat-x"
         }}
      >
         {/* Dodany zIndex upewnia się, że tekst zawsze jest "nad" tłem */}
         <h1 style={{ zIndex: 1, textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
            Przerwa techniczna
         </h1>
         <p style={{ marginTop: "1.2rem", fontSize: "1.2rem", maxWidth: "600px", zIndex: 1, opacity: 0.8 }}>
            Przepraszamy, strona jest chwilowo niedostępna z powodu prac konserwacyjnych.<br /> Prosimy spróbować ponownie później.
         </p>
      </div>
   );
}