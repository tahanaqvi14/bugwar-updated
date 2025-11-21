import React from 'react';
import medal from './medal.svg';
import { useQuery, gql } from "@apollo/client";
import { useStore } from '../../store/Store';

const GET_MATCH = gql`
query GetMatchInfo($matchId: String!) {
  Get_matchinfo(matchId: $matchId) {
    matchId
    participants {
      username
      points
      displayname
    }
    winner
    status
  }
}
`;

const Popup = () => {
  const isEnded = useStore((state) => state.isEnded);
  const DC = useStore((state) => state.DC);
  const matchinfo = useStore((state) => state.data);

  const { data, loading, error } = useQuery(GET_MATCH, {
    variables: { matchId: matchinfo.matchId },
    fetchPolicy: "no-cache",
    skip: !(isEnded || DC),
  });

  console.log(data);

  let winnerData;
  if (loading) return null;
  if (error) return <div>Error loading match info</div>;
  if (!data || !data.Get_matchinfo) return null;

  const matchData = data.Get_matchinfo;
  if (matchData.winner !== 'N') {
    winnerData = matchData.participants.find(p => p.username === matchData.winner);
  }
  console.log(matchData)

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '20px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        padding: '40px 50px', maxWidth: '450px', textAlign: 'center',
        color: '#fac48c', animation: 'fadeInScale 0.4s ease-out'
      }}>
        <img src={medal} alt="Victory Medal" style={{ width: '90px', filter: 'drop-shadow(0 0 10px rgba(247, 141, 30, 0.5))' }} />
        {/* Winner Card */}
        <div className="bg-[#EFB53B] w-full rounded-lg shadow-lg text-center mt-4">
          <div className="text-white text-lg font-semibold">⭐ {winnerData ? 'Winner' : "It's a tie"}⭐</div>
          {winnerData && (
            <>
              <div className="text-3xl font-extrabold text-black">{winnerData.displayname}</div>
              <div className="text-gray-500 text-xl mt-2">{winnerData.points} points</div>
            </>
          )}
        </div>

        {/* Participants Standings */}
        <div className="w-full text-white rounded-lg mx-auto mt-5">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-orange-400">
            <span>🏆</span> Final Standings
          </h2>

          <div className="flex flex-col space-y-3 max-h-80 overflow-y-auto pr-2">
            {matchData.participants.map((p, index) => {
              const note = matchData.status === "Interrupted" && p.username !== matchData.winner
                ? " (LEFT EARLY)"
                : "";

              return (
                <div key={p.username} className="flex justify-between items-center bg-[#2b2b2b] rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300 text-xl">{index === 0 ? '🥇' : '🥈'}</span>
                    <span className="font-semibold">{p.displayname}{note}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{p.points}</span>
                    <div className="text-xs text-gray-300">points</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p style={{ fontSize: '1rem', fontStyle: 'italic', color: '#a66b2c', marginTop: '20px' }}>
          You will be redirected to the main menu in a while...
        </p>
      </div>

      <style>
        {`
          @keyframes fadeInScale {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default Popup;
