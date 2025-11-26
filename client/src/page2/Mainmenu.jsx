// if (loading) return <p>Loading...</p>;
// if (error) return <p>Error: {error.message}</p>;
import React, { useContext, useEffect, useState } from 'react';
import "./Mainmenu.css";
import { useQuery, gql } from '@apollo/client';
import profile from "./images/profile.svg";
import game from "./images/game.svg";
import trophy from "./images/trophy.svg";
import { useNavigate } from 'react-router-dom';
import Secondpage from "./Secondpage";

//arif ka module ha yeh

const DISPLAY_NAME_QUERY = gql`
  query MainMenu {
    Main_menu {
      displayname
    }
  }
`;

const Mainmenu = () => {
  const navigate = useNavigate();
  const [showCard, setShowCard] = useState(false);

  const { loading, error, data } = useQuery(DISPLAY_NAME_QUERY);
  const displayname = data?.Main_menu?.displayname;

  useEffect(() => {
    if (error?.message?.includes("Not authenticated")) {
      const timer = setTimeout(() => navigate("/"), 2000);
      return () => clearTimeout(timer);
    }
  }, [error, navigate]);

  if (loading)
    return (
      <p className="text-center mt-10 text-lg">Loading Main Menu...</p>
    )

  if (error) {
    if (error.message.includes("Not authenticated")) {
      return (
        <div>
          <p className="text-center mt-10 text-lg text-red-600">
            You need to log in to view this page
          </p>
          <p className="text-center mt-10 text-lg text-red-600">
            You will be redirected to the login page in 2 seconds
          </p>
        </div>
      );
    }
    return (
      <p className="text-center mt-10 text-lg text-red-600">
        An error occurred
      </p>
    );
  }



  return (
    <div className="welcome-page">
      <h1>Welcome, {displayname || 'Guest'}!</h1>
      <p className="subtitle">Choose your next challenge and climb the ranks</p>

      <div className="card-container">
        <div className="big_card">
          <div className="container">
            <div className="header">
              <div>
                <img src={profile} alt="Profile" style={{ width: "80px" }} />
                <div className="title">User Profile</div>
                <div className="subtitle">
                  Manage your account <br />
                  <span>and stats</span>
                </div>
                <a onClick={() => navigate('/profile')} className="play-btn">
                  Open Profile
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="big_card">
          <div className="container">
            <div className="header">
              <div>
                <img src={game} alt="Game" style={{ width: "80px" }} />
                <div className="title">Start Game</div>
                <div className="subtitle">
                  Begin a new coding <br />
                  <span>challenge</span>
                </div>
                <a onClick={() => setShowCard(true)} className="play-btn">
                  Play Now
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="big_card">
          <div className="container">
            <div className="header">
              <div>
                <img src={trophy} alt="Leaderboard" style={{ width: "80px" }} />
                <div className="title">Leaderboard</div>
                <div className="subtitle">
                  View rankings and <br />
                  <span>compete with others</span>
                </div>
                <a onClick={() => navigate('/leaderboard')} className="play-btn">
                  View Ranking
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 💳 Show the card when button clicked */}
      {showCard && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}>
          <Secondpage onClose={() => setShowCard(false)} />
        </div>
      )}
    </div>
  );
};

export default Mainmenu;
