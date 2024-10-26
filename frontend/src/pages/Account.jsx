import React, { useEffect, useState } from 'react';
import { getAuth, updateProfile, updatePassword, deleteUser } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { EmailAuthProvider, reauthenticateWithCredential, signOut } from "firebase/auth";
import Sidebar from '../components/Sidebar';
import ConfirmationModal from '../components/ConfirmationModal';

const Account = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const storage = getStorage();

    const [username, setUsername] = useState(user?.displayName || "");
    const [avatar, setAvatar] = useState(user?.photoURL || process.env.REACT_APP_DEFAULT_AVATAR_URL);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [reenterPassword, setReenterPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [uploading, setUploading] = useState(false);
    const [usernameError, setUsernameError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const MAX_USERNAME_LENGTH = 15;

    useEffect(() => {
        if (errorMessage || successMessage) {
            const timer = setTimeout(() => {
                setErrorMessage("");
                setSuccessMessage("");
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [errorMessage, successMessage]);

    const sanitizeUsername = (username) => {
        return username.replace(/[<>{}]/g, '').trim();
    };

    const handleUsernameChange = (e) => {
        const inputUsername = sanitizeUsername(e.target.value);
        if (inputUsername.length > MAX_USERNAME_LENGTH) {
            setUsernameError(`Username cannot be longer than ${MAX_USERNAME_LENGTH} characters.`);
        } else {
            setUsernameError("");
        }
        setUsername(inputUsername);
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setErrorMessage("No file selected");
            return;
        }

        if (!file.type.startsWith('image/')) {
            setErrorMessage("Please upload a valid image file (jpg, png, gif)");
            return;
        }

        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            setErrorMessage("File size exceeds 5MB. Please upload a smaller image.");
            return;
        }
        setErrorMessage("");
        const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        setUploading(true);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            },
            (error) => {
                console.error('Upload failed:', error);
                setErrorMessage("Error uploading avatar: " + error.message);
                setUploading(false);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    console.log("Download URL: ", downloadURL);
                    setAvatar(downloadURL);
                    setSuccessMessage("Avatar uploaded successfully");
                    setUploading(false);
                }).catch(error => {
                    console.error("Error getting download URL:", error);
                    setErrorMessage("Error retrieving avatar URL");
                    setUploading(false);
                });
            }
        );
    };

    const handlePasswordChange = () => {
        if (newPassword.length < 8) {
            setErrorMessage("Password must be at least 8 characters long.");
            return;
        }
        if (!/[A-Z]/.test(newPassword)) {
            setErrorMessage("Password must contain at least one uppercase letter.");
            return;
        }
        if (!/\d/.test(newPassword)) {
            setErrorMessage("Password must contain at least one number.");
            return;
        }
        if (oldPassword === newPassword) {
            setErrorMessage("New password cannot be the same as the old password.");
            return;
        }

        if (newPassword !== reenterPassword) {
            setErrorMessage("The new password and confirmation password must match.");
            return;
        }

        setErrorMessage("");

        const credential = EmailAuthProvider.credential(user.email, oldPassword);

        reauthenticateWithCredential(user, credential)
            .then(() => {
                updatePassword(user, newPassword)
                    .then(() => setSuccessMessage("Password updated successfully"))
                    .catch((error) => {
                        if (error.code === "auth/weak-password") {
                            setErrorMessage("The new password is too weak. Please choose a stronger password.");
                        } else {
                            setErrorMessage("Error updating password: " + error.message);
                        }
                    });
            })
            .catch((error) => {
                if (error.code === "auth/wrong-password") {
                    setErrorMessage("The old password you entered is incorrect.");
                } else if (error.code === "auth/too-many-requests") {
                    setErrorMessage("Too many failed attempts. Please try again later.");
                } else if (error.code === "auth/invalid-credential") {
                    setErrorMessage("Please enter the correct old password or ensure the new password meets the requirements: at least 8 characters, an uppercase letter, and a number.");
                } else {
                    setErrorMessage("Please try again later.");
                }
            });
    };

    const handleDeleteAccount = () => {
        openModal();
    };

    const confirmDeleteAccount = () => {
        deleteUser(user)
            .then(() => {
                setSuccessMessage("Account deleted successfully");
                signOut(auth).then(() => {
                    window.location.href = '/';
                });
            })
            .catch((error) => {
                setErrorMessage("Error deleting account: " + error.message);
                closeModal();
            });
    };

    const handleProfileUpdate = () => {
        if (username.length > MAX_USERNAME_LENGTH) {
            setErrorMessage(`Username must be less than ${MAX_USERNAME_LENGTH} characters.`);
            return;
        }

        if (avatar) {
            updateProfile(user, {
                displayName: username,
                photoURL: avatar,
            })
                .then(() => {
                    setSuccessMessage("Profile updated successfully");
                    return user.reload();
                })
                .then(() => {
                    console.log("User data reloaded: ", user);
                })
                .catch((error) => setErrorMessage("Error updating profile: " + error.message));
        } else {
            setErrorMessage("No avatar URL available");
        }
    };

    return (
        <div className="flex min-h-screen">
            <Sidebar />

            <div className="flex-1 p-6 ml-2">
                <h2 className="text-3xl font-bold mb-4">Account Settings</h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={handleUsernameChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        placeholder="Enter your username"
                    />
                    {usernameError && <p className="text-red-500">{usernameError}</p>}
                </div>

                <div className="mb-4 flex items-center space-x-4">
                    <div className="flex-shrink-0">
                        <img src={avatar} alt="User Avatar" className="w-20 h-20 rounded-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Avatar</label>
                        <p className="text-sm text-gray-500">Upload a picture to change your avatar</p>
                        <input
                            type="file"
                            onChange={handleAvatarChange}
                            className="mt-2 block text-sm text-gray-900"
                            accept="image/*"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-4">Change Password</h3>
                    <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700">Old Password</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            placeholder="Old Password"
                        />
                    </div>
                    <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            placeholder="New Password"
                        />
                    </div>
                    <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700">Reenter Password</label>
                        <input
                            type="password"
                            value={reenterPassword}
                            onChange={(e) => setReenterPassword(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            placeholder="Reenter Password"
                        />
                    </div>
                    <button
                        onClick={handlePasswordChange}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-600"
                    >
                        Change Password
                    </button>
                </div>

                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4">Delete Account</h3>
                    <button
                        onClick={handleDeleteAccount}
                        className="bg-red-500 text-white px-4 py-2 rounded-md shadow-sm hover:bg-red-600"
                    >
                        Delete Account
                    </button>
                </div>

                <div className="mt-6">
                    <button
                        onClick={handleProfileUpdate}
                        disabled={username.length > MAX_USERNAME_LENGTH} // Disable if username is too long
                        className={`bg-green-500 text-white px-4 py-2 rounded-md shadow-sm hover:bg-green-600 ${username.length > MAX_USERNAME_LENGTH && "opacity-50 cursor-not-allowed"}`}
                    >
                        Save Changes
                    </button>
                    <div className="mt-4">
                        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
                        {successMessage && <p className="text-green-500">{successMessage}</p>}
                        {uploading && <p className="text-blue-500">Uploading avatar...</p>}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onConfirm={confirmDeleteAccount}
            />
        </div>
    );
};

export default Account;
