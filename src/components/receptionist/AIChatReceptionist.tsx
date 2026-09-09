import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Phone,
  MessageCircle,
  Minimize2,
  Maximize2,
  Calendar,
  CreditCard,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Dumbbell,
} from 'lucide-react';
import { AIReceptionistSettings, ChatMessage, MembershipPlan, Member } from '../../types';
import { receptionistService } from '../../services/receptionistService';
import { leadsService } from '../../services/leadsService';
import { storageService } from '../../services/storageService';
import { authService } from '../../services/authService';

interface AIChatReceptionistProps {
  member?: Member | null;
  onOpenMemberLogin?: () => void;
  gymName?: string;
}

export const AIChatReceptionist: React.FC<AIChatReceptionistProps> = ({
  member,
  gymName = 'GymFlow Fitness Center',
}) => {
  // CRITICAL SCOPE RULE:
  // Determine authenticated user's role.
  // The AI robot must appear ONLY inside the MEMBER PORTAL.
  // Show it for: MEMBER.
  // Do NOT show it for: OWNER, ADMIN, STAFF, or UNLOGGED VISITORS.
  const adminSession = storageService.getAuthSession();
  const memberSession = storageService.getMemberSession();
  const authMember = member || memberSession?.member || authService.getCurrentMember();

  // If user is admin/owner/staff, do NOT render
  if (adminSession && (adminSession.role === 'owner' || adminSession.role === 'admin' || adminSession.role === 'staff')) {
    return null;
  }

  // If not authenticated as member, do NOT render
  if (!memberSession || memberSession.role !== 'member' || !authMember) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [settings, setSettings] = useState<AIReceptionistSettings | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // In-chat trial booking state
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingPlan, setBookingPlan] = useState('');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookedSuccess, setBookedSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, [authMember?.id]);

  const loadSettings = async () => {
    try {
      const data = await receptionistService.getSettings();
      setSettings(data);
      const activePlans = await receptionistService.getActivePlans();
      setPlans(activePlans);

      const memberFirstName = authMember?.full_name?.split(' ')[0] || 'Member';

      // Initialize with personalized member assistant greeting
      setMessages([
        {
          id: 'msg-init-1',
          role: 'assistant',
          content: `Hi ${memberFirstName}! 👋 I'm your GymFlow AI Assistant.\n\nI can help you check your membership expiry, past payments, workout attendance, gym timings, and available facilities. How can I help you today?`,
          timestamp: new Date().toISOString(),
          suggestedActions: [
            { label: '📅 My Expiry Date', action: 'my_expiry' },
            { label: '💳 My Payments', action: 'my_payments' },
            { label: '🏋️ My Attendance', action: 'my_attendance' },
            { label: '⏰ Gym Timings', action: 'view_timings' },
            { label: '📋 Membership Plans', action: 'view_plans' },
          ],
        },
      ]);
    } catch (err) {
      console.error('Failed to load receptionist data:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isTyping) return;

    setInputValue('');

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Build brief recent history for conversational context
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const res = await receptionistService.sendMessage(query, historyPayload);

      const assistantMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
        suggestedActions: res.suggestedActions,
        showPlanCards: res.showPlanCards,
        showTrialForm: res.showTrialForm,
        showContactButtons: res.showContactButtons,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error sending message to receptionist:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content:
            "I'm experiencing a brief connection issue. Please feel free to check with the front desk or call " +
            (settings?.contact_phone || '+91 98765 43210') +
            '!',
          timestamp: new Date().toISOString(),
          showContactButtons: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedAction = (action: string, label: string) => {
    switch (action) {
      case 'my_expiry':
        handleSendMessage('When does my gym membership expire?');
        break;
      case 'my_payments':
        handleSendMessage('Show my past payment receipts');
        break;
      case 'my_attendance':
        handleSendMessage('What is my workout attendance summary?');
        break;
      case 'view_plans':
        handleSendMessage('What are your membership plans and prices?');
        break;
      case 'view_timings':
        handleSendMessage('What are your gym operating hours?');
        break;
      case 'view_facilities':
        handleSendMessage('What facilities and equipment do you have?');
        break;
      case 'book_trial':
        handleSendMessage('I would like to book a trial workout session.');
        break;
      case 'view_location':
        handleSendMessage('Where is your gym located?');
        break;
      case 'whatsapp_staff':
        if (settings?.whatsapp_phone) {
          const url = leadsService.getWhatsAppChatUrl(
            settings.whatsapp_phone,
            `Hello GymFlow, I am member ${authMember?.full_name} and have an inquiry.`
          );
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'contact_staff':
        handleSendMessage('How can I contact gym staff directly?');
        break;
      default:
        handleSendMessage(label);
        break;
    }
  };

  const handleBookTrialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingName.trim() || !bookingPhone.trim()) return;

    setIsBookingSubmitting(true);
    try {
      const selectedP = plans.find((p) => p.name === bookingPlan);
      await leadsService.createLead({
        name: bookingName.trim(),
        phone: bookingPhone.trim(),
        interested_plan_id: selectedP?.id,
        interested_plan_name: bookingPlan || 'Guest Trial Pass',
        source: 'AI_RECEPTIONIST',
        status: 'NEW',
        trial_date: bookingDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        trial_time: bookingTime || '07:00 AM',
        message: `Booked guest workout pass via Member Portal AI Assistant (${settings?.receptionist_name || 'GymFlow AI'}).`,
        notes: `Guest pass requested by member ${authMember?.full_name}.`,
      });

      setBookedSuccess(true);

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-confirmed-${Date.now()}`,
          role: 'assistant',
          content: `🎉 All set! Your guest workout trial pass for ${bookingName} has been recorded for ${bookingDate || 'tomorrow'} at ${bookingTime || '07:00 AM'}. Our front desk will have it ready.`,
          timestamp: new Date().toISOString(),
          suggestedActions: [
            { label: '⏰ Gym Timings', action: 'view_timings' },
            { label: '💬 WhatsApp Front Desk', action: 'whatsapp_staff' },
          ],
        },
      ]);
    } catch (err) {
      console.error('Failed to book trial pass:', err);
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  return (
    <>
      {/* ================================================== */}
      {/* 1. SMALL FLOATING ROBOT BUTTON */}
      {/* Position: BOTTOM-RIGHT CORNER */}
      {/* Default view shows ONLY: 🤖 */}
      {/* Small circular floating button (52-58px) */}
      {/* ================================================== */}
      {!isOpen && (
        <div id="ai-robot-launcher" className="fixed bottom-5 right-5 z-40">
          <button
            type="button"
            id="ai-robot-button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            aria-label="Open GymFlow AI Assistant"
            title="Ask GymFlow AI"
            className="group relative w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 hover:from-slate-800 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-indigo-400/30 flex items-center justify-center"
          >
            {/* Online Status Green Indicator */}
            <span className="absolute top-0.5 right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></span>
            </span>

            {/* Default view shows ONLY: 🤖 */}
            <span
              className="text-2xl sm:text-2xl select-none transform transition-transform group-hover:scale-110"
              role="img"
              aria-label="robot"
            >
              🤖
            </span>

            {/* Subtle floating hover tooltip on desktop */}
            <span className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900/95 text-white text-[11px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md border border-slate-700/60 hidden sm:block">
              Ask GymFlow AI
            </span>
          </button>
        </div>
      )}

      {/* ================================================== */}
      {/* 2. CHAT OPENS ONLY WHEN CLICKED */}
      {/* Compact, responsive, with prominent Close (X) button */}
      {/* ================================================== */}
      {isOpen && (
        <div
          id="ai-robot-chat-window"
          className={`fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 w-[calc(100vw-2rem)] max-w-[390px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized ? 'h-14' : 'h-[520px] max-h-[82vh]'
          }`}
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-xs border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-2xs text-base select-none">
                  🤖
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white tracking-tight">GymFlow AI</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300 font-medium">
                    Member Assistant
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate max-w-[190px]">
                  {authMember.full_name} • {gymName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                id="ai-chat-minimize-btn"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
                aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                id="ai-chat-close-btn"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          {!isMinimized && (
            <>
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/70 text-xs">
                {/* Privacy Badge */}
                <div className="p-2 bg-indigo-50/80 rounded-xl border border-indigo-100 flex items-center gap-2 text-[11px] text-indigo-900">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Your account details, attendance, and payments are protected and private.
                  </span>
                </div>

                {/* Messages */}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Rich Membership Plan Cards */}
                    {msg.showPlanCards && plans.length > 0 && (
                      <div className="w-full mt-2.5 space-y-2">
                        <span className="text-[11px] font-bold text-slate-700 block">
                          Current Membership Packages:
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {plans.map((p) => (
                            <div
                              key={p.id}
                              className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2 hover:border-indigo-300 transition-colors"
                            >
                              <div>
                                <div className="font-bold text-xs text-slate-900">{p.name}</div>
                                <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                                  ₹{p.price.toLocaleString('en-IN')}{' '}
                                  <span className="text-slate-400 font-normal">
                                    / {p.duration_months} mo
                                  </span>
                                </div>
                                {p.description && (
                                  <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                                    {p.description}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setBookingPlan(p.name);
                                  handleSendMessage(`Tell me more about upgrading to the ${p.name} package.`);
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                              >
                                View Plan
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rich Trial Booking Form Card */}
                    {msg.showTrialForm && !bookedSuccess && (
                      <div className="w-full mt-2.5 p-3.5 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span>Request Guest Workout Pass</span>
                        </div>
                        <form onSubmit={handleBookTrialSubmit} className="space-y-2">
                          <div>
                            <input
                              type="text"
                              required
                              placeholder="Guest's full name *"
                              value={bookingName}
                              onChange={(e) => setBookingName(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <input
                              type="tel"
                              required
                              placeholder="Guest's phone number *"
                              value={bookingPhone}
                              onChange={(e) => setBookingPhone(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={bookingDate}
                              onChange={(e) => setBookingDate(e.target.value)}
                              className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              placeholder="e.g. 7:00 AM"
                              value={bookingTime}
                              onChange={(e) => setBookingTime(e.target.value)}
                              className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isBookingSubmitting}
                            className="w-full py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isBookingSubmitting ? 'Booking Pass...' : 'Confirm Guest Pass'}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Contact Buttons */}
                    {msg.showContactButtons && (
                      <div className="flex items-center gap-2 mt-2">
                        {settings?.whatsapp_phone && (
                          <a
                            href={leadsService.getWhatsAppChatUrl(
                              settings.whatsapp_phone,
                              `Hi GymFlow, I am member ${authMember.full_name} and have a question.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp Staff</span>
                          </a>
                        )}
                        {settings?.contact_phone && (
                          <a
                            href={`tel:${settings.contact_phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Front Desk</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Suggested Chips */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 max-w-full">
                        {msg.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSuggestedAction(action.action, action.label)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-full transition-colors cursor-pointer shadow-2xs"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-center gap-1 text-slate-400 text-xs p-2 bg-white rounded-xl border border-slate-200/60 w-20">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span
                      className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0.15s' }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0.3s' }}
                    ></span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-2.5 bg-white border-t border-slate-200 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about your expiry, payments, timings..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    id="ai-send-message-btn"
                    disabled={!inputValue.trim() || isTyping}
                    className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 shrink-0 shadow-2xs"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 px-1">
                  <span>GymFlow AI Member Assistant</span>
                  <span className="text-emerald-600 font-medium">● Online</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
