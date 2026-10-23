import React from "react";
import { useQuery, gql } from '@apollo/client';

// The server returns the matches of the logged-in user (newest first)
const GET_ALL_MATCH = gql`
  query GetAllMatches {
    Get_allmatch {
      matchId
      winner
      status
      matchDate
      endTime
      participants {
        username
        points
        displayname
      }
    }
  }
`;

const History = () => {
  // Always ask the server, so a match that just ended shows up straight away
  const { data: allmatchinfo, loading, error } = useQuery(GET_ALL_MATCH, {
    fetchPolicy: 'cache-and-network'
  });

  const crown = "👑";
  const drawIcon = "🤝";

  // Format ISO date to readable date
  const formatDate = (isoDate) => new Date(isoDate).toLocaleString();

  const matches = allmatchinfo?.Get_allmatch ?? [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-b from-[#8dc9c0] via-[#f7b96a] to-[#f9a62b] text-[#7a4f0a] select-none font-['Fredoka_One']">
      <div className="w-full max-w-5xl px-6 py-12">
        <div className="w-full p-6 rounded-3xl bg-[#fce9b8] border-4 border-[#7f4f0a] shadow-[6px_6px_0_0_#7f4f0a]">

          {/* Header */}
          <div className="flex justify-between space-x-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#7a4f0a]">Competition History</h1>
              <p className="text-sm text-[#7f4f0a] opacity-80">All past matches played by you</p>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-6 bg-[#fff4d6] border-4 border-[#7f4f0a] rounded-2xl px-4 py-3 shadow-[4px_4px_0_0_#7f4f0a]">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👑</span>
                <span className="font-bold text-[#7f4f0a]">Winner</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-2xl">🤝</span>
                <span className="font-bold text-[#7f4f0a]">Draw Match</span>
              </div>
            </div>
          </div>

          {/* Loading / Error */}
          {loading && !allmatchinfo && <p className="text-center text-lg">Loading matches...</p>}
          {error && <p className="text-center text-red-600">Failed to load matches.</p>}

          {/* Scrollable Table Slider / Empty State */}
          {allmatchinfo && !error && (
            matches.length === 0 ? (
              <div className="w-full max-w-[800px] h-[400px] flex items-center justify-center mx-auto">
                <p className="text-xl font-bold text-[#7f4f0a] text-center">
                  No matches found — you haven&apos;t played any matches yet.
                </p>
              </div>
            ) : (
              <div className="w-full max-w-[800px] h-[400px] overflow-x-hidden overflow-y-auto border border-[#7f4f0a] rounded-xl shadow-md mx-auto scrollbar-thin scrollbar-thumb-[#7f4f0a] scrollbar-track-[#fff4d6]">
                <div className="min-w-[700px]">
                  <table className="table-auto border-collapse border border-[#7f4f0a] text-center w-full">
                    <thead>
                      <tr className="bg-[#fff4d6]">
                        <th className="border border-[#7f4f0a] px-4 py-2">Date & Time</th>
                        <th className="border border-[#7f4f0a] px-4 py-2">Player 1 & Score</th>
                        <th className="border border-[#7f4f0a] px-4 py-2">Player 2 & Score</th>
                        <th className="border border-[#7f4f0a] px-4 py-2">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {matches.map((match) => {
                        const p1 = match.participants[0];
                        const p2 = match.participants[1] ?? { displayname: '-', points: 0 };

                        // winner is "N" for a draw, otherwise the winner's username (also for interrupted matches)
                        const isDraw = match.status === "Completed" && match.winner === "N";

                        let p1Icon = "";
                        let p2Icon = "";

                        if (isDraw) {
                          p1Icon = drawIcon;
                          p2Icon = drawIcon;
                        } else if (match.winner === p1.username) {
                          p1Icon = crown;
                        } else if (match.winner === p2.username) {
                          p2Icon = crown;
                        }

                        return (
                          <tr key={match.matchId} className="hover:bg-[#fff1c0]">
                            <td className="border border-[#7f4f0a] px-2 py-1">{formatDate(match.matchDate)}</td>
                            <td className="border border-[#7f4f0a] px-2 py-1">{p1Icon} {p1.displayname} ({p1.points})</td>
                            <td className="border border-[#7f4f0a] px-2 py-1">{p2Icon} {p2.displayname} ({p2.points})</td>
                            <td className="border border-[#7f4f0a] px-2 py-1">
                              {match.status === "Completed"
                                ? (isDraw ? "Draw" : "Completed")
                                : match.status === "Interrupted" ? "Interrupted" : "In progress"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
};

export default History;
