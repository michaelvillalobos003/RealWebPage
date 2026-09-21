/**
 * Michael Villalobos Portfolio - Admin Dashboard JavaScript (admin.js)
 * Manages authentication, message loading, filtering, status updates, summary calculations,
 * and Chart.js visualization.
 */

let adminToken = sessionStorage.getItem('adminToken') || '';
let messagesData = [];
let currentFilter = 'all';
let reasonChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  initAdminAuth();
  initFilters();
  initRefresh();
});

/**
 * Authentication management
 */
function initAdminAuth() {
  const loginForm = document.getElementById('adminLoginForm');
  const loginPanel = document.getElementById('adminLoginSection') || document.getElementById('adminLoginPanel');
  const dashboardView = document.getElementById('adminDashboardView');
  const loginError = document.getElementById('loginErrorAlert') || document.getElementById('adminLoginError');
  const logoutBtn = document.getElementById('logoutBtn') || document.getElementById('adminLogoutBtn');

  // Check if existing session token is valid
  if (adminToken) {
    verifyExistingSession();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (loginError) loginError.style.display = 'none';

      const passwordInput = document.getElementById('adminPassword');
      const password = passwordInput ? passwordInput.value.trim() : '';

      if (!password) {
        showLoginError('Please enter the Admin password.');
        return;
      }

      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
          adminToken = data.token;
          sessionStorage.setItem('adminToken', adminToken);
          if (passwordInput) passwordInput.value = '';

          showDashboard();
          loadAdminMessages();
        } else {
          showLoginError(data.error || 'Invalid password. Please try again.');
        }
      } catch (err) {
        console.error('Login error:', err);
        showLoginError('Connection error. Please verify the server is running.');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
      } catch (e) {}

      adminToken = '';
      sessionStorage.removeItem('adminToken');
      messagesData = [];
      showLogin();
    });
  }

  function showLoginError(msg) {
    if (loginError) {
      loginError.textContent = msg;
      loginError.style.display = 'block';
    }
  }

  async function verifyExistingSession() {
    try {
      const response = await fetch('/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (response.ok) {
        showDashboard();
        loadAdminMessages();
      } else {
        adminToken = '';
        sessionStorage.removeItem('adminToken');
        showLogin();
      }
    } catch (e) {
      showLogin();
    }
  }

  function showDashboard() {
    if (loginPanel) loginPanel.style.display = 'none';
    if (dashboardView) dashboardView.classList.add('active');
  }

  function showLogin() {
    if (loginPanel) loginPanel.style.display = 'block';
    if (dashboardView) dashboardView.classList.remove('active');
  }
}

function initRefresh() {
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadAdminMessages();
    });
  }
}

/**
 * Loads messages from server and updates UI
 */
async function loadAdminMessages() {
  if (!adminToken) return;

  try {
    const response = await fetch('/api/admin/messages', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 401) {
      sessionStorage.removeItem('adminToken');
      adminToken = '';
      location.reload();
      return;
    }

    const data = await response.json();
    messagesData = data.messages || [];

    // Update Summary Values
    updateSummaryStats(messagesData);

    // Update Reason Chart
    updateReasonChart(data.reasonsCount || calculateReasons(messagesData));

    // Render Messages List
    renderMessagesList();
  } catch (err) {
    console.error('Failed to load admin messages:', err);
  }
}

/**
 * Calculates and updates the 4 dashboard summary values
 */
function updateSummaryStats(messages) {
  const total = messages.length;
  const newCount = messages.filter(m => !m.replied).length;
  const repliedCount = messages.filter(m => m.replied).length;
  const replyRate = total > 0 ? ((repliedCount / total) * 100).toFixed(1) : 0;

  const totalEl = document.getElementById('statTotalValue') || document.getElementById('statTotalMessages');
  const newEl = document.getElementById('statNewValue') || document.getElementById('statNewMessages');
  const repliedEl = document.getElementById('statRepliedValue') || document.getElementById('statRepliedMessages');
  const rateEl = document.getElementById('statRateValue') || document.getElementById('statReplyRate');

  if (totalEl) totalEl.textContent = total;
  if (newEl) newEl.textContent = newCount;
  if (repliedEl) repliedEl.textContent = repliedCount;
  if (rateEl) rateEl.textContent = `${replyRate}%`;

  const countAll = document.getElementById('countAll');
  const countNew = document.getElementById('countNew');
  const countReplied = document.getElementById('countReplied');
  if (countAll) countAll.textContent = total;
  if (countNew) countNew.textContent = newCount;
  if (countReplied) countReplied.textContent = repliedCount;
}

/**
 * Filter buttons setup (All, New, Replied)
 */
function initFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter ? btn.dataset.filter.toLowerCase() : 'all';
      renderMessagesList();
    });
  });
}

/**
 * Renders filtered messages list with newest first
 */
