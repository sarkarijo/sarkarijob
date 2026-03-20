// --- ADMIN LOGIN & SECURITY --- //
const ADMIN_PASSWORD_HASH = btoa("tumhara@secret123"); // Simple encoding for client-side demo
let failedAttempts = parseInt(localStorage.getItem('admin_failed_attempts')) || 0;
let lockTimeout = parseInt(localStorage.getItem('admin_lock_timeout')) || 0;

// Screens
const loginScreen = document.getElementById('login-screen');
const adminScreen = document.getElementById('admin-screen');
const errorMsg = document.getElementById('login-error');

// Elements
const pwdInput = document.getElementById('admin-password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

function checkAuth() {
    const isAuth = sessionStorage.getItem('admin_authenticated');
    const authTime = parseInt(sessionStorage.getItem('admin_auth_time')) || 0;

    // Auto logout after 30 mins
    if (isAuth === 'true' && (Date.now() - authTime < 30 * 60 * 1000)) {
        sessionStorage.setItem('admin_auth_time', Date.now()); // refresh timer
        loginScreen.classList.remove('active');
        adminScreen.classList.add('active');
        loadFormData();
        return true;
    } else {
        sessionStorage.removeItem('admin_authenticated');
        adminScreen.classList.remove('active');
        loginScreen.classList.add('active');
        return false;
    }
}

function handleLogin() {
    const now = Date.now();

    if (lockTimeout > now) {
        const minLeft = Math.ceil((lockTimeout - now) / 60000);
        errorMsg.innerText = `System locked! Try again in ${minLeft} minutes.`;
        return;
    } else if (lockTimeout > 0) {
        // Reset lock
        failedAttempts = 0;
        lockTimeout = 0;
        localStorage.removeItem('admin_failed_attempts');
        localStorage.removeItem('admin_lock_timeout');
    }

    const inputPwd = pwdInput.value;

    if (btoa(inputPwd) === ADMIN_PASSWORD_HASH) {
        // Success
        failedAttempts = 0;
        localStorage.removeItem('admin_failed_attempts');
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_auth_time', Date.now());
        pwdInput.value = '';
        errorMsg.innerText = '';
        checkAuth();
    } else {
        // Fail
        failedAttempts++;
        localStorage.setItem('admin_failed_attempts', failedAttempts);

        if (failedAttempts >= 3) {
            lockTimeout = now + (10 * 60 * 1000); // 10 mins lock
            localStorage.setItem('admin_lock_timeout', lockTimeout);
            errorMsg.innerText = `Too many failed attempts. Locked for 10 minutes.`;
        } else {
            errorMsg.innerText = `Access Denied! ❌ (${3 - failedAttempts} attempts left)`;
        }
    }
}

loginBtn.addEventListener('click', handleLogin);
pwdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
});

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('admin_authenticated');
    checkAuth();
});

// Initialize Auth
checkAuth();


// --- FORM LOGIC & AUTO-SAVE --- //
const form = document.getElementById('post-generator-form');
const saveStatus = document.getElementById('auto-save-status');
const inputsTag = form.querySelectorAll('input, select, textarea');

// Auto-populate SEO fields
const titleInp = document.getElementById('postTitle');
const seoTitleInp = document.getElementById('seoTitle');
const fileInp = document.getElementById('fileName');
const descInp = document.getElementById('shortDesc');
const metaDescInp = document.getElementById('metaDesc');

// Character counters
const titleCount = document.getElementById('titleCount');
const descCount = document.getElementById('descCount');

function updateCounters() {
    titleCount.innerText = seoTitleInp.value.length;
    descCount.innerText = metaDescInp.value.length;

    titleCount.style.color = seoTitleInp.value.length > 60 ? 'red' : 'inherit';
    descCount.style.color = metaDescInp.value.length > 160 ? 'red' : 'inherit';
}

seoTitleInp.addEventListener('input', updateCounters);
metaDescInp.addEventListener('input', updateCounters);

// Auto-fill logic
titleInp.addEventListener('blur', () => {
    if (!seoTitleInp.value) {
        seoTitleInp.value = titleInp.value;
        updateCounters();
    }
    if (!fileInp.value && titleInp.value) {
        let clean = titleInp.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        fileInp.value = clean + '.html';
    }
});

