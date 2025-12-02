
import React, { useState } from 'react';

interface SignUpFormProps {
  onSignUp: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSignUp }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    // specific strict logic: use localStorage to simulate a database
    const users = JSON.parse(localStorage.getItem('ebook_app_users') || '{}');

    if (isLogin) {
      // Login Logic
      if (users[email] && users[email] === password) {
        onSignUp(); // Authenticated successfully
      } else {
        setError("Invalid email or password.");
      }
    } else {
      // Sign Up Logic
      if (users[email]) {
        setError("User already exists. Please log in.");
      } else {
        // Save new user
        users[email] = password;
        localStorage.setItem('ebook_app_users', JSON.stringify(users));
        onSignUp(); // Registered and authenticated successfully
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          The 5-Minute eBook
        </h1>
        <h2 className="text-2xl font-semibold text-slate-200 mb-2">
           {isLogin ? 'Welcome Back' : 'Create Your Account'}
        </h2>
        <p className="text-lg text-slate-400">
          {isLogin ? 'Log in to continue writing.' : 'Start your journey to becoming an author today.'}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 p-8 rounded-lg space-y-6 shadow-xl backdrop-blur-sm">
        {error && (
            <div className="p-3 bg-red-900/50 border border-red-800 text-red-200 rounded text-sm text-center">
                {error}
            </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition focus:border-blue-500"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
          <div className="relative">
            <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition focus:border-blue-500 pr-10"
                placeholder="••••••••"
                required
                minLength={6}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
            >
                {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                )}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-bold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
        >
          {isLogin ? 'Log In' : 'Sign Up'}
        </button>
        <div className="text-center text-slate-400 text-sm mt-4">
            {isLogin ? "Don't have an account?" : "Already have an account?"} 
            <button 
                type="button" 
                className="text-blue-400 hover:text-blue-300 font-medium ml-1 transition-colors focus:outline-none" 
                onClick={toggleMode}
            >
                {isLogin ? 'Sign up' : 'Log in'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default SignUpForm;
