import React from "react";
import account from "./images/account.svg";

const History = () => {
    const history = [
        {
            id: 1,
            ourName: "Taha",
            opponentName: "Ali",
            opponentUsername: "ALI_456",
            opponentDisplayName: "Ali",
            ourScore: 3,
            opponentScore: 1,
            status: "Completed",
            playedAt: "2025-11-10T22:30:00Z",
            notes: "Clean performance. All test cases passed instantly.",
        },
        {
            id: 2,
            ourName: "Taha",
            opponentName: "Zaid",
            opponentUsername: "ZAID_12",
            opponentDisplayName: "Zaid",
            ourScore: 2,
            opponentScore: 2,
            status: "Completed",
            playedAt: "2025-11-11T17:00:00Z",
            notes: "Very close match.",
        },
        {
            id: 3,
            ourName: "Taha",
            opponentName: "Sarim",
            opponentUsername: "SARIM77",
            opponentDisplayName: "Sarim",
            ourScore: 1,
            opponentScore: 3,
            status: "Completed",
            playedAt: "2025-11-09T15:10:00Z",
            notes: "Struggled with final test case.",
        },
    ];

    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const resultBadge = (ourScore, oppScore) => {
        const base =
            "inline-block px-3 py-1 rounded-full text-sm font-bold shadow-[2px_2px_0_0_#7f4f0a]";
        if (ourScore > oppScore) return <span className={`${base} bg-green-400 text-[#1b3b1b]`}>Win</span>;
        if (ourScore < oppScore) return <span className={`${base} bg-red-400 text-[#5b100b]`}>Lose</span>;
        return <span className={`${base} bg-gray-300 text-[#3f3f3f]`}>Draw</span>;
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-[#8dc9c0] via-[#f7b96a] to-[#f9a62b] text-[#7a4f0a] select-none font-['Fredoka_One']">
            <div className="w-full max-w-5xl px-6 py-12">
                <div className="w-full p-6 rounded-3xl bg-[#fce9b8] border-4 border-[#7f4f0a] shadow-[6px_6px_0_0_#7f4f0a]">

                    {/* Header */}
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="rounded-full border-4 border-[#8a5f1a] p-1">
                            <img alt="history avatar" className="rounded-full" src={account} width="64" height="64" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-[#7a4f0a]">Competition History</h1>
                            <p className="text-sm text-[#7a4f0a] opacity-80">All past matches played by you</p>
                        </div>
                    </div>

                    {/* History Table */}
                    {/* History Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto border-collapse border border-[#7f4f0a] text-center">
                            <thead>
                                <tr className="bg-[#fff4d6]">
                                    <th className="border border-[#7f4f0a] px-4 py-2">Date & Time</th>
                                    <th className="border border-[#7f4f0a] px-4 py-2">Player 1 & score</th>
                                    <th className="border border-[#7f4f0a] px-4 py-2">Player 2 & score</th>
                                    <th className="border border-[#7f4f0a] px-4 py-2">Winner</th>
                                    <th className="border border-[#7f4f0a] px-4 py-2">Result</th>
                                    <th className="border border-[#7f4f0a] px-4 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((match) => {
                                    const winner =
                                        match.ourScore > match.opponentScore
                                            ? match.ourName
                                            : match.opponentScore > match.ourScore
                                                ? match.opponentName
                                                : "Draw";

                                    return (
                                        <tr key={match.id} className="hover:bg-[#fff1c0]">
                                            <td className="border border-[#7f4f0a] px-2 py-1">{formatDate(match.playedAt)}</td>
                                            <td className="border border-[#7f4f0a] px-2 py-1">
                                                {match.ourName} ({match.ourScore})
                                            </td>
                                            <td className="border border-[#7f4f0a] px-2 py-1">
                                                {match.opponentName} ({match.opponentScore})
                                            </td>
                                            <td className="border border-[#7f4f0a] px-2 py-1">{winner}</td>
                                            <td className="border border-[#7f4f0a] px-2 py-1">{resultBadge(match.ourScore, match.opponentScore)}</td>
                                            <td className="border border-[#7f4f0a] px-2 py-1">{match.status}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>



                </div>
            </div>
        </div>
    );
};

export default History;
