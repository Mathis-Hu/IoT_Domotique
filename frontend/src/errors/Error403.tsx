import React from 'react';

const Page403: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        //backgroundColor: 'black',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '3rem', color: 'white' }}>403 - Accès refusé 🚫</h1>
      <p style={{ fontSize: '1.5rem', color: 'white' }}>
        Oops ! Il semble que tu n’aies pas les clés pour entrer ici. 🤔
      </p>
      <img
        src="https://media.giphy.com/media/3og0IKMmj5pGRWe9uo/giphy.gif"
        alt="Un chat frustré"
        style={{ maxWidth: '400px', margin: '20px 0', borderRadius: '8px' }}
      />
      <p style={{ fontSize: '1rem', color: '#888' }}>
        Peut-être que demander gentiment au propriétaire du site pourrait aider ? 🧐
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

export default Page403;
