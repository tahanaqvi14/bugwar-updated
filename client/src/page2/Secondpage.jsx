import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Signup.css';
import { useSocket } from '../socket/SocketContext';
import { useStore } from '../../store/Store';

const Secondpage = ({ onClose }) => {
  const setData = useStore((state) => state.setData);
  const setclientusername = useStore((state) => state.setclientusername);
  const { socket, connectSocket } = useSocket();
  const navigate = useNavigate();

  const [textToDisplay, setTextToDisplay] = useState('Searching for a user...');
  const [matchStarted, setMatchStarted] = useState(false);
  const matchFound = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // No game connection yet (e.g. the server was asleep when the page loaded): try to connect now
  useEffect(() => {
    if (socket) return;
    let cancelled = false;
    setTextToDisplay('Connecting to the game server...');
    connectSocket().then((connected) => {
      if (cancelled || connected) return;
      toast.error('Could not connect to the game server. Please log in again.');
      onCloseRef.current();
    });
    return () => { cancelled = true; };
  }, [socket, connectSocket]);

  useEffect(() => {
    if (!socket) return;
    let navigateTimer = null;
    setTextToDisplay('Searching for a user...');

    const onWelcome = (data) => setclientusername(data.username);
    const onMatchFound = (data) => {
      matchFound.current = true;
      setMatchStarted(true);
      setTextToDisplay('Starting the competition');
      setData(data.matchinfo);
      navigateTimer = setTimeout(() => navigate('/codeeditor'), 3000);
    };
    const onSearchError = (data) => {
      toast.error(data?.message || 'Could not search for a match');
      onCloseRef.current();
    };

    socket.on('welcome', onWelcome);
    socket.on('2players_connected', onMatchFound);
    socket.on('search_error', onSearchError);
    socket.emit('joinRoom');

    return () => {
      clearTimeout(navigateTimer);
      socket.off('welcome', onWelcome);
      socket.off('2players_connected', onMatchFound);
      socket.off('search_error', onSearchError);
      // Leaving this screen (cancel button, back button, ...) without a match: stop searching
      if (!matchFound.current) socket.emit('cancel_search');
    };
  }, [socket, navigate, setData, setclientusername]);

  // 🔴 Cancel search handler (the effect cleanup above tells the server)
  const handleCancelSearch = () => {
    onClose(); // this will hide the overlay in Mainmenu
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
          {!matchStarted && <button onClick={handleCancelSearch} style={{
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
          </button>}
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