descInp.addEventListener('blur', () => {
    if (!metaDescInp.value && descInp.value) {
        metaDescInp.value = descInp.value.substring(0, 155) + '...';
        updateCounters();
    }
});

// Auto Save Draft
let saveTimeout;
function saveFormData() {
    const data = {};
    inputsTag.forEach(el => {
        if (el.type === 'checkbox' || el.type === 'radio') {
            data[el.id || el.name + '_' + el.value] = el.checked;
        } else {
            if (el.id) data[el.id] = el.value;
        }
    });
    localStorage.setItem('admin_form_draft', JSON.stringify(data));

    saveStatus.innerHTML = '<i class="fa-solid fa-cloud-check"></i> Saved just now';
    saveStatus.style.color = '#4CAF50';
}

function loadFormData() {
    const draft = localStorage.getItem('admin_form_draft');
    if (!draft) return;
    try {
        const data = JSON.parse(draft);
        inputsTag.forEach(el => {
            if (el.type === 'checkbox' || el.type === 'radio') {
                const key = el.id || el.name + '_' + el.value;
                if (data[key] !== undefined) el.checked = data[key];
            } else {
                if (el.id && data[el.id]) el.value = data[el.id];
            }
        });
        updateCounters();
    } catch (e) { }
}

inputsTag.forEach(el => {
    el.addEventListener('input', () => {
        saveStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        saveStatus.style.color = '#a0aec0';
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveFormData, 2000); // 2 sec debounce
    });
});

document.getElementById('clear-form-btn').addEventListener('click', () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
        form.reset();
        localStorage.removeItem('admin_form_draft');
        updateCounters();
        saveStatus.innerHTML = '<i class="fa-solid fa-cloud"></i> Cleared';
    }
});


// --- HTML GENERATOR --- //
function getPaymentModes() {
    let checked = [];
    document.querySelectorAll('#paymentModes input:checked').forEach(cb => checked.push(cb.value));
    return checked.join(', ') || 'Not Specified';
}

function getJobType() {
    const checked = document.querySelector('input[name="job_type"]:checked');
    return checked ? checked.value : 'Permanent';
}

