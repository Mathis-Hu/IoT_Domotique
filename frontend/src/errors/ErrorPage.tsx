import React from 'react';

type ErrorPageProps = {
  statusCode?: number;
  message?: string;
};

const ErrorPage: React.FC<ErrorPageProps> = ({ statusCode, message }) => {
  const defaultMessages: { [key: number]: string } = {
    403: "Accès refusé : Tu n'as pas les clés pour cette porte !",
    404: "Page non trouvée : Où es-tu allé chercher ça ? 🙈",
    500: "Erreur serveur : Quelque chose a explosé... 💥",
  };

  const errorMessage = message || defaultMessages[statusCode || 0] || "Oups ! Quelque chose a mal tourné.";

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        //backgroundColor: '#f8f9fa',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '3rem', color: 'white' }}>
        {statusCode ? `${statusCode} - Erreur` : "Erreur"} 🚨
      </h1>
      <p style={{ fontSize: '1.5rem', color: 'white' }}>{errorMessage}</p>
      <img
        src="https://media.giphy.com/media/l3vR85PnGsBwu1PFK/giphy.gif"
        alt="Quelque chose a mal tourné"
        style={{ maxWidth: '400px', margin: '20px 0', borderRadius: '8px' }}
      />
      <p style={{ fontSize: '1rem', color: '#888' }}>
        Peut-être que réessayer ou contacter le support pourrait aider ? 🛠️
      </p>
      <a
        href="/"
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '5px',
          marginTop: '20px',
        }}
      >
        Retour à l'accueil
      </a>
    </div>
  );
};

export default ErrorPage;
