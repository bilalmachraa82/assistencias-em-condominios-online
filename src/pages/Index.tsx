
import React from 'react';
import { Sparkles, Moon, Sun, Bot } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const data = [
  { name: 'Seg', assist: 9 },
  { name: 'Ter', assist: 11 },
  { name: 'Qua', assist: 12 },
  { name: 'Qui', assist: 14 },
  { name: 'Sex', assist: 13 },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#fb923c] text-[#f1f5f9] p-8 font-sans transition-colors duration-500">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-64 bg-[#0f172a66] backdrop-blur-xl p-6 flex flex-col justify-between shadow-2xl rounded-tr-3xl rounded-br-3xl border-r border-white/10">
        <div>
          <div className="text-3xl font-bold mb-10 tracking-tight flex items-center gap-2">
            <Sparkles className="text-[#38bdf8]" size={24} />
            ASSISTECH
          </div>
          <ul className="space-y-6 text-lg">
            <li className="hover:text-[#38bdf8] transition-colors cursor-pointer">📊 Dashboard</li>
            <li className="hover:text-[#38bdf8] transition-colors cursor-pointer">🛠️ Assistências</li>
            <li className="hover:text-[#38bdf8] transition-colors cursor-pointer">📅 Agendamentos</li>
            <li className="hover:text-[#38bdf8] transition-colors cursor-pointer">📸 Fotos</li>
            <li className="hover:text-[#38bdf8] transition-colors cursor-pointer">🤖 Sugestões da IA</li>
            <li className="hover:text-[#38bdf8] transition-colors cursor-pointer">👤 Perfil</li>
          </ul>
        </div>
        <div className="text-sm text-[#ef4444] cursor-pointer hover:underline">🚪 Sair</div>
      </div>

      {/* Main Content */}
      <div className="ml-72">
        <div className="flex justify-between items-center mb-10 animate-fade-in-up">
          <div>
            <h1 className="text-5xl font-extrabold leading-tight">Olá, João!</h1>
            <p className="text-[#cbd5e1] mt-2 text-lg">Pronto para transformar assistências em soluções?</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[#cbd5e1]">Lisboa, 21°C ☀️</div>
            <button className="bg-gradient-to-r from-[#38bdf8] to-[#6366f1] text-white px-4 py-2 rounded-xl hover:opacity-90 transition">+ Nova Assistência</button>
            <button className="bg-white/10 text-white backdrop-blur-md px-4 py-2 rounded-xl hover:bg-white/20 transition">📸 Nova Foto</button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 rounded-3xl p-6 backdrop-blur-lg shadow-xl hover:scale-[1.02] transition-transform">
            <h2 className="text-xl font-semibold">Assistências Ativas</h2>
            <p className="text-4xl font-bold text-[#22c55e] mt-2">12</p>
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="assist" stroke="#22c55e" strokeWidth={2} dot={false} />
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white/5 rounded-3xl p-6 backdrop-blur-lg shadow-xl hover:scale-[1.02] transition-transform">
            <h2 className="text-xl font-semibold">Agendamentos Hoje</h2>
            <p className="text-4xl font-bold text-[#3b82f6] mt-2">5</p>
            <p className="text-sm text-[#cbd5e1]">Próxima em 2h</p>
          </div>
          <div className="bg-white/5 rounded-3xl p-6 backdrop-blur-lg shadow-xl hover:scale-[1.02] transition-transform">
            <h2 className="text-xl font-semibold">Fotos Pendentes</h2>
            <p className="text-4xl font-bold text-[#ef4444] mt-2">3</p>
            <p className="text-sm text-[#cbd5e1]">Mais antiga: 2 dias</p>
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="bg-white/5 rounded-3xl p-6 backdrop-blur-lg shadow-xl animate-fade-in-up">
          <h2 className="text-2xl font-bold mb-6">Atividade Recente</h2>
          <ul className="space-y-4 text-base">
            <li className="flex justify-between items-center">
              <span>🔔 Nova assistência criada – <span className="text-[#38bdf8] font-medium">#1234</span> (Ar Condicionado)</span>
              <span className="text-[#cbd5e1]">Agora</span>
            </li>
            <li className="flex justify-between items-center">
              <span>✅ Agendamento confirmado – <span className="text-[#38bdf8] font-medium">Cliente ABC</span> às 14:30</span>
              <span className="text-[#cbd5e1]">2h atrás</span>
            </li>
            <li className="flex justify-between items-center">
              <span>📷 Fotos carregadas – <span className="text-[#38bdf8] font-medium">#1230</span> (9 fotos)</span>
              <span className="text-[#cbd5e1]">1d atrás</span>
            </li>
          </ul>
        </div>

        {/* Chatbot Flutuante */}
        <div className="fixed bottom-6 right-6">
          <button className="bg-white/10 backdrop-blur-lg text-white p-4 rounded-full shadow-lg hover:bg-white/20 transition">
            <Bot size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
