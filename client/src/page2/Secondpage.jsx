import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';
import { SocketContext } from '../App';
import { useStore  } from '../../store/Store';

const Secondpage = ({ onClose }) => {
  const setData = useStore((state) => state.setData);
  const setclientusername = useStore((state) => state.setclientusername);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const [textToDisplay, setTextToDisplay] = useState('Searching for a user...');
  // const [usernames, setUsernames] = useState([]);
  // const [personal_username, setPersonalUsername] = useState('');

  useEffect(() => {
    if (!socket) return;

    console.log(`Socket connected in Secondpage: ${socket.id}`);

    socket.on('welcome', (data) => {
      // setPersonalUsername();
      setclientusername(data.username)
    });

    socket.emit('joinRoom');

    socket.on('2players_connected', (data) => {
      console.log(data.matchinfo);
      // setUsernames(data.matchinfo.participants.map((p) => p.displayName));
      setTextToDisplay('Starting the competition');
      setData(data.matchinfo);

      setTimeout(() => {
        navigate('/codeeditor');
      }, 3000);
    });

    return () => {
      socket.off('2players_connected');
      socket.off('welcome');
    };
  }, [socket]);

  // 🔴 Cancel search handler
  const handleCancelSearch = () => {
    if (socket) {
      socket.emit('cancel_search', socket.id)
      onClose(); // this will hide the overlay in Mainmenu
      console.log('Cancel search emitted:', socket.id);
    }
    // navigate('/');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>

      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          borderRadius: '12px',
          padding: '20px 30px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          maxWidth: '400px',
          textAlign: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
      >

        <div>
          <button onClick={handleCancelSearch} style={{
            position: 'absolute',
            top: '10px',
            right: '5px',
            backgroundColor: 'red',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(255, 0, 0, 0.4)',
          }}
            title="Cancel search"
          >
            ✕
          </button>
          <p id="one">{textToDisplay}</p>
          <div className="lds-ellipsis">
            <div></div><div></div><div></div><div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Secondpage;