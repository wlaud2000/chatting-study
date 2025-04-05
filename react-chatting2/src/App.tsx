import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes';
import './App.css';

const App: React.FC = () => {
	return (
		<Router>
			<AuthProvider>
				<div className="app">
					<AppRoutes />
				</div>
			</AuthProvider>
		</Router>
	);
};

export default App;