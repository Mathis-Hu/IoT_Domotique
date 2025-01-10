import React from 'react';

const Page404: React.FC = () => {
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
      <h1 style={{ fontSize: '3rem', color: 'white' }}>404 - Page non trouvée 🧐</h1>
      <p style={{ fontSize: '1.5rem', color: 'white' }}>
        Oops ! On dirait que cette page a pris des vacances... ou n'a jamais existé ! 🙈
      </p>
      <img
        src="https://media.giphy.com/media/KKOMG9EB7VqBq/giphy.gif"
        alt="Un chien perdu"
        style={{ maxWidth: '400px', margin: '20px 0', borderRadius: '8px' }}
      />
      <p style={{ fontSize: '1rem', color: '#888' }}>
        Peut-être que retourner à l'accueil pourrait aider à retrouver ton chemin ? 🗺️
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

export default Page404;