function generateHTML() {
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    // Replace newlines with <br> for textareas
    const formatBrs = (text) => text.replace(/\n/g, '<br>');

    // Extract Form Values with Fallbacks
    const P = {
        SEO_TITLE: document.getElementById('seoTitle').value || 'New Job Update',
        META_DESCRIPTION: document.getElementById('metaDesc').value || '',
        FOCUS_KEYWORD: document.getElementById('focusKeyword').value || '',
        FILE_NAME: document.getElementById('fileName').value || 'new-post.html',
        POST_TITLE: document.getElementById('postTitle').value || 'No Title Provided',
        ORGANIZATION: document.getElementById('organization').value || 'Various',
        POST_NAME: document.getElementById('postName').value || 'Various Posts',
        TOTAL_VACANCY: document.getElementById('totalVacancy').value || 'Not Disclosed',
        JOB_LOCATION: document.getElementById('jobLocation').value || 'All India',
        NOTIFICATION_DATE: document.getElementById('notificationDate').value || '-',
        APPLY_START_DATE: document.getElementById('applyStartDate').value || '-',
        APPLY_LAST_DATE: document.getElementById('applyLastDate').value || '-',
        EXAM_DATE: document.getElementById('examDate').value || 'Notified Later',
        GENERAL_FEE: document.getElementById('genFee').value || '0/-',
        SC_FEE: document.getElementById('scFee').value || '0/-',
        FEMALE_FEE: document.getElementById('femaleFee').value || '0/-',
        PAYMENT_MODE: getPaymentModes(),
        AGE_LIMIT: document.getElementById('ageLimit').value || 'Refer Notification',
        AGE_RELAXATION: document.getElementById('ageRelaxation').value || 'As per Rules',
        QUALIFICATION: formatBrs(document.getElementById('qualification').value || ''),
        PAY_SCALE: document.getElementById('payScale').value || 'As per Rules',
        JOB_TYPE: getJobType(),
        SELECTION_PROCESS: document.getElementById('selectionProcess').value || 'Written Exam',
        SHORT_DESC: formatBrs(document.getElementById('shortDesc').value || ''),
        FULL_ARTICLE: formatBrs(document.getElementById('fullArticle').value || ''),
        HOW_TO_APPLY: `<p>${formatBrs(document.getElementById('howToApply').value || '')}</p>`,
        APPLY_LINK: document.getElementById('applyLink').value || '#',
        NOTIFICATION_LINK: document.getElementById('notificationLink').value || '#',
        OFFICIAL_WEBSITE: document.getElementById('websiteLink').value || '#',
        TODAY_DATE: today
    };

    const template = `<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${P.SEO_TITLE} | SarkariJobs</title>
    
    <meta name="description" content="${P.META_DESCRIPTION}">
    <meta name="keywords" content="${P.FOCUS_KEYWORD}, ${P.ORGANIZATION}, ${P.POST_NAME}, sarkari naukri 2026, government jobs india">
    
    <meta property="og:title" content="${P.SEO_TITLE}">
    <meta property="og:description" content="${P.META_DESCRIPTION}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://sarkarijo.github.io/sarkajiob/posts/${P.FILE_NAME}">
    
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${P.SEO_TITLE}">
    
    <link rel="canonical" href="https://sarkarijo.github.io/sarkajiob/posts/${P.FILE_NAME}">
    <link rel="stylesheet" href="../css/style.css">
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": "${P.POST_TITLE}",
      "description": "${P.SHORT_DESC.replace(/"/g, "'").replace(/<br>/g, ' ')}",
      "hiringOrganization": {
        "@type": "Organization",
        "name": "${P.ORGANIZATION}"
      },
      "jobLocation": {
        "@type": "Place",
        "address": "${P.JOB_LOCATION}"
      },
      "datePosted": "${P.NOTIFICATION_DATE}",
      "validThrough": "${P.APPLY_LAST_DATE}",
      "employmentType": "${P.JOB_TYPE}"
    }
    </script>
</head>

<body>
    <!-- HEADER -->
    <header>
        <div class="logo">SarkariJobs</div>
        <nav>
            <ul>
                <li><a href="../index.html">Home</a></li>
                <li><a href="../pages/latest-jobs.html">Latest Jobs</a></li>
                <li><a href="../pages/results.html">Results</a></li>
                <li><a href="../pages/admit-cards.html">Admit Card</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="post-details">
            <nav class="breadcrumb">
                <a href="../index.html">Home</a> &gt; <a href="../pages/latest-jobs.html">Latest Jobs</a> &gt; ${P.POST_TITLE}
            </nav>

            <h1>${P.POST_TITLE}</h1>
            <p class="post-meta">Post Date / Update: ${P.TODAY_DATE} | Short Information: ${P.SHORT_DESC}</p>
            
            <div class="table-container">
                <table class="data-table">
                    <tr>
                        <th colspan="2" class="table-title">Short Details of Notification</th>
                    </tr>
                    <tr>
                        <td><strong>Organization Name</strong></td>
                        <td>${P.ORGANIZATION}</td>
                    </tr>
                    <tr>
                        <td><strong>Post Name</strong></td>
                        <td>${P.POST_NAME}</td>
                    </tr>
                    <tr>
                        <td><strong>Total Vacancy</strong></td>
                        <td><span class="highlight">${P.TOTAL_VACANCY}</span></td>
                    </tr>
                    <tr>
                        <td><strong>Job Location</strong></td>
                        <td>${P.JOB_LOCATION}</td>
                    </tr>
                </table>

                <br>
                <div class="grid-table-container">
                    <table class="data-table">
                        <tr><th class="table-title">Important Dates</th></tr>
                        <tr><td>Application Begin: <strong>${P.APPLY_START_DATE}</strong></td></tr>
                        <tr><td>Last Date for Apply Online: <strong class="red-text">${P.APPLY_LAST_DATE}</strong></td></tr>
                        <tr><td>Last Date Pay Exam Fee: <strong>${P.FEES_LAST_DATE || P.APPLY_LAST_DATE}</strong></td></tr>
                        <tr><td>Exam Date: <strong>${P.EXAM_DATE}</strong></td></tr>
                    </table>

                    <table class="data-table">
                        <tr><th class="table-title">Application Fee</th></tr>
                        <tr><td>General / OBC / EWS: <strong>${P.GENERAL_FEE}</strong></td></tr>
                        <tr><td>SC / ST: <strong>${P.SC_FEE}</strong></td></tr>
                        <tr><td>All Category Female: <strong>${P.FEMALE_FEE}</strong></td></tr>
                        <tr><td>Payment Mode: <strong>${P.PAYMENT_MODE}</strong></td></tr>
                    </table>
                </div>

                <br>
                <table class="data-table">
                    <tr><th colspan="2" class="table-title">Age Limit Details</th></tr>
                    <tr><td><strong>Age Limit</strong></td><td>${P.AGE_LIMIT}</td></tr>
                    <tr><td><strong>Age Relaxation</strong></td><td>${P.AGE_RELAXATION}</td></tr>
                </table>

                <br>
                <table class="data-table">
                    <tr><th colspan="2" class="table-title">Vacancy Details & Eligibility</th></tr>
                    <tr>
                        <td style="width: 30%"><strong>Education Qualification</strong></td>
                        <td>${P.QUALIFICATION}</td>
                    </tr>
                    <tr>
                        <td><strong>Salary / Pay Scale</strong></td>
                        <td>${P.PAY_SCALE}</td>
                    </tr>
                    <tr>
                        <td><strong>Selection Process</strong></td>
                        <td>${P.SELECTION_PROCESS}</td>
                    </tr>
                </table>

                ${P.FULL_ARTICLE ? `
                <br>
                <table class="data-table">
                    <tr><th class="table-title">More Details</th></tr>
                    <tr><td>${P.FULL_ARTICLE}</td></tr>
                </table>
                ` : ''}

                <br>
                <table class="data-table">
                    <tr><th class="table-title">How to Fill Online Form</th></tr>
                    <tr><td>
                        ${P.HOW_TO_APPLY}
                    </td></tr>
                </table>

                <br>
                <table class="data-table links-table">
                    <tr><th colspan="2" class="table-title">Important Links</th></tr>
                    <tr>
                        <td><strong>Apply Online</strong></td>
                        <td><a href="${P.APPLY_LINK}" class="btn-link" target="_blank">Click Here</a></td>
                    </tr>
                    <tr>
                        <td><strong>Download Notification</strong></td>
                        <td><a href="${P.NOTIFICATION_LINK}" class="btn-link" target="_blank">Click Here</a></td>
                    </tr>
                    <tr>
                        <td><strong>Official Website</strong></td>
                        <td><a href="${P.OFFICIAL_WEBSITE}" class="btn-link blue-link" target="_blank">Click Here</a></td>
                    </tr>
                </table>
            </div>

            <!-- Global Join Buttons -->
            <div class="join-channels">
                <a href="#" class="btn-wa"><i class="fab fa-whatsapp"></i> Join WhatsApp Channel</a>
                <a href="#" class="btn-tg"><i class="fab fa-telegram"></i> Join Telegram Channel</a>
            </div>

        </section>
    </main>

    <!-- FOOTER -->
    <footer>
        <p>&copy; 2026 SarkariJobs Updates.</p>
    </footer>
    <script src="../js/script.js"></script>
</body>
</html>`;

    return template;
}

// --- PREVIEW & DOWNLOAD --- //
const modal = document.getElementById('preview-modal');
const closeBtn = document.querySelector('.close-modal');
const iframe = document.getElementById('preview-frame');

document.getElementById('preview-btn').addEventListener('click', () => {
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const htmlObj = generateHTML();
    iframe.srcdoc = htmlObj;
    modal.style.display = "block";
});

closeBtn.onclick = function () {
    modal.style.display = "none";
}

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

document.getElementById('post-generator-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const htmlObj = generateHTML();
    const fileName = document.getElementById('fileName').value || 'new-post.html';

    // Create Blob and trigger download
    const blob = new Blob([htmlObj], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
});
