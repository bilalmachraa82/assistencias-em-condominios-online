
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Assistencias() {
  return (
    <DashboardLayout>
      <div className="animate-fade-in-up">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-extrabold leading-tight">Assistências</h1>
            <p className="text-[#cbd5e1] mt-2 text-lg">Gerencie suas solicitações de manutenção</p>
          </div>
          <div>
            <button className="bg-gradient-to-r from-[#38bdf8] to-[#6366f1] text-white px-4 py-2 rounded-xl hover:opacity-90 transition">
              + Nova Assistência
            </button>
          </div>
        </div>

        {/* Placeholder for Assistance List */}
        <div className="bg-white/5 rounded-3xl p-6 backdrop-blur-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-6">Listagem de Assistências</h2>
          <p className="text-[#cbd5e1]">Nenhuma assistência encontrada.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

