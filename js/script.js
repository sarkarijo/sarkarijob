document.addEventListener("DOMContentLoaded", () => {
    // 1. Search Bar Functionality
    const searchInput = document.getElementById("jobSearch");
    if (searchInput) {
        searchInput.addEventListener("keyup", function () {
            const filter = this.value.toLowerCase();
            const jobCards = document.querySelectorAll(".job-card");

            jobCards.forEach(card => {
                const title = card.querySelector(".job-title").textContent.toLowerCase();
                const org = card.querySelector(".org-name").textContent.toLowerCase();

                if (title.includes(filter) || org.includes(filter)) {
                    card.style.display = "block";
                } else {
                    card.style.display = "none";
                }
            });
        });
    }

    // 2. Back to Top Button
    const backToTopBtn = document.getElementById("back-to-top");
    if (backToTopBtn) {
        window.addEventListener("scroll", () => {
            if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
                backToTopBtn.style.display = "block";
            } else {
                backToTopBtn.style.display = "none";
            }
        });

        backToTopBtn.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    // 3. Date Check for Expired vs Active Jobs
    const jobCards = document.querySelectorAll(".job-card");

    jobCards.forEach(card => {
        const dateSpan = card.querySelector(".last-date-val");
        if (dateSpan) {
            const dateText = dateSpan.textContent; // Expected format: YYYY-MM-DD
            const lastDate = new Date(dateText);
            const today = new Date();

            // Need to normalize times to just compare dates
            lastDate.setHours(23, 59, 59, 999);

            const badgeContainer = card.querySelector(".badge-container");
            if (badgeContainer) {
                if (today > lastDate) {
                    // Expired
                    badgeContainer.innerHTML = '<span class="badge-expired">EXPIRED</span>';
                    dateSpan.parentElement.style.color = "var(--text-light)";
                    card.style.opacity = "0.7";

                    // Disable apply button conceptually or change text
                    const applyBtn = card.querySelector(".btn-primary");
                    if (applyBtn) {
                        applyBtn.textContent = "View Details";
                        applyBtn.style.backgroundColor = "var(--text-light)";
                    }
                } else {
                    // Check if newly added (within last 3 days)
                    // For demo purposes, checking if difference between post date and today is < 3 days
                    // Assuming card has a data-post-date attribute, else just showing "NEW" randomly
                    const postDateAttr = card.getAttribute('data-post-date');
                    if (postDateAttr) {
                        const postDate = new Date(postDateAttr);
                        const diffTime = Math.abs(today - postDate);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays <= 3) {
                            badgeContainer.innerHTML = '<span class="badge-new">NEW</span>';
                        }
                    } else {
                        // Default show NEW if active
                        badgeContainer.innerHTML = '<span class="badge-new">NEW</span>';
                    }
                }
            }
        }
    });

    // Similarly process article page dates if needed
    const postEndDate = document.getElementById("postEndDate");
    if (postEndDate) {
        const dateText = postEndDate.textContent;
        const lastDate = new Date(dateText);
        const today = new Date();
        lastDate.setHours(23, 59, 59, 999);

        if (today > lastDate) {
            const applyBtn = document.querySelector(".btn-green");
            if (applyBtn) {
                applyBtn.style.backgroundColor = "var(--text-light)";
                applyBtn.style.cursor = "not-allowed";
                applyBtn.textContent = "Application Closed";
                applyBtn.removeAttribute("href");
                applyBtn.onclick = (e) => e.preventDefault();
            }
        }
    }

    // 4. Translation Logic (Hindi/English Toggle)
    const langToggleBtn = document.getElementById('lang-toggle');
    if (langToggleBtn) {
        let currentLang = 'hi'; // Default is Hindi

        langToggleBtn.addEventListener('click', () => {
            const translatableElements = document.querySelectorAll('[data-en]');

            if (currentLang === 'hi') {
                // Switch to English
                translatableElements.forEach(el => {
                    if (!el.hasAttribute('data-hi')) {
                        el.setAttribute('data-hi', el.innerHTML);
                    }
                    el.innerHTML = el.getAttribute('data-en');
                });
                langToggleBtn.textContent = 'View in Hindi';
                langToggleBtn.style.backgroundColor = 'var(--accent-color)'; // Gold
                langToggleBtn.style.color = 'var(--primary-color)'; // Navy Text
                currentLang = 'en';
            } else {
                // Switch back to Hindi
                translatableElements.forEach(el => {
                    el.innerHTML = el.getAttribute('data-hi');
                });
                langToggleBtn.textContent = 'View in English';
                langToggleBtn.style.backgroundColor = 'var(--primary-color)'; // Navy
                langToggleBtn.style.color = '#FFFFFF'; // White text
                currentLang = 'hi';
            }
        });
    }

    // 5. Dynamic NEW Badge Expiry Logic
    // Badges older than 4 days will be hidden automatically
    const badges = document.querySelectorAll('.badge-new');
    const today = new Date(); // Local date

    badges.forEach(badge => {
        const dateStr = badge.getAttribute('data-date');
        if (dateStr) {
            const postDate = new Date(dateStr);
            const diffTime = Math.abs(today - postDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 4) {
                badge.style.display = 'none';
            }
        }
    });

    // ==================== SarkariMitra AI V3 ====================

    // Helper: Base URL setup
    const SITE_URL = "https://sarkarijo.github.io/sarkarijob";
    const indexURL = SITE_URL + '/index.html';

    function getPostLink(fileName) {
        return SITE_URL + "/posts/" + fileName;
    }

    // Global Knowledge Base
    let sitePosts = [];

    // Auto-fetch website posts
    async function loadWebsiteData() {
        try {
            let docToScrape = document;
            if (!document.querySelector('.info-boxes')) {
                const res = await fetch(indexURL);
                if (!res.ok) return;
                const html = await res.text();
                const parser = new DOMParser();
                docToScrape = parser.parseFromString(html, 'text/html');
            }

            docToScrape.querySelectorAll('.info-list a').forEach(aTag => {
                const href = aTag.getAttribute('href');
                if (href && href !== '#') {
                    let fullTitle = aTag.innerText.replace('NEW', '').trim();
                    let category = 'latest_jobs';
                    const boxHeader = aTag.closest('.info-box')?.querySelector('.info-box-header');
                    if (boxHeader) {
                        category = boxHeader.innerText.toLowerCase().replace(' ', '_');
                    }

                    const cleanHref = href.startsWith('./') ? href.slice(2) : (href.startsWith('/') ? href.slice(1) : href);
                    const postLink = SITE_URL + '/' + cleanHref;

                    if (!sitePosts.some(p => p.url === postLink)) {
                        sitePosts.push({ title: fullTitle, url: postLink, category: category });
                    }
                }
            });
        } catch (e) {
            console.error("Chatbot Error fetching data:", e);
        }
    }
    loadWebsiteData();

    // Inject Chatbot UI
    const chatbotHTML = `
        <div id="chatbot-container">
            <button id="chatbot-btn">💬</button>
            <div id="chatbot-window">
                <div id="chatbot-header">
                    <div class="header-title">
                        <strong>SarkariMitra AI</strong>
                        <small>Aapki Naukri Partner 🤝 <span class="online-dot"></span></small>
                    </div>
                    <span id="chatbot-close">✖</span>
                </div>
                <div id="chatbot-messages">
                    <div class="chat-msg bot">
                        Namaste! 😊<br>Main SarkariMitra AI hoon.<br>Aapki sarkari naukri dhundhne mein help karna mera kaam hai!<br><br>Aap mujhse pooch sakte hain:<br>- Latest Bharti<br>- Admit Card<br>- Results<br>- Apply Kaise Karein<br><br>Batao main kya help kar sakta hoon? 😊
                        <div class="chat-timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div class="quick-replies" id="chatbot-qr">
                        <button class="qr-btn" data-text="Latest Jobs">🆕 Latest Jobs</button>
                        <button class="qr-btn" data-text="Admit Card">📋 Admit Card</button>
                        <button class="qr-btn" data-text="Results">📊 Results</button>
                        <button class="qr-btn" data-text="Help">❓ Help</button>
                    </div>
                    <div id="typing-indicator" class="typing-indicator">SarkariMitra soch raha hai... 🤔</div>
                </div>
                <div id="chatbot-input-area">
                    <input type="text" id="chatbot-input" placeholder="Koi bhi sawaal poochein...">
                    <button id="chatbot-send">➤</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    const chatbotBtn = document.getElementById('chatbot-btn');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const typingIndicator = document.getElementById('typing-indicator');

    let isChatOpen = false;

    chatbotBtn.addEventListener('click', () => {
        isChatOpen = !isChatOpen;
        chatbotWindow.style.display = isChatOpen ? 'flex' : 'none';
        if (isChatOpen) chatbotInput.focus();
    });

    chatbotClose.addEventListener('click', () => {
        isChatOpen = false;
        chatbotWindow.style.display = 'none';
    });

    // Formatting Links Rule 4
    function createLinkHTML(url, title) {
        return `
    <a href="${url}" 
       target="_blank"
       rel="noopener noreferrer"
       onclick="event.stopPropagation()"
       class="chat-link-btn">
      🔗 ${title} — Yahan Dekho →
    </a><br>`;
    }

    // Verify Link Rule 2
    async function getSafeLink(url) {
        try {
            const res = await fetch(url, { method: 'HEAD' });
            if (res.ok) {
                return url;
            } else {
                return SITE_URL;
            }
        } catch {
            return SITE_URL;
        }
    }

    async function verifyLinkAndShow(url, title, additionalText = '') {
        const safeUrl = await getSafeLink(url);
        return additionalText + "<br>" + createLinkHTML(safeUrl, title);
    }

    // Append Message to UI
    function appendMessage(text, sender) {
        chatbotMessages.appendChild(typingIndicator);

        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender}`;
        msgDiv.innerHTML = `${text} <div class="chat-timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>`;

        chatbotMessages.insertBefore(msgDiv, typingIndicator);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // Quick Replies Binding
    document.querySelectorAll('.qr-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const text = e.target.getAttribute('data-text');
            appendMessage(text, 'user');
            handleAutomatedResponse(text);
            e.target.parentElement.style.display = 'none';
        });
    });

    // Step 1: Spelling auto-fix (Fuzzy Matching Simulation)
    const misspellings = {
        'railwy': 'railway', 'railwek': 'railway', 'rrb': 'railway',
        'polise': 'police', 'polic': 'police',
        'rezult': 'result', 'reslt': 'result',
        'addmit': 'admit card', 'admit': 'admit card',
        'nokri': 'naukri', 'nawkri': 'naukri', 'job': 'naukri', 'vacancy': 'naukri', 'vacency': 'naukri',
        'sarkaari': 'sarkari'
    };
    function fuzzyFix(msg) {
        let text = msg.toLowerCase();
        for (const [wrong, right] of Object.entries(misspellings)) {
            text = text.replace(new RegExp('\\b' + wrong + '\\b', 'g'), right);
        }
        return text;
    }

    // Step 2 & 3: Intent Detect & Site Search
    async function findSiteAnswer(cleanMsg) {
        const isJobIntent = cleanMsg.includes('job hai kya') || cleanMsg.includes('naukri') || cleanMsg.includes('latest jobs');
        const isDateIntent = cleanMsg.includes('last date') || cleanMsg.includes('kab hai');
        const isApplyIntent = cleanMsg.includes('form kaise') || cleanMsg.includes('apply process');
        const isSscIntent = cleanMsg.includes('ssc');
        const isRailwayIntent = cleanMsg.includes('railway');
        const isResultIntent = cleanMsg.includes('result');
        const isAdmitIntent = cleanMsg.includes('admit card');
        const isAgeIntent = cleanMsg.includes('age limit') || cleanMsg.includes('eligibility');
        const isFeeIntent = cleanMsg.includes('fees') || cleanMsg.includes('paisa');
        const isSyllabusIntent = cleanMsg.includes('syllabus');

        if (cleanMsg.includes('help') || cleanMsg.includes('madad')) {
            return "Aap kisi bhi bharti ka naam type kar sakte hain, ya 'Latest Jobs', 'Admit Card' pooch sakte hain! 😊";
        }

        if (isSscIntent) {
            let sscPosts = sitePosts.filter(p => p.title.toLowerCase().includes('ssc'));
            if (sscPosts.length > 0) {
                let ans = await verifyLinkAndShow(sscPosts[0].url, sscPosts[0].title, "SSC ki recruitment aayi hai! 🎉<br>");
                return ans + "Kya aap syllabus bhi jaanna chahte ho?";
            }
        }

        if (isRailwayIntent && isJobIntent) {
            let ryPosts = sitePosts.filter(p => p.title.toLowerCase().includes('railway') || p.title.toLowerCase().includes('rrb'));
            if (ryPosts.length > 0) {
                let ans = await verifyLinkAndShow(ryPosts[0].url, ryPosts[0].title, "Railway ki baat kar rahe ho? 🚂<br>Latest Railway Jobs:<br>");
                return ans + "Kya age limit ya fees jaanna chahte ho?";
            }
        }

        if (isAdmitIntent || isResultIntent || isJobIntent) {
            let catMatch = isAdmitIntent ? 'admit' : (isResultIntent ? 'answer' : 'latest');
            if (isResultIntent && sitePosts.some(p => p.category.includes('result'))) catMatch = 'result';

            // Better search: Find all posts where the title contains the exact phrase or all significant words
            let searchWords = cleanMsg.split(' ').filter(w => w.length > 2 && !['hai', 'kya', 'batao', 'dikhaye'].includes(w));
            let specificMatches = sitePosts.filter(p => {
                let titleObj = p.title.toLowerCase();
                return titleObj.includes(cleanMsg) || searchWords.every(w => titleObj.includes(w));
            });

            if (specificMatches.length > 0) {
                let icon = isAdmitIntent ? '🎉' : '🔥';
                let responseText = `Mujhe mil gaya! ${icon}<br><br>`;
                // Show top 3 matches
                for (let i = 0; i < Math.min(3, specificMatches.length); i++) {
                    responseText += await verifyLinkAndShow(specificMatches[i].url, specificMatches[i].title, "") + "<br>";
                }
                return responseText;
            } else {
                let genericCatPosts = sitePosts.filter(p => p.category.includes(catMatch));
                if (genericCatPosts.length > 0) {
                    let ans = "Bilkul! Yeh dekho abhi available hain:<br>";
                    genericCatPosts.slice(0, 3).forEach(p => { ans += `- ${p.title}<br>`; });
                    ans += await verifyLinkAndShow(SITE_URL, "Saari Latest Jobs Dekho", "<br>");
                    return ans + "Kaunsi field mein interest hai?";
                }
            }
        }

        // Better fallback keyword search if no intent mapped or no specific intent matches 
        let fallbackWords = cleanMsg.split(' ').filter(w => w.length > 1 && !['hai', 'kya', 'batao', 'dikhaye', 'mujhe', 'chahiye'].includes(w));

        if (fallbackWords.length > 0) {
            let specificMatches = sitePosts.filter(p => {
                let titleObj = p.title.toLowerCase();
                return titleObj.includes(cleanMsg) || fallbackWords.every(w => titleObj.includes(w)) || fallbackWords.some(w => titleObj.includes(w) && w.length > 3);
            });

            if (specificMatches.length > 0) {
                let preText = "Mujhe aapki bharti mil gayi! 🔍<br>";
                if (isAgeIntent) preText += "Age limit detail post mein di gayi hai. ";
                if (isFeeIntent) preText += "Fees ki jankari post mein hai. ";
                if (isDateIntent) preText += "Important dates yahan check karein: ";
                if (isApplyIntent) preText += "Apply karne ka process yahan hai: ";

                let responseText = preText + "<br>";
                for (let i = 0; i < Math.min(3, specificMatches.length); i++) {
                    responseText += await verifyLinkAndShow(specificMatches[i].url, specificMatches[i].title, "") + "<br>";
                }
                return responseText;
            }
        }

        return null;
    }

    // Step 5: Claude API Fallback
    async function callClaudeAPI(userMessage) {
        try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 1000,
                    system: `Tu SarkariMitra AI hai — ek helpful sarkari job assistant.\n\nKaam:\n- India ki govt jobs ki info do\n- Results, admit cards batao\n- Apply process samjhao\n- Hinglish mein baat karo\n- Short aur clear jawab do\n- Kabhi galat info mat do\n- Agar pata nahi toh honestly bolo\n\nStyle:\n- Friendly aur warm tone\n- 2-3 lines max per answer\n- Emojis use karo — but zyada nahi\n- Har answer ke end mein ek helpful suggestion do`,
                    messages: [{ role: "user", content: userMessage }]
                })
            });
            if (response.ok) {
                const data = await response.json();
                return data.content[0].text;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    async function handleAutomatedResponse(rawMsg) {
        typingIndicator.style.display = 'block';
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        const cleanMsg = fuzzyFix(rawMsg);
        let answer = await findSiteAnswer(cleanMsg);

        if (!answer) {
            const fallbackResponse = await callClaudeAPI(cleanMsg);
            if (fallbackResponse) {
                answer = fallbackResponse;
            } else {
                answer = "Maaf karna! Mujhe iski exact detail nahi mili. Kripya naya keyword try karein, ya 'Latest Jobs' par dekhein! 😊";
            }
        }

        typingIndicator.style.display = 'none';
        appendMessage(answer, 'bot');
    }

    function handleSend() {
        const text = chatbotInput.value.trim();
        if (text === '') return;

        appendMessage(text, 'user');
        chatbotInput.value = '';
        handleAutomatedResponse(text);
    }

    chatbotSend.addEventListener('click', handleSend);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

});