function renderMessagesList() {
  const container = document.getElementById('messagesListContainer') || document.getElementById('messagesContainer');
  if (!container) return;

  container.innerHTML = '';

  let filtered = [...messagesData];
  if (currentFilter === 'new') {
    filtered = filtered.filter(m => !m.replied);
  } else if (currentFilter === 'replied') {
    filtered = filtered.filter(m => m.replied);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem; color: var(--color-text-muted);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📭</div>
        <p>No messages found matching the <strong>${currentFilter}</strong> filter.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(msg => {
    const card = document.createElement('div');
    card.className = `message-card ${msg.replied ? 'replied' : 'new'}`;
    card.id = `msg-${msg.id}`;

    const dateFormatted = new Date(msg.submittedAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const repliedAtFormatted = msg.repliedAt ? new Date(msg.repliedAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : '';

    const statusBadge = msg.replied
      ? `<span class="badge-status replied">✓ Replied</span>`
      : `<span class="badge-status new">● New</span>`;

    const actionButton = !msg.replied
      ? `<button class="btn btn-sm btn-primary mark-replied-btn" data-id="${msg.id}">
           Mark as Replied
         </button>`
      : `<span style="color: var(--color-success); font-weight: 600; font-size: 0.85rem;">Replied on ${repliedAtFormatted}</span>`;

    card.innerHTML = `
      <div class="message-top">
        <div>
          <div class="message-sender">${escapeHtml(msg.firstName)} ${escapeHtml(msg.lastName)}</div>
          <a href="mailto:${escapeHtml(msg.email)}" class="message-email">${escapeHtml(msg.email)}</a>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="badge-reason">${escapeHtml(msg.reason)}</span>
          ${statusBadge}
        </div>
      </div>
      <div class="message-body-text">${escapeHtml(msg.message)}</div>
      <div class="message-footer-bar">
        <div>Submitted: <strong>${dateFormatted}</strong></div>
        <div>${actionButton}</div>
      </div>
    `;

    container.appendChild(card);
  });

  // Attach event listeners to Mark as Replied buttons
  container.querySelectorAll('.mark-replied-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const messageId = e.currentTarget.dataset.id;
      await markAsReplied(messageId, e.currentTarget);
    });
  });
}

/**
 * Marks a message as replied via PATCH /api/admin/messages/:id/replied
 */
async function markAsReplied(id, buttonEl) {
  if (!adminToken) return;

  if (buttonEl) {
    buttonEl.disabled = true;
    buttonEl.textContent = 'Updating...';
  }

  try {
    const response = await fetch(`/api/admin/messages/${id}/replied`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      const updated = result.message;

      // Update in local array
      const idx = messagesData.findIndex(m => m.id === id);
      if (idx !== -1 && updated) {
        messagesData[idx] = updated;
      }

      // Re-calculate statistics and re-render
      updateSummaryStats(messagesData);
      renderMessagesList();
    } else {
      alert('Failed to mark message as replied. Please check server connection.');
      if (buttonEl) {
        buttonEl.disabled = false;
        buttonEl.textContent = 'Mark as Replied';
      }
    }
  } catch (err) {
    console.error('Error marking as replied:', err);
    alert('An error occurred. Please try again.');
    if (buttonEl) {
      buttonEl.disabled = false;
      buttonEl.textContent = 'Mark as Replied';
    }
  }
}

/**
 * Calculates reasons count from messages array
 */
function calculateReasons(messages) {
  const reasons = {
    Comment: 0,
    Question: 0,
    Partnership: 0,
    Opportunity: 0,
    Other: 0
  };

  messages.forEach(m => {
    if (reasons[m.reason] !== undefined) {
      reasons[m.reason]++;
    } else {
      reasons.Other++;
    }
  });

  return reasons;
}

/**
 * Chart.js Reason for Contact visualization
 * Styled with the Light Blue + Dark Black aesthetic
 */
function updateReasonChart(reasonsCount) {
  const canvas = document.getElementById('reasonsChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const categories = ['Comment', 'Question', 'Partnership', 'Opportunity', 'Other'];
  const values = categories.map(cat => reasonsCount[cat] || 0);

  if (reasonChartInstance) {
    reasonChartInstance.data.datasets[0].data = values;
    reasonChartInstance.update();
    return;
  }

  const ctx = canvas.getContext('2d');
  reasonChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [{
        label: 'Inquiries by Reason',
        data: values,
        backgroundColor: [
          'rgba(56, 189, 248, 0.85)',
          'rgba(14, 165, 233, 0.85)',
          'rgba(125, 211, 252, 0.85)',
          'rgba(2, 132, 199, 0.85)',
          'rgba(186, 230, 253, 0.85)'
        ],
        borderColor: [
          '#38bdf8',
          '#0ea5e9',
          '#7dd3fc',
          '#0284c7',
          '#bae6fd'
        ],
        borderWidth: 1.5,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#070b14',
          titleColor: '#ffffff',
          bodyColor: '#38bdf8',
          borderColor: 'rgba(56, 189, 248, 0.3)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              return ` ${context.parsed.y} submission${context.parsed.y === 1 ? '' : 's'}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            color: '#94a3b8',
            font: {
              family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }
          },
          grid: {
            color: 'rgba(56, 189, 248, 0.08)'
          }
        },
        x: {
          ticks: {
            color: '#e2e8f0',
            font: {
              family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              weight: '600'
            }
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
