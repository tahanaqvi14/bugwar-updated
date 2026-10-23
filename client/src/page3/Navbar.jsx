import React, { useEffect, useMemo, useRef, useState } from 'react';
import './css/codeeditor.css';
import { useSocket } from '../socket/SocketContext';
import { useStore } from '../../store/Store';
import { gsap } from "gsap";
import { useQuery, gql } from "@apollo/client";


const GET_MATCH = gql`
query Get_matchinfo($matchId: String!) {
  Get_matchinfo(matchId: $matchId) {
    endTime
    serverTime
  }
}
`;

// Format time nicely
const format = ms => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
};

const Navbar = () => {
    const { socket } = useSocket();
    const [timeLeft, setTimeLeft] = useState(0);
    const [displaytext, setdisplaytext] = useState('Game is getting started');

    const matchinfo = useStore((state) => state.data);
    const setData = useStore((state) => state.setData);

    const isEnded = useStore((state) => state.isEnded);
    const setGlobalIsEnded = useStore((state) => state.setIsEnded);

    const DC = useStore((state) => state.DC);

    const boxRef = useRef(null);
    const player = useMemo(() => matchinfo?.participants ?? [], [matchinfo]);

    // The server's clock decides when the match ends; polling corrects the client clock offset
    const { data } = useQuery(GET_MATCH, {
        variables: { matchId: matchinfo?.matchId },
        skip: !matchinfo?.matchId,
        pollInterval: 5000
    });

    useEffect(() => {
        const match = data?.Get_matchinfo;
        if (!match?.endTime || !match.serverTime || DC || isEnded) return;

        // --- TIME OFFSET (server vs client) ---
        const offset = new Date(match.serverTime).getTime() - Date.now();
        const end = new Date(match.endTime).getTime();

        // --- LIVE TIMER LOOP --- (4 updates per second is plenty for a m:ss clock)
        const interval = setInterval(() => {
            const remaining = Math.max(0, end - (Date.now() + offset));
            setTimeLeft(remaining);
            if (remaining === 0) {
                setGlobalIsEnded(true);
                clearInterval(interval);
            }
        }, 250);

        return () => clearInterval(interval);
    }, [data, isEnded, DC, setGlobalIsEnded]);

    useEffect(() => {
        const tl = gsap.timeline();
        tl.fromTo(
            boxRef.current,
            { y: -100, opacity: 0 }, // starts above the screen
            { y: 0, opacity: 1, duration: 2, ease: "power2.out" } // drops down & appears
        )
            .to(
                boxRef.current,
                { y: -100, opacity: 0, duration: 2, delay: 5.3, ease: "power2.in" } // then goes back up & fades out
            );
        return () => tl.kill();
    }, [displaytext]);

    // keep the latest players in a ref for the socket handler
    const playerRef = useRef(player);
    useEffect(() => {
        playerRef.current = player;
    }, [player]);

    useEffect(() => {
        if (!socket) return;

        // updatedMatch comes from the database, so both players always see the same scores
        const onNotify = (username, updatedMatch) => {
            const displayname = playerRef.current.find(p => p.username === username)?.displayname ?? username;
            setdisplaytext(`${displayname} solved a problem!`);
            if (updatedMatch) setData(updatedMatch);
        };
        socket.on('notify', onNotify);

        return () => {
            socket.off('notify', onNotify);
        };
    }, [socket, setData]);

    // Our clock reached 0:00: ask the server to end the match (it also ends it by itself)
    useEffect(() => {
        if (isEnded) socket?.emit('game_over');
    }, [isEnded, socket]);

    return (
        <div className="countdown-page">
            <div className="main-container">
                <div className="top-bar">
                    {/* Countdown Section */}
                    <div className="countdown-container">
                        <div
                            className="countdown-clock"
                            style={{ color: timeLeft <= 0 ? "#FF0000" : "var(--sun-yellow)" }}
                        >
                            {isEnded ? "00:00" : format(timeLeft)}
                        </div>
                    </div>

                    <div>
                        <p className='text-2xl' ref={boxRef}>{displaytext}</p>
                    </div>

                    {/* Players Section */}
                    <div className="players-container">
                        {/* Player 1 */}
                        <div className="player-card">
                            <div className="position-badge position-3">
                                {player[0]?.displayname?.slice(0, 2)?.toUpperCase() || "--"}
                            </div>
                            <div className="player-info">
                                <div className="player-name">{player[0]?.displayname || "Unknown"}</div>
                            </div>
                            <span>Points: {player[0]?.points ?? 0}</span>
                        </div>

                        {/* Player 2 */}
                        <div className="player-card">
                            <div className="position-badge position-4">
                                {player[1]?.displayname?.slice(0, 2)?.toUpperCase() || "--"}
                            </div>
                            <div className="player-info">
                                <div className="player-name">{player[1]?.displayname || "Unknown"}</div>
                            </div>
                            <span>Points: {player[1]?.points ?? 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default Navbar
