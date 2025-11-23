import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from 'react-router-dom';
import account from "./images/account.svg";
import edit from "./images/edit.svg";
import sound from "./images/sound.svg";
import save from "./images/save.svg";
import cross from "./images/cross.svg";
import { useApolloClient } from "@apollo/client";
import History from './History';



const PROFILE_MUTATION = gql`
mutation Update($input: updateuser!) {
    Update(input: $input) {
        displayname
        }
        }
`;

const LOGOUT_MUTATION = gql`
mutation Logout {
    logout {
        success
        message
    }
    }
    `;


const GET_PROFILE_INFO = gql`
    query {
        FindUserForProfile {
            displayname
            username
            email
            }
  }`



const Profile = () => {
    const client = useApolloClient();
    const navigate = useNavigate();
    const [showOTPPage, setShowOTPPage] = useState(false)

    // GraphQL hooks
    const { data, loading, error } = useQuery(GET_PROFILE_INFO);
    const [updateProfile] = useMutation(PROFILE_MUTATION);
    const [logoutProfile] = useMutation(LOGOUT_MUTATION);


    const users = data?.FindUserForProfile;

    // Local states
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [tempName, setTempName] = useState('');

    // Update state when query data arrives
    useEffect(() => {
        if (users) {
            setDisplayName(users.displayname || '');
            setTempName(users.displayname || '');
        }
    }, [users]);

    useEffect(() => {
        if (error?.message?.includes("Not authenticated")) {
            const timer = setTimeout(() => navigate("/"), 2000);
            return () => clearTimeout(timer);
        }
    }, [error, navigate]);

    // Handlers
    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            await updateProfile({
                variables: { input: { newdisplayname: tempName } },
            });
            setDisplayName(tempName.trim() || "Unnamed");
            setIsEditing(false);
            toast.success("Profile updated successfully!");
            window.location.reload();
        } catch (err) {
            toast.error("Failed to update profile!");
        }
    };

    const handleCancel = () => {
        setTempName(displayName);
        setIsEditing(false);
    };

    const handleLogout = async () => {
        try {
            const res = await logoutProfile(); // call the GraphQL logout mutation
            const { success, message } = res.data.logout;

            if (success) {
                await client.clearStore();

                toast.success(message || "Logged out successfully!");
                // wait a bit to let the toast show, then redirect
                setTimeout(() => {
                    navigate("/"); // go back to login/home page
                }, 1000);
            } else {
                toast.error(message || "Logout failed!");
            }
        } catch (err) {
            console.error("Logout error:", err);
            toast.error("Logout failed! Please try again.");
        }
    };


    if (loading)
        return (
            <p className="text-center mt-10 text-lg">Loading Profile...</p>
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

    async function changepwd() {
        setShowOTPPage(true);
    }


    return (
        <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-[#8dc9c0] via-[#f7b96a] to-[#f9a62b] text-[#7a4f0a] select-none font-['Fredoka_One']">
            {/* <ToastContainer />` */}
            <div className="min-h-screen flex items-center justify-center px-6 py-12">

                <div className="w-[420px] p-6 rounded-3xl bg-[#fce9b8] border-4 border-[#7f4f0a] shadow-[6px_6px_0_0_#7f4f0a]">

                    {/* PROFILE SECTION */}
                    <div className="flex items-center space-x-6 mb-3">
                        <div className="flex-shrink-0 rounded-full border-4 border-[#8a5f1a] p-1">
                            <img
                                alt="User avatar"
                                className="rounded-full"
                                height="96"
                                src={account}
                                width="96"
                            />
                        </div>
                        <div>
                            <p className="text-3xl font-semibold drop-shadow-sm">Username</p>
                            <p className="text-2xl text-[#b36b00]">{users?.username || '...'}</p>
                        </div>
                    </div>

                    {/* ACCOUNT INFO */}
                    <div className="border-t-4 border-[#d6c6a6] pt-6 mt-3 space-y-6">
                        <div className="flex items-start justify-between" id="displayNameSection">
                            <div className="flex flex-col text-2xl w-full">
                                <span className="text-2xl font-medium drop-shadow-sm mb-1">Display Name</span>

                                {/* Text or Input */}
                                {!isEditing ? (
                                    <p className="text-2xl text-[#b36b00]">{displayName || 'Unnamed'}</p>
                                ) : (
                                    <div className="flex items-center space-x-3 w-full h-[2rem]">
                                        <input
                                            type="text"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            className="border-b-2 border-[#b36b00] bg-transparent text-[#b36b00] text-2xl focus:outline-none w-full"
                                            autoFocus
                                        />
                                        <img
                                            onClick={handleSave}
                                            className="w-7 hover:scale-110 transition"
                                            src={save}
                                        />
                                        <img
                                            onClick={handleCancel}
                                            className="w-7 hover:scale-110 transition"
                                            src={cross}
                                            alt="Cancel"
                                        />

                                    </div>
                                )}
                            </div>

                            {!isEditing && (
                                <img
                                    onClick={handleEditClick}
                                    alt="Edit display name"
                                    src={edit}
                                    className="w-9 h-9 cursor-pointer hover:scale-110 transition ml-4"
                                />
                            )}
                        </div>
                    </div>

                    {/* LOGOUT BUTTON */}
                    <div className="pt-8 mt-1 flex justify-between text-center">
                        <button
                            onClick={handleLogout}
                            className="text-2xl font-bold text-[#b84b00] transition-transform duration-200 cursor-pointer"
                        >
                            Logout 🚪
                        </button>

                        <button
                            onClick={changepwd}
                            className="text-2xl font-bold text-[#b84b00] transition-transform duration-200 cursor-pointer"

                        >
                            Change Password
                        </button>

                    </div>
                </div>
                {/* <history />` */}
                {users?.username && <History username={users.username} />}
            </div>
            {/* OTP Page */}
            {showOTPPage && (
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
                    <Secondpag
                        userData={users.email}
                        onClose={() => setShowOTPPage(false)} />
                </div>
            )}
        </div>
    );
};

export default Profile;
