// assets/js/sarkari-common.js

const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/000000000000"; // Update URL here
const TELEGRAM_CHANNEL = "https://t.me/sarkarijobs"; // Update URL here

document.addEventListener('DOMContentLoaded', () => {

    // 1. DYNAMIC SOCIAL BUTTON INJECTION
    const socialPlaceholders = document.querySelectorAll('.social-follow-placeholder');

    const socialHTML = `
    <div class="social-follow-box">
      <table class="social-table">
        <tbody>
            <tr>
            <td class="social-label">Join Our WhatsApp Channel</td>
            <td class="social-link">
                <a href="${WHATSAPP_CHANNEL}" target="_blank" rel="noopener">
                <button class="follow-btn whatsapp-btn">Follow Now</button>
                </a>
            </td>
            </tr>
            <tr>
            <td class="social-label">Join Our Telegram Channel</td>
            <td class="social-link">
                <a href="${TELEGRAM_CHANNEL}" target="_blank" rel="noopener">
                <button class="follow-btn telegram-btn">Follow Now</button>
                </a>
            </td>
            </tr>
        </tbody>
      </table>
    </div>`;

    socialPlaceholders.forEach(el => {
        el.innerHTML = socialHTML;
    });

    // 2. LANGUAGE TOGGLE LOGIC
    const toggleBtn = document.getElementById('masterLangBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isEnglish = toggleBtn.textContent.includes('Hindi');

            // Handle element classes
            document.querySelectorAll('.en-text').forEach(el => {
                if (isEnglish) { el.classList.remove('d-none'); } else { el.classList.add('d-none'); }
            });
            document.querySelectorAll('.hi-text').forEach(el => {
                if (isEnglish) { el.classList.add('d-none'); } else { el.classList.remove('d-none'); }
            });

            toggleBtn.textContent = isEnglish ? 'View in Hindi' : 'View in English';
        });
    }

    // 3. FAQ ACCORDION LOGIC
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('active');
            const arrow = item.querySelector('.arrow') || item.querySelector('span');
            if (arrow) {
                arrow.textContent = item.classList.contains('active') ? '▲' : '▼';
            }
        });
    });

    // 4. PRINT BUTTON LOGIC
    const printBtns = document.querySelectorAll('.btn-print');
    printBtns.forEach(btn => {
        btn.addEventListener('click', () => window.print());
    });
});
