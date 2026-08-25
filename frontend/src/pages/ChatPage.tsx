import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { KarmaBadge } from '../components/common/KarmaBadge';
import { api } from '../services/api';
import { Exchange, Message } from '../types';
import { useAuth } from '../context/AuthContext';
import { useKarmaAnimation } from '../context/KarmaAnimationContext';
import {
  Send,
  Sparkles,
  ArrowLeft,
  DollarSign,
  Check,
  X,
  Clock,
  ArrowRightLeft,
  ShieldCheck
} from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { triggerKarmaChange } = useKarmaAnimation();

  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposeKarmaVal, setProposeKarmaVal] = useState<number>(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChatData = async () => {
    if (!id) return;
    try {
      const [excData, msgData] = await Promise.all([
        api.getExchangeById(id),
        api.getMessages(id),
      ]);
      setExchange(excData);
      setMessages(msgData);
      if (excData.agreed_karma) {
        setProposeKarmaVal(excData.agreed_karma);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatData();
    const interval = setInterval(fetchChatData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inputText.trim()) return;

    try {
      const sent = await api.sendMessage(id, inputText.trim(), 'text');
      setMessages((prev) => [...prev, sent]);
      setInputText('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const sent = await api.sendMessage(
        id,
        `Proposed new exchange rate: ${proposeKarmaVal} Karma points.`,
        'propose_karma',
        Number(proposeKarmaVal)
      );
      setMessages((prev) => [...prev, sent]);
      setShowProposeModal(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRespondProposal = async (messageId: string, action: 'accept' | 'reject') => {
    if (!id) return;
    try {
      const res = await api.respondToProposal(id, messageId, action);
      if (res.updatedAgreedKarma && exchange) {
        setExchange({ ...exchange, agreed_karma: res.updatedAgreedKarma });
        triggerKarmaChange(0, `Karma rate updated to ${res.updatedAgreedKarma}`);
      }
      fetchChatData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  const isGiver = user?.id === exchange?.giver_id;
  const peer = isGiver ? exchange?.receiver : exchange?.giver;

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex flex-col h-[calc(100vh-80px)]">
        {/* Exchange Header Bar */}
        <div className="p-4 rounded-2xl glass-panel-elevated border-slate-700 flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center space-x-3">
            <Link to="/exchanges" className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-sm">
                  {peer?.name || 'Campus Peer'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {peer?.hostel_block || 'SRM Hostel'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                Resource: <span className="text-white font-medium">{exchange?.bundle ? `Bundle: ${exchange.bundle.title}` : (exchange?.listing?.title || 'Campus Exchange')}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <KarmaBadge points={exchange?.agreed_karma || 20} size="md" />
            <button
              onClick={() => setShowProposeModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono text-xs font-bold border border-slate-700 flex items-center space-x-1"
              title="Propose new Karma value"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Negotiate</span>
            </button>
          </div>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-500 font-mono">
              Thread started. Say hi to coordinate pickup point and time!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;

              if (msg.type === 'propose_karma') {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="max-w-sm w-full p-4 rounded-2xl bg-slate-900 border border-amber-500/40 text-xs shadow-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center space-x-1.5 text-amber-400 font-bold font-mono">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Structured Karma Proposal</span>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-slate-200">{msg.content}</p>

                      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-base font-extrabold text-white font-mono">
                          {msg.proposed_karma} Karma
                        </span>

                        {msg.proposal_status === 'pending' ? (
                          isMe ? (
                            <span className="text-[11px] font-mono text-slate-400 italic">
                              Waiting for peer response...
                            </span>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleRespondProposal(msg.id, 'reject')}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-bold text-xs hover:bg-rose-500/30 flex items-center space-x-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                              <button
                                onClick={() => handleRespondProposal(msg.id, 'accept')}
                                className="px-3 py-1 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 flex items-center space-x-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Accept</span>
                              </button>
                            </div>
                          )
                        ) : (
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded uppercase font-mono ${
                              msg.proposal_status === 'accepted'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {msg.proposal_status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs sm:max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-amber-400 text-black font-medium rounded-br-none shadow-md'
                        : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <span className={`block text-[10px] mt-1 text-right ${isMe ? 'text-black/60' : 'text-slate-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendText} className="pt-3 border-t border-slate-800 flex items-center space-x-2 shrink-0">
          <input
            type="text"
            placeholder="Type a message or discuss pickup point..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
          />
          <button
            type="submit"
            className="p-3 rounded-2xl bg-amber-400 text-black hover:bg-amber-300 transition-colors shrink-0 shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Propose Karma Modal */}
        {showProposeModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-sm w-full glass-panel-elevated p-6 rounded-3xl border-slate-700 shadow-2xl">
              <h3 className="text-lg font-bold text-white">Negotiate Karma Value</h3>
              <p className="text-xs text-slate-400 mt-1">
                Send a structured counter-offer that updates the exchange terms upon peer acceptance.
              </p>

              <form onSubmit={handleSendProposal} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    Proposed Karma Value
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={proposeKarmaVal}
                    onChange={(e) => setProposeKarmaVal(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xl font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowProposeModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 shadow-md"
                  >
                    Send Proposal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
