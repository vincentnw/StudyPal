import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';  // Firebase auth setup
import {
    browserLocalPersistence,
    browserSessionPersistence,
    setPersistence,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    sendEmailVerification
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';  // For redirection

const SignInSignUp = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const navigate = useNavigate();
    const [rememberMe, setRememberMe] = useState(false);
    const [emailVerificationSent, setEmailVerificationSent] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Handle form reset when switching between login and sign-up
    useEffect(() => {
        resetForm();
    }, [isSignUp, showResetPassword]);

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setError('');
        setResetEmailSent(false);
        setEmailVerificationSent(false);
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');  // Clear previous errors

        try {
            const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
            await setPersistence(auth, persistence);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (user.emailVerified) {
                navigate('/home');
            } else {
                setError('Please verify your email before logging in.');
            }
        } catch (error) {
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
            await setPersistence(auth, persistence);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await sendEmailVerification(user);
            setEmailVerificationSent(true);
        } catch (error) {
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAuthError = (error) => {
        const errorMessages = {
            'auth/password-does-not-meet-requirements': 'Password must be at least 8 characters long and contain a number and an uppercase letter.',
            'auth/email-already-in-use': 'This email is already registered. Please log in or use a different email.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/user-not-found': 'No account found with this email. Please sign up.',
            'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again later or reset your password.',
            'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
            'auth/invalid-credential': 'Invalid credentials. Please verify your email and password and try again.',
        };

        setError(errorMessages[error.code] || error.message);
    };

    const handleSocialLogin = async (provider) => {
        setLoading(true);
        setError('');

        try {
            const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
            await setPersistence(auth, persistence);
            const result = await signInWithPopup(auth, provider);
            console.log('Logged in via social provider:', result.user);
            navigate('/home');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email to reset your password.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            await sendPasswordResetEmail(auth, email);
            setResetEmailSent(true);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-purple-500 to-blue-500">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
                {emailVerificationSent && (
                    <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-md">
                        A verification email has been sent to <strong>{email}</strong>. Please check your inbox and verify your email before logging in.
                    </div>
                )}

                {!showResetPassword ? (
                    <>
                        <h2 className="text-center text-3xl font-bold mb-6">{isSignUp ? 'Sign Up' : 'Login'}</h2>
                        {loading && <div className="text-center mb-4"><div className="loader"></div></div>}
                        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                        {resetEmailSent && <p className="text-green-500 text-center mb-4">Password reset email sent!</p>}

                        <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Type your email"
                                    required
                                />
                            </div>
                            <div className="mb-4 relative">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                                <div className="relative w-full">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Type your password"
                                        required
                                    />
                                    <span
                                        className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ top: '50%', transform: 'translateY(-50%)' }}
                                    >
                                        {showPassword ? (
                                            <i className="far fa-eye"></i>
                                        ) : (
                                            <i className="far fa-eye-slash"></i>
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className="mb-4">
                                <div className="flex justify-between items-center">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={() => setRememberMe(!rememberMe)}
                                            className="mr-2"
                                        />
                                        <span className="text-gray-700 text-sm">Remember Me</span>
                                    </label>
                                    {!isSignUp && (
                                        <button
                                            type="button"
                                            onClick={() => setShowResetPassword(true)}
                                            className="text-sm text-blue-500 hover:underline"
                                            disabled={loading}
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                                <button
                                    type="submit"
                                    className={`bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-6 rounded-full shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'} transition duration-300 ease-in-out`}
                                    disabled={loading}
                                >
                                    {isSignUp ? 'Sign Up' : 'Login'}
                                </button>
                            </div>
                        </form>

                        <div className="text-center my-4">Or {isSignUp ? 'Sign Up' : 'Log In'} Using</div>
                        <div className="flex justify-center space-x-4 mb-4">
                            <button
                                onClick={() => handleSocialLogin(new FacebookAuthProvider())}
                                className={`bg-blue-500 text-white p-2 rounded-full shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'} transition duration-300 ease-in-out`}
                                disabled={loading}
                            >
                                <i className="fab fa-facebook-f w-4 h-4"></i>
                            </button>
                            <button
                                onClick={() => handleSocialLogin(new GoogleAuthProvider())}
                                className={`bg-red-500 text-white p-2 rounded-full shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'} transition duration-300 ease-in-out`}
                                disabled={loading}
                            >
                                <i className="fab fa-google w-4 h-4"></i>
                            </button>
                        </div>

                        <p className="text-center">
                            {isSignUp ? 'Already have an account?' : 'Don’t have an account?'}{' '}
                            <button
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-blue-500 hover:underline"
                            >
                                {isSignUp ? 'Login' : 'Sign Up'}
                            </button>
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="text-center text-2xl font-bold mb-6">Reset Password</h2>
                        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                        <form onSubmit={handleForgotPassword}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Type your email"
                                    required
                                />
                            </div>
                            <div className="mb-4 flex justify-between">
                                <button
                                    type="submit"
                                    className={`bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-6 rounded-full shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'} transition duration-300 ease-in-out`}
                                    disabled={loading}
                                >
                                    Reset Password
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowResetPassword(false)}
                                    className="text-blue-500 hover:underline"
                                    disabled={loading}
                                >
                                    Back to Login
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default SignInSignUp;
