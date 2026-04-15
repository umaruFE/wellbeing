import React from 'react';
import { Check } from 'lucide-react';
import poppyImg from '../../assets/ip/poppy.png';
import ediImg from '../../assets/ip/edi.png';
import rollyImg from '../../assets/ip/rolly.png';
import miloImg from '../../assets/ip/milo.png';
import aceImg from '../../assets/ip/ace.png';

const IP_CHARACTERS = [
  {
    id: 'poppy',
    name: 'Poppy',
    color: '粉色',
    description: '粉色角色',
    thumbnail: poppyImg,
    available: true
  },
  {
    id: 'edi',
    name: 'Edi',
    color: '蓝色',
    description: '蓝色角色',
    thumbnail: ediImg,
    available: true
  },
  {
    id: 'rolly',
    name: 'Rolly',
    color: '橘色',
    description: '橘色角色',
    thumbnail: rollyImg,
    available: true
  },
  {
    id: 'milo',
    name: 'Milo',
    color: '黄色',
    description: '黄色角色',
    thumbnail: miloImg,
    available: true
  },
  {
    id: 'ace',
    name: 'Ace',
    color: '紫色',
    description: '紫色角色',
    thumbnail: aceImg,
    available: true
  }
];

export const RoleSelection = ({ selectedRoles, onRoleSelect }) => {
  const handleRoleClick = (roleId) => {
    if (selectedRoles.includes(roleId)) {
      onRoleSelect(selectedRoles.filter(id => id !== roleId));
    } else {
      onRoleSelect([...selectedRoles, roleId]);
    }
  };

  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-2 block">
        选择角色 ({selectedRoles.length}/5)
      </label>
      <p className="text-xs text-slate-400 mb-3">
        选择要出现在场景中的IP角色
      </p>
      
      <div className="space-y-2">
        {IP_CHARACTERS.map((character) => {
          const isSelected = selectedRoles.includes(character.id);
          const isAvailable = character.available !== false;
          
          return (
            <button
              key={character.id}
              onClick={() => isAvailable && handleRoleClick(character.id)}
              disabled={!isAvailable}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                !isAvailable
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  : isSelected
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-[#e5e3db] hover:border-[#2d2d2d] hover:bg-[#fffbe6]'
              }`}
            >
              <div className="relative">
                <img
                  src={character.thumbnail}
                  alt={character.name}
                  className="w-12 h-16 rounded-lg object-contain"
                />
                {isSelected && isAvailable && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isAvailable ? 'text-slate-800' : 'text-gray-400'}`}>
                    {character.name}
                  </span>
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: character.color === '粉色' ? '#FFB6C1' :
                                      character.color === '蓝色' ? '#87CEEB' :
                                      character.color === '橘色' ? '#FFA500' :
                                      character.color === '黄色' ? '#FFD700' :
                                      '#9370DB',
                      color: '#FFF'
                    }}
                  >
                    {character.color}
                  </span>
                </div>
                <p className={`text-xs ${isAvailable ? 'text-slate-500' : 'text-red-400'}`}>
                  {character.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSelection;
