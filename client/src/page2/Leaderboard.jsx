import React, { useEffect } from "react";
import "./Leaderboard.css";
import { gql, useQuery } from "@apollo/client";
import trophy from "./images/trophy-copy.svg";
import scroll from "./images/scroll.svg";
import { useNavigate } from 'react-router-dom';
// GraphQL query
const GET_LEADERBOARD_INFO = gql`
  query LeaderBoardInfo {
    LeaderBoard_Info {
      username
      displayname
      points
    }
  }
`;

const Leaderboard = () => {
    const navigate = useNavigate();
    // cache-and-network: show the last list instantly, then refresh it (points change after every match)
    const { data, loading, error } = useQuery(GET_LEADERBOARD_INFO, { fetchPolicy: 'cache-and-network' });
    const users = data?.LeaderBoard_Info || [];

    useEffect(() => {
        if (error?.message?.includes("Not authenticated")) {
            const timer = setTimeout(() => navigate("/"), 2000);
            return () => clearTimeout(timer);
        }
    }, [error, navigate]);

    if (loading && !data)
        return (
            <p className="text-center mt-10 text-lg">Loading leaderboard...</p>
        );

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
        <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-[#8dc9c0] via-[#f7b96a] to-[#f9a62b] relative">
            <div className="mt-8 rounded-3xl bg-[#fce9b8] border-4 border-[#7f4f0a] shadow-[6px_6px_0_0_#7f4f0a] w-full max-w-md p-6 flex flex-col gap-4 text-[#5a3a1a]">
                {/* Header */}
                <div className="flex items-center text-3xl font-bold gap-3 select-none">
                    <img
                        alt="Gold trophy emoji icon"
                        className="w-8 h-8"
                        height="32"
                        src={trophy}
                        width="32"
                    />
                    Leaderboard
                </div>

                {/* Scrollable list */}
                <div
                    className="w-full flex flex-col h-72 overflow-y-auto gap-4 text-[#5a3a1a]"
                    id="no-scrollbar"
                >
                    {users.map((user, index) => (
                        <div
                            key={user.username}
                            className="flex items-center justify-between bg-[#f7d25a] rounded-2xl px-5 py-3 text-xl font-semibold select-none hover:bg-[#fdd246]"
                        >
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-2xl">{index + 1}.</span>
                                {user.displayname}
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span>{user.points}</span>
                                <span className="text-lg font-normal">pts</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-1 text-lg font-semibold select-none mt-2">
                    Scroll!
                    <img alt="Hourglass emoji icon" className="w-6 h-6" src={scroll} />
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
