import React from 'react';
// Keep these page imports in this order: several pages share CSS rules (body, #loader, .button1, ...)
// and the order the stylesheets are loaded in decides which rule wins.
import Singup from './Login-Signup/Components/Singup';
import Login from './Login-Signup/Components/Login';
import './page2/Signup.css';
import CodeEditor from './page3/CodeEditor';
import Mainmenu from './page2/Mainmenu'
import Leaderboard from './page2/Leaderboard';
import Profile from './page2/Profile';
import Admin from './Admin/Admin'
import Loginn from './Admin/Loginn'
import Newchallenge from './Admin/Newchallenge'
import { ApolloProvider } from '@apollo/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { client } from './apolloClient';
import SocketProvider from './socket/SocketProvider';

const App = () => {
  return (
    <Router>
      <ApolloProvider client={client}>
        <SocketProvider>
          {/* The only ToastContainer in the app (more than one shows every toast twice) */}
          <ToastContainer position="top-center" autoClose={3000} />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Singup />} />
            <Route path="/page2" element={<Mainmenu />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/codeeditor" element={<CodeEditor />} />
            <Route path="/admin" element={<Loginn />} />
            <Route path="/admin/adminpage" element={<Admin />} />
            <Route path="/admin/newchallenge" element={<Newchallenge />} />
          </Routes>
        </SocketProvider>
      </ApolloProvider>
    </Router>
  );
};

export default App;
