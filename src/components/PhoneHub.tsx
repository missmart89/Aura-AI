import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, Users, Smartphone, Battery, Wifi, Activity, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function PhoneHub() {
  const [activeTab, setActiveTab] = useState<'dialer' | 'messages' | 'contacts' | 'status'>('status');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [networkStatus, setNetworkStatus] = useState<string>('Online');

  useEffect(() => {
    // Attempt to get battery status if supported
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    // Network status
    const updateNetwork = () => {
      setNetworkStatus(navigator.onLine ? 'Online' : 'Offline');
    };
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    return () => {
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
    };
  }, []);

  const handleCall = () => {
    if (!phoneNumber) return;
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleSMS = () => {
    if (!phoneNumber) return;
    window.open(`sms:${phoneNumber}?body=${encodeURIComponent(messageBody)}`, '_self');
  };

  const handlePickContact = async () => {
    const props = ['name', 'tel'];
    const opts = { multiple: false };
    
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const selectedContacts = await (navigator as any).contacts.select(props, opts);
        if (selectedContacts.length > 0) {
          const contact = selectedContacts[0];
          setContacts(prev => [...prev, contact]);
          if (contact.tel && contact.tel.length > 0) {
            setPhoneNumber(contact.tel[0]);
          }
        }
      } catch (ex) {
        console.error('Contact picker failed:', ex);
        alert('Contact picker is not supported or permission was denied.');
      }
    } else {
      alert('Contact Picker API is not supported on this browser/device. Please enter the number manually.');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 p-4 md:p-8 overflow-y-auto scrollbar-hide">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-[#ff4e00]" />
          </div>
          <div>
            <h2 className="text-2xl font-light serif">Device Hub</h2>
            <p className="text-white/40 text-sm">EchoCore System Integration</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto scrollbar-hide">
          {[
            { id: 'status', icon: Activity, label: 'Status' },
            { id: 'dialer', icon: Phone, label: 'Dialer' },
            { id: 'messages', icon: MessageSquare, label: 'Messages' },
            { id: 'contacts', icon: Users, label: 'Contacts' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-[#ff4e00] text-white shadow-[0_0_15px_rgba(255,78,0,0.3)]' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md min-h-[400px]">
          
          {/* STATUS TAB */}
          {activeTab === 'status' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h3 className="text-lg font-medium text-white/80 mb-4">System Diagnostics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-2">
                  <Wifi className={`w-8 h-8 ${networkStatus === 'Online' ? 'text-emerald-500' : 'text-red-500'}`} />
                  <span className="text-sm text-white/60 uppercase tracking-widest">Network</span>
                  <span className="font-medium">{networkStatus}</span>
                </div>
                
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-2">
                  <Battery className="w-8 h-8 text-[#ff4e00]" />
                  <span className="text-sm text-white/60 uppercase tracking-widest">Power</span>
                  <span className="font-medium">{batteryLevel !== null ? `${batteryLevel}%` : 'Unknown'}</span>
                </div>
              </div>

              <div className="p-4 bg-[#ff4e00]/10 border border-[#ff4e00]/20 rounded-2xl mt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#ff4e00] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-[#ff4e00] mb-1">EchoCore Neural Link Active</h4>
                    <p className="text-xs text-white/60 leading-relaxed">
                      System is monitoring device state. Note: Due to browser security sandboxing, direct background SMS and silent calling are routed through your device's native handlers.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* DIALER TAB */}
          {activeTab === 'dialer' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-sm mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-lg font-medium text-white/80">Make a Call</h3>
                <p className="text-xs text-white/40">Route through native dialer</p>
              </div>
              
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-center text-2xl tracking-widest focus:ring-1 focus:ring-[#ff4e00] outline-none transition-all"
              />
              
              <button
                onClick={handleCall}
                disabled={!phoneNumber}
                className="w-full py-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl font-bold tracking-widest uppercase hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Initiate Call
              </button>
            </motion.div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'messages' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-white/80">Send Message</h3>
                <button onClick={handlePickContact} className="text-xs text-[#ff4e00] hover:underline flex items-center gap-1">
                  <Users className="w-3 h-3" /> Pick Contact
                </button>
              </div>
              
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Recipient Number..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#ff4e00] outline-none transition-all"
              />
              
              <textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#ff4e00] outline-none transition-all resize-none"
              />
              
              <button
                onClick={handleSMS}
                disabled={!phoneNumber || !messageBody}
                className="w-full py-3 bg-[#ff4e00] text-white rounded-xl font-bold tracking-widest uppercase hover:bg-[#ff4e00]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,78,0,0.3)]"
              >
                <MessageSquare className="w-5 h-5" />
                Send via SMS
              </button>
            </motion.div>
          )}

          {/* CONTACTS TAB */}
          {activeTab === 'contacts' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white/80">Device Contacts</h3>
                <button 
                  onClick={handlePickContact}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
                >
                  Import Contact
                </button>
              </div>

              {contacts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-sm text-white/40">No contacts imported yet.</p>
                  <p className="text-xs text-white/30 mt-2">Use the import button to select contacts from your device.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact, idx) => (
                    <div key={idx} className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white/90">{contact.name?.[0] || 'Unknown'}</p>
                        <p className="text-xs text-white/50 font-mono mt-1">{contact.tel?.[0] || 'No number'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setPhoneNumber(contact.tel?.[0] || '');
                            setActiveTab('messages');
                          }}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-[#ff4e00]"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setPhoneNumber(contact.tel?.[0] || '');
                            setActiveTab('dialer');
                          }}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-emerald-500"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
