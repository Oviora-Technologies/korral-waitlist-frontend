import React from 'react';
import HomePage from './features/home/HomePage';
import JoinPage from './features/waitlist/JoinPage';
import CreatePage from './features/community/CreatePage';
import CommunityDetailsPage from './features/community/CommunityDetailsPage';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/auth/DashboardPage';
import {Header,Footer} from './components/SiteLayout';
import './features/home/HomePage.css';

export default function App(){
  const path=window.location.pathname.replace(/\/$/,'')||'/';
  let page:React.ReactNode;
  if(path==='/login')page=<LoginPage/>;
  else if(path==='/dashboard')page=<DashboardPage/>;
  else if(path==='/create'||path==='/admin')page=<CreatePage/>;
  else if(/^\/manage\/(community|group)\/[a-z0-9-]+$/.test(path))page=<CommunityDetailsPage/>;
  else if(path==='/join'||/^\/(c|g)\/[a-z0-9-]+$/.test(path))page=<JoinPage/>;
  else page=<HomePage/>;
  return <div className="vila-app-layout"><Header/>{page}<Footer/></div>;
}
