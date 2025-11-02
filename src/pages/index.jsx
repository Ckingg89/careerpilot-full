import Layout from "./Layout.jsx";

import JobDiscovery from "./JobDiscovery";

import Profile from "./Profile";

import MyApplications from "./MyApplications";

import Analytics from "./Analytics";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    JobDiscovery: JobDiscovery,
    
    Profile: Profile,
    
    MyApplications: MyApplications,
    
    Analytics: Analytics,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<JobDiscovery />} />
                
                
                <Route path="/JobDiscovery" element={<JobDiscovery />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/MyApplications" element={<MyApplications />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}