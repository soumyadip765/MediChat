class HealthChatbot {
    constructor() {
        this.messages = document.getElementById('chatMessages');
        this.input = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.emergencyBtn = document.getElementById('emergencyBtn');
        this.banner = document.getElementById('emergencyBanner');

        const welcomeTs = document.getElementById('welcomeTs');
        if (welcomeTs) welcomeTs.textContent = this.now();

        this.listen();
    }

    /* ── Event Listeners ── */
    listen() {
        this.sendBtn.addEventListener('click', () => this.send());
        this.input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.send();
            }
        });
        this.emergencyBtn.addEventListener('click', () => this.showEmergencyResources());
    }

    /* ── Send Message ── */
    async send(text) {
        const msg = text || this.input.value.trim();
        if (!msg) return;

        this.addBubble(msg, true);
        this.input.value = '';

        // 🚨 Emergency check
        if (this.isEmergency(msg)) {
            this.triggerEmergency();
            return;
        }

        this.showTyping();

        try {
            let reply;

            // 🧠 Step 1: Try predefined response
            const predefined = this.respond(msg);

            if (predefined !== null) {
                reply = predefined;
            } else {
                // 🤖 Step 2: Call backend (Gemini)
                reply = await this.getAIResponse(msg);
            }

            this.removeTyping();
            this.addBubble(reply, false);

        } catch (err) {
            this.removeTyping();
            this.addBubble("⚠️ Server error. Please try again.", false);
        }
    }

    /* ── Backend API Call ── */
    async getAIResponse(message) {
        const response = await fetch("http://127.0.0.1:8000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        return data.reply;
    }

    /* ── Emergency Detection ── */
    isEmergency(m) {
        m = m.toLowerCase();
        const keywords = [
            'chest pain', 'chest tightness', 'heart attack',
            'difficulty breathing', "can't breathe", 'shortness of breath',
            'fainting', 'unconscious',
            'severe bleeding',
            'stroke',
            'suicidal', 'kill myself', 'want to die'
        ];
        return keywords.some(k => m.includes(k));
    }

    triggerEmergency() {
        this.banner.style.display = 'block';
        this.addBubble(`
            <strong>⚠️ Emergency detected</strong><br><br>
            Please call immediately:<br>
            📞 <strong>112</strong> (India Emergency)<br>
            📞 <strong>108</strong> (Ambulance)
        `, false);

        this.input.disabled = true;
        this.sendBtn.disabled = true;
    }

    showEmergencyResources() {
        this.addBubble(`
            <strong>🚨 Emergency Resources</strong><br>
            📞 112 (India)<br>
            📞 108 (Ambulance)<br><br>
            💛 Help is always available.
        `, false);
    }

    /* ── Response Router (returns NULL if not matched) ── */
    respond(m) {
        m = m.toLowerCase();

        if (m.includes('headache') || m.includes('head pain')) return this.headache();
        if (m.includes('fever')) return this.fever();
        if (m.includes('cold') || m.includes('flu')) return this.coldFlu();
        if (m.includes('stomach') || m.includes('nausea')) return this.stomach();
        if (m.includes('cough')) return this.cough();
        if (m.includes('throat')) return this.throat();
        if (m.includes('allerg')) return this.allergy();
        if (m.includes('anxiet') || m.includes('stress')) return this.mental();
        if (m.includes('help')) return this.help();

        return null; // 👈 IMPORTANT
    }

    /* ── Predefined Responses ── */

    headache() {
        return `<strong>Headache</strong><br>Rest, hydrate, reduce screen time. See a doctor if severe.`;
    }

    fever() {
        return `<strong>Fever</strong><br>Stay hydrated, rest. If above 103°F or lasts >3 days → doctor.`;
    }

    coldFlu() {
        return `<strong>Cold/Flu</strong><br>Rest, fluids, steam inhalation.`;
    }

    stomach() {
        return `<strong>Stomach Issue</strong><br>Try light diet (BRAT), avoid spicy food.`;
    }

    cough() {
        return `<strong>Cough</strong><br>Warm fluids, honey, steam.`;
    }

    throat() {
        return `<strong>Sore Throat</strong><br>Warm salt water gargle, hydration.`;
    }

    allergy() {
        return `<strong>Allergy</strong><br>Avoid triggers, antihistamines if needed.`;
    }

    mental() {
        return `<strong>Stress/Anxiety</strong><br>Deep breathing, talk to someone.`;
    }

    help() {
        return `I can help with symptoms, self-care, and when to see a doctor.`;
    }

    /* ── UI Helpers ── */

    addBubble(html, isUser) {
        const row = document.createElement('div');
        row.className = 'msg-row ' + (isUser ? 'user' : 'bot');

        if (!isUser) {
            const av = document.createElement('div');
            av.className = 'msg-avatar';
            av.textContent = '🩺';
            row.appendChild(av);
        }

        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.innerHTML = isUser ? this.escape(html) : html;
        row.appendChild(bubble);

        const ts = document.createElement('div');
        ts.className = 'ts';
        ts.textContent = this.now();
        row.appendChild(ts);

        this.messages.appendChild(row);
        this.scroll();
    }

    escape(s) {
        return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    now() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    showTyping() {
        this.typingRow = document.createElement('div');
        this.typingRow.className = 'msg-row bot typing';

        const av = document.createElement('div');
        av.className = 'msg-avatar';
        av.textContent = '🩺';

        const b = document.createElement('div');
        b.className = 'bubble';
        b.innerHTML = '<div class="dots"><span></span><span></span><span></span></div>';

        this.typingRow.appendChild(av);
        this.typingRow.appendChild(b);
        this.messages.appendChild(this.typingRow);
        this.scroll();
    }

    removeTyping() {
        if (this.typingRow) this.typingRow.remove();
    }

    scroll() {
        setTimeout(() => {
            this.messages.scrollTop = this.messages.scrollHeight;
        }, 50);
    }
}

/* ── Chips ── */
function chipSend(text) {
    window._bot.send(text);
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
    window._bot = new HealthChatbot();
});