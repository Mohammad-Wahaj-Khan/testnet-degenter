import React from 'react';
import { 
  Search, 
  Wallet, 
  Globe, 
  Zap, 
  TrendingUp, 
  Flame, 
  BarChart3, 
  ChevronDown,
  Star,
  ExternalLink
} from 'lucide-react';
import Navbar from '../components/navbar';
import TopMarketToken from '../components/TopMarketToken';
import InsightsContent from '../insights/components/InsightsContent';
import FindGemsMain from './components/findgems';

const Dashboard = () => {
  const tokens = [
    { rank: 1, name: '索拉拉', ticker: '@easytopredict', price: '$0.003059', h1: '+20.72%', h4: '+119%', h24: '+116%', mc: '$3.02M', liq: '$249.9K', vol: '$1.79M', holders: '7.01K' },
    { rank: 2, name: 'PLUSHIFY', ticker: 'plushify', price: '$0.00061918', h1: '+13.4%', h4: '+400%', h24: '+21.03%', mc: '$619.18K', liq: '$142.02K', vol: '$1.66M', holders: '1.81K' },
    { rank: 3, name: 'SENT', ticker: 'Sentient', price: '$0.004931', h1: '-61.19%', h4: '+19,267%', h24: '+19,267%', mc: '$4.93M', liq: '$860.26K', vol: '$824.99K', holders: '1.38K' },
    { rank: 4, name: 'MOBY', ticker: 'Moby AI', price: '$0.004523', h1: '-0.45%', h4: '+22.95%', h24: '+28.04%', mc: '$4.52M', liq: '$666.58K', vol: '$88.91K', holders: '22.02K' },
  ];

  return (
    // <main className="min-h-screen bg-[#000000] text-[#E5E7EB] font-sans selection:bg-yellow-500/30">
    <main className="flex min-h-screen flex-col bg-black relative overflow-hidden p-0 md:px-4">
      <div
        className="absolute inset-0 z-0 h-56"
        style={{
          backgroundImage: `
              linear-gradient(
                120deg,
                #14624F 0%,
                #39C8A6 36.7%,
                #FA4E30 66.8%,
                #2D1B45 100%
              )
            `,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-black" />
      </div>
      <div className="animate-header relative z-20">
        <Navbar />
        <TopMarketToken />
      </div>

        <FindGemsMain/>
    </main>
  );
};

export default Dashboard;