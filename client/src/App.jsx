import React, { createContext, useState } from 'react';
import Page1 from './Login-Signup/Page1';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Secondpage from './page2/Secondpage';
import Login from './Login-Signup/Components/Login';
import Singup from './Login-Signup/Components/Singup';
import Gamingpage from './page3/Gamingpage'
import CodeEditor from './page3/CodeEditor';
import Mainmenu from './page2/Mainmenu'
import Leaderboard from './page2/Leaderboard';
import Profile from './page2/Profile';
import Popup from './page3/Popup';
import Admin from './Admin/Admin'
import Loginn from './Admin/Loginn'
import Newchallenge from './Admin/Newchallenge'
import History from './page2/History';
import Secondpag from './Login-Signup/Components/Secondpag';

// Create Socket.IO context to share socket instance
export const SocketContext = createContext();

const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: 'http://localhost:1509/graphql',
  credentials: 'include',
});

// Initialize socket once outside the component (so it doesn't reconnect on every render)

const App = () => {
  const [socket, setSocket] = useState(null);

  const connectSocket = () => {
    if (!socket) {
      const newSocket = io('http://localhost:1509', { withCredentials: true });
      setSocket(newSocket);
    }
  };

  // If you want, you can also manage user state here or in Apollo cache

  return (
    <Router>
      <ApolloProvider client={client}>
        <SocketContext.Provider value={socket}>
          <ToastContainer position="top-center" autoClose={3000} />
          <Routes>

            {/* Pass connectSocket down to Login */}
            <Route path="/" element={<Singup/>} />
            {/* <Route path="/" element={<Login connectSocket={connectSocket} />} /> */}
            <Route path="/admin" element={<Loginn/>} />
            <Route path="/admin/adminpage" element={<Admin/>} />

            <Route path="/admin/newchallenge" element={<Newchallenge/>} />
            {/* <Route path="/" element={<Admin/>} /> */}
            <Route path="/codeeditor" element={<CodeEditor />}/>
            {/* <Route path="/gamepage" element={<CodeEditor />}/> */}
            {/* <Route path="/" element={<Login connectSocket={connectSocket} />} /> */}
            {/* <Route path="/gamepage" element={<Gamingpage />} /> */}
            <Route path="/signup" element={<Singup />}/>

            {/* <Route path="/page2" element={<Secondpage />} /> */}
            <Route path="/page2" element={<Mainmenu />}/>
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </SocketContext.Provider>
      </ApolloProvider>
    </Router>


  );
};

export default App;
