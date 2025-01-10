import React from 'react';

const Page500: React.FC = () => {
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
      <h1 style={{ fontSize: '3rem', color: 'white' }}>500 - Erreur du serveur 💥</h1>
      <p style={{ fontSize: '1.5rem', color: 'white' }}>
        Oops ! On dirait que quelque chose a explosé du côté serveur. 🙈
      </p>
      <img
        src="https://media.giphy.com/media/3oKIPwoeGErMmaI43S/giphy.gif"
        alt="Serveur en feu"
        style={{ maxWidth: '400px', margin: '20px 0', borderRadius: '8px' }}
      />
      <p style={{ fontSize: '1rem', color: '#888' }}>
        Pas de panique, nos meilleurs ingénieurs sont déjà en train de régler le problème ! 🛠️
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

export default Page500;
