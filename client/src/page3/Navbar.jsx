import React, { useEffect, useRef, useState, useContext } from 'react';
import './css/codeeditor.css';
import { SocketContext } from '../App';
import { useStore } from '../../store/Store';
import { gsap } from "gsap";
import { useQuery, gql, useLazyQuery } from "@apollo/client";


const GET_MATCH = gql`
query Get_matchinfo($matchId: String!) {
  Get_matchinfo(matchId: $matchId) {
    endTime
    serverTime
  }
}
`;

const Navbar = () => {
    const socket = useContext(SocketContext)
    const [player, setplayerinfo] = useState([])
    const [timeLeft, setTimeLeft] = useState(0);
    const [timeOffset, setTimeOffset] = useState(0);
    // const [isEnded, setIsEnded] = useState(false);
    const [displaytext, setdisplaytext] = useState('Game is getting started1');

    const matchinfo = useStore((state) => state.data);
    const setData = useStore((state) => state.setData);

    const isEnded = useStore((state) => state.isEnded);
    const setGlobalIsEnded = useStore((state) => state.setIsEnded);

    const DC = useStore((state) => state.DC);

    // const [timeLeft, setTimeLeft] = useState(5 * 60 + 23);
    const boxRef = useRef(null);
    const intervalRef = useRef(null); // ✅ Added interval ref

    useEffect(() => {
        if (matchinfo?.participants) {
            setplayerinfo(matchinfo.participants);
        }
    }, [matchinfo])

    const { data, loading, error } = useQuery(GET_MATCH, {
        variables: { matchId: matchinfo.matchId },
        pollInterval: 5000
    });

    useEffect(() => {
        if (!data || !data.Get_matchinfo || DC) return; // ✅ Stop timer when DC is true

        const match = data.Get_matchinfo; // ✅ define match here

        if (!match.endTime || !match.serverTime) return; // optional safety check

        // --- TIME OFFSET (server vs client) ---
        const serverNow = new Date(match.serverTime).getTime();
        const clientNow = Date.now();
        const offset = serverNow - clientNow;
        setTimeOffset(offset);

        const end = new Date(match.endTime).getTime();

        // --- LIVE TIMER LOOP ---
        intervalRef.current = setInterval(() => { // ✅ Using intervalRef
            const now = Date.now() + offset;
            const remaining = Math.max(0, end - now);
            setTimeLeft(remaining);
            if (remaining === 0 && !isEnded) {
                setGlobalIsEnded(true)
                clearInterval(intervalRef.current); // ✅ Using intervalRef
            }
        }, 50);

        return () => clearInterval(intervalRef.current); // ✅ Using intervalRef
    }, [data, isEnded, DC]); // ✅ Added DC to dependencies

    // if (loading) return <p>Loading match…</p>;
    // if (error) return <p>Error: {error.message}</p>;


    // Format time nicely
    const format = ms => {
        const total = Math.floor(ms / 1000);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };


    // useEffect(() => {
    //     if (timeLeft <= 0) return;
    //     const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    //     return () => clearTimeout(timer);
    //   }, [timeLeft]);
    //   const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    //   const seconds = String(timeLeft % 60).padStart(2, "0");


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

    }, [displaytext]);


    // 1️⃣ create a ref for player
    const playerRef = useRef(player);

    // 2️⃣ keep the ref updated
    useEffect(() => {
        playerRef.current = player;
    }, [player]);

    useEffect(() => {
        if (!socket) return;

        socket.on('notify', (data, updatedMatch) => {
            console.log(data)
            console.log(updatedMatch)
            let displayname = playerRef.current.find(p => p.username === data)?.displayname;
            console.log(displayname)
            setdisplaytext(`${displayname} solved a problem!`)
            setData(updatedMatch)
        })
        
        return () => {            
            socket.off('notify');
        };

    }, [socket]);

    useEffect(()=>{
        if(isEnded){
            socket.emit('game_over',matchinfo,socket.id);
        }
    },[isEnded])

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