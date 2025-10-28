
import React from 'react';
import { View } from '../types';
import D20Icon from './icons/D20Icon';
import WorldIcon from './icons/WorldIcon';
import UsersIcon from './icons/UsersIcon';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView }) => {
  const navItems = [
    { view: View.Players, label: 'Players', icon: UsersIcon },
    { view: View.GameWorld, label: 'Game World', icon: WorldIcon },
  ];

  return (
    <nav className="w-16 md:w-64 bg-gray-950 p-2 md:p-4 flex flex-col border-r border-gray-800">
      <div className="flex items-center gap-3 mb-8 px-2">
        <D20Icon className="h-8 w-8 text-indigo-400" />
        <h1 className="text-xl font-bold hidden md:block">GM Assistant</h1>
      </div>
      <ul className="space-y-2">
        {navItems.map(item => {
          const isActive = activeView === item.view;
          return (
            <li key={item.view}>
              <button
                onClick={() => setView(item.view)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="h-6 w-6 flex-shrink-0" />
                <span className="hidden md:block">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Sidebar;
