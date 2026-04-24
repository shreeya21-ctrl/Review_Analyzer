const API_URL = 'http://localhost:3000/api';
const chartRegistry = {};

// Track selected business name separately to avoid fragile string splitting
let selectedBusinessName = '';

function destroyChart(chartId) {
    if (chartRegistry[chartId]) {
        chartRegistry[chartId].destroy();
        delete chartRegistry[chartId];
    }
}

function renderChart(chartId, config) {
    if (!window.Chart) return;
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    destroyChart(chartId);
    chartRegistry[chartId] = new Chart(canvas.getContext('2d'), config);
}

function bucketCredibilityScores(scores) {
    const buckets = [0, 0, 0, 0, 0];
    scores.forEach(rawScore => {
        const score = Number(rawScore);
        if (Number.isNaN(score)) return;
        const index = Math.min(4, Math.floor(score / 20));
        buckets[index]++;
    });
    return buckets;
}

function normalizeSimilarity(rawValue) {
    const value = Number(rawValue);
    if (Number.isNaN(value)) return 0;
    return value <= 1 ? value * 100 : value;
}

function getFlagDeduction(flag) {
    const explicitPoints = Number(flag?.points);
    if (Number.isFinite(explicitPoints) && explicitPoints !== 0) return explicitPoints;

    if (flag?.type === 'extreme_ratings') return -10;
    if (flag?.type === 'review_burst') return -14;
    if (flag?.type === 'near_duplicates') return -15;
    if (flag?.type === 'repeat_reviewers') return -8;
    if (flag?.type === 'low_effort') return -8;
    if (flag?.type === 'recency_spike') return -8;

    return 0;
}

function setChartContextLabel(text) {
    const label = document.getElementById('chartsContext');
    if (label) label.textContent = text;
}

function setChartTitles(first, second, third) {
    const t1 = document.getElementById('credibilityChartTitle');
    const t2 = document.getElementById('flaggedChartTitle');
    const t3 = document.getElementById('similarityChartTitle');
    if (t1) t1.textContent = first;
    if (t2) t2.textContent = second;
    if (t3) t3.textContent = third;
}

function getBusinessAssessment(score, flagCount) {
    if (score >= 90) {
        return flagCount > 0
            ? 'Mostly credible overall, but a few review patterns still deserve attention.'
            : 'This business looks broadly credible with no major warning patterns detected.';
    }
    if (score >= 75) {
        return 'This business is not clearly fake, but the flagged review patterns make it worth a closer look.';
    }
    return 'Multiple review signals look unusual here, so this business should be treated as higher risk.';
}

function getBarChartInteractionOptions(valueLabel) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        onHover(event, elements, chart) {
            if (chart?.canvas) {
                chart.canvas.style.cursor = elements.length ? 'pointer' : 'default';
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                callbacks: {
                    label(context) {
                        const value = Number(context.parsed.y ?? 0);
                        return `${value} ${valueLabel}${value === 1 ? '' : 's'}`;
                    }
                }
            }
        },
        scales: {
            x: { ticks: { color: '#b9b5ad' }, grid: { color: '#2a2a38' } },
            y: { beginAtZero: true, ticks: { color: '#b9b5ad' }, grid: { color: '#2a2a38' } }
        }
    };
}

// ── HOMEPAGE CHARTS ────────────────────────────────────────────────────────

function renderHomepageCharts(scoresData, pairsData) {
    setChartContextLabel('Showing overall platform trends');
    setChartTitles(
        'Review Credibility Distribution',
        'Flagged vs Clean Reviews',
        'Top Similarity Matches'
    );

    const scores = Array.isArray(scoresData?.scores) ? scoresData.scores : [];
    const scoreValues = scores.map(item => item.credibility_score);
    const scoreBuckets = bucketCredibilityScores(scoreValues);
    const hasScoreData = scoreBuckets.some(count => count > 0);

    const computedTotal = scores.length;
    const computedFlagged = scores.filter(item => Array.isArray(item.flags) && item.flags.length > 0).length;
    const total = Number(scoresData?.statistics?.total) || computedTotal;
    const flagged = Number(scoresData?.statistics?.flagged);
    const flaggedCount = Number.isFinite(flagged) ? flagged : computedFlagged;
    const cleanCount = Math.max(0, total - flaggedCount);

    // FIX: only render chart if real data exists; show empty state otherwise
    if (hasScoreData) {
        renderChart('credibilityDistributionChart', {
            type: 'bar',
            data: {
                labels: ['0–20', '21–40', '41–60', '61–80', '81–100'],
                datasets: [{
                    label: 'Review Count',
                    data: scoreBuckets,
                    backgroundColor: ['#f07070', '#f5a623', '#d7b95c', '#7c6af7', '#5cb85c'],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: getBarChartInteractionOptions('review')
        });
    } else {
        showCanvasEmptyState('credibilityDistributionChart', 'No score data available');
    }

    if (total > 0) {
        renderChart('flaggedVsCleanChart', {
            type: 'doughnut',
            data: {
                labels: ['Flagged', 'Clean'],
                datasets: [{
                    data: [flaggedCount, cleanCount],
                    backgroundColor: ['#f07070', '#5cb85c'],
                    borderColor: '#16161e',
                    borderWidth: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: { legend: { labels: { color: '#c8c4bc' } } }
            }
        });
    } else {
        showCanvasEmptyState('flaggedVsCleanChart', 'No review data available');
    }

    const pairs = Array.isArray(pairsData?.pairs) ? pairsData.pairs : [];
    const topPairs = pairs
        .map(pair => normalizeSimilarity(pair.similarity_score ?? pair.similarity))
        .filter(score => score > 0)
        .slice(0, 12);

    if (topPairs.length > 0) {
        const similarityValues = topPairs.map(score => Math.min(100, Number(score.toFixed(1))));
        renderChart('similarityTrendChart', {
            type: 'line',
            data: {
                labels: similarityValues.map((_, i) => `Pair ${i + 1}`),
                datasets: [{
                    label: 'Similarity %',
                    data: similarityValues,
                    borderColor: '#7c6af7',
                    backgroundColor: 'rgba(124, 106, 247, 0.2)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointBackgroundColor: '#a89cf7'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#c8c4bc' } } },
                scales: {
                    x: { ticks: { color: '#b9b5ad' }, grid: { color: '#2a2a38' } },
                    y: {
                        min: 0, max: 100,
                        ticks: { color: '#b9b5ad' },
                        grid: { color: '#2a2a38' }
                    }
                }
            }
        });
    } else {
        showCanvasEmptyState('similarityTrendChart', 'No similarity data available');
    }
}

// ── BUSINESS CHARTS ────────────────────────────────────────────────────────

function renderBusinessCharts(analysisData, businessName) {
    setChartContextLabel(`Showing business-specific trends for ${businessName}`);
    setChartTitles(
        'Selected Business: Rating Distribution',
        'Selected Business: Extreme vs Balanced Ratings',
        'Selected Business: Daily Review Activity'
    );

    const starDistribution = analysisData?.star_distribution || {};
    const starLabels = ['1★', '2★', '3★', '4★', '5★'];
    const starData = [1, 2, 3, 4, 5].map(star => Number(starDistribution[star] || 0));

    renderChart('credibilityDistributionChart', {
        type: 'bar',
        data: {
            labels: starLabels,
            datasets: [{
                label: 'Review Count',
                data: starData,
                backgroundColor: ['#f07070', '#f5a623', '#d7b95c', '#7c6af7', '#5cb85c'],
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: getBarChartInteractionOptions('review')
    });

    const totalReviews = Number(analysisData?.total_reviews || 0);
    const extremePercent = Number(analysisData?.extreme_rating_percent || 0);
    const extremeCount = Math.round((extremePercent / 100) * totalReviews);
    const balancedCount = Math.max(0, totalReviews - extremeCount);

    renderChart('flaggedVsCleanChart', {
        type: 'doughnut',
        data: {
            labels: ['Extreme (1★/5★)', 'Balanced (2★–4★)'],
            datasets: [{
                data: totalReviews > 0 ? [extremeCount, balancedCount] : [0, 1],
                backgroundColor: ['#f07070', '#5cb85c'],
                borderColor: '#16161e',
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: { legend: { labels: { color: '#c8c4bc' } } }
        }
    });

    const dailyCounts = analysisData?.daily_review_counts || {};
    const sortedDays = Object.entries(dailyCounts)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .slice(-10);

    if (sortedDays.length > 0) {
        renderChart('similarityTrendChart', {
            type: 'line',
            data: {
                labels: sortedDays.map(([date]) => date),
                datasets: [{
                    label: 'Reviews per Day',
                    data: sortedDays.map(([, count]) => count),
                    borderColor: '#7c6af7',
                    backgroundColor: 'rgba(124, 106, 247, 0.2)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: '#a89cf7'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#c8c4bc' } } },
                scales: {
                    x: { ticks: { color: '#b9b5ad', maxRotation: 45, minRotation: 25 }, grid: { color: '#2a2a38' } },
                    y: { beginAtZero: true, ticks: { color: '#b9b5ad' }, grid: { color: '#2a2a38' } }
                }
            }
        });
    } else {
        showCanvasEmptyState('similarityTrendChart', 'No date activity data available');
    }
}

// FIX: replace fake fallback data with a visible "backend unavailable" empty state
function showCanvasEmptyState(canvasId, message) {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#444';
    ctx.font = '14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function showStatsUnavailable() {
    document.getElementById('totalReviews').textContent = '—';
    document.getElementById('avgScore').textContent = '—';
    document.getElementById('suspiciousPercent').textContent = '—';
    document.getElementById('similarPairs').textContent = '—';

    const label = document.querySelector('.stat-card.warning p');
    if (label) label.textContent = 'Backend unavailable';

    showCanvasEmptyState('credibilityDistributionChart', 'Backend unavailable');
    showCanvasEmptyState('flaggedVsCleanChart', 'Backend unavailable');
    showCanvasEmptyState('similarityTrendChart', 'Backend unavailable');
}

// ── INIT ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadStates();
});

// ── STATS ───────────────────────────────────────────────────────────────────

async function loadStats() {
    try {
        // FIX: /api/stats now exists in server.js (was missing before)
        const [reviewsRes, scoresRes, pairsRes] = await Promise.all([
            fetch(`${API_URL}/stats`),
            fetch(`${API_URL}/credibility-scores?limit=1000`),
            fetch(`${API_URL}/similar-reviews`)
        ]);

        const reviewsData = await reviewsRes.json();
        const scoresData = await scoresRes.json();
        const pairsData = await pairsRes.json();

        document.getElementById('totalReviews').textContent =
            reviewsData.total_reviews != null
                ? reviewsData.total_reviews.toLocaleString()
                : '—';

        document.getElementById('avgScore').textContent =
            scoresData.statistics?.avg_score != null
                ? scoresData.statistics.avg_score.toFixed(1) + '/100'
                : '—';

        const total = scoresData.statistics?.total;
        const flagged = scoresData.statistics?.flagged;
        document.getElementById('suspiciousPercent').textContent =
            total > 0 && flagged != null
                ? ((flagged / total) * 100).toFixed(1) + '%'
                : '—';

        document.getElementById('similarPairs').textContent =
            pairsData.total != null ? pairsData.total : '—';

        renderHomepageCharts(scoresData, pairsData);

    } catch (error) {
        console.error('Stats load error:', error);
        // FIX: show honest empty state instead of misleading hardcoded numbers
        showStatsUnavailable();
        setChartContextLabel('Backend unavailable — start the server and refresh.');
    }
}

// ── STATE / BUSINESS DROPDOWNS ──────────────────────────────────────────────

async function loadStates() {
    const stateDropdown = document.getElementById('stateDropdown');
    stateDropdown.innerHTML = '<option value="">Loading states…</option>';

    try {
        const res = await fetch(`${API_URL}/states`);
        const data = await res.json();

        stateDropdown.innerHTML =
            '<option value="">— Select a State —</option>' +
            data.states.map(s => `<option value="${s}">${s}</option>`).join('');

        document.getElementById('businessDropdown').innerHTML = '<option value="">— Select a state first —</option>';
        document.getElementById('businessDropdown').disabled = true;
        document.getElementById('analyzeBtn').disabled = true;

    } catch (error) {
        console.error('Error loading states:', error);
        stateDropdown.innerHTML = '<option value="">Error loading states</option>';
    }
}

async function onStateChange() {
    const state = document.getElementById('stateDropdown').value;
    const businessDropdown = document.getElementById('businessDropdown');
    const countLabel = document.getElementById('businessCount');

    // Reset business name whenever state changes
    selectedBusinessName = '';

    if (!state) {
        businessDropdown.innerHTML = '<option value="">— Select a state first —</option>';
        businessDropdown.disabled = true;
        document.getElementById('analyzeBtn').disabled = true;
        countLabel.textContent = '';
        return;
    }

    businessDropdown.innerHTML = '<option value="">Loading businesses…</option>';
    businessDropdown.disabled = true;
    document.getElementById('analyzeBtn').disabled = true;
    countLabel.textContent = '';

    try {
        const res = await fetch(`${API_URL}/businesses/by-state?state=${encodeURIComponent(state)}`);
        const data = await res.json();

        if (!data.businesses || data.businesses.length === 0) {
            businessDropdown.innerHTML = '<option value="">No businesses found for this state</option>';
            countLabel.textContent = '';
            return;
        }

        // FIX: store name in a data attribute so we never need to parse the label text
        businessDropdown.innerHTML =
            `<option value="">— Select a Business (${data.total}) —</option>` +
            data.businesses.map(b =>
                `<option value="${b.business_id}" data-name="${b.name}">${b.name} — ${b.city} (${b.review_count} reviews)</option>`
            ).join('');

        businessDropdown.disabled = false;
        countLabel.textContent = `${data.total} businesses in ${state}`;

    } catch (error) {
        console.error('Error loading businesses:', error);
        businessDropdown.innerHTML = '<option value="">Error loading businesses</option>';
    }
}

function onBusinessChange() {
    const dropdown = document.getElementById('businessDropdown');
    const val = dropdown.value;
    document.getElementById('analyzeBtn').disabled = !val;

    if (val) {
        // FIX: read name from data attribute instead of parsing label text
        const selected = dropdown.options[dropdown.selectedIndex];
        selectedBusinessName = selected.dataset.name || selected.text;
        setChartContextLabel(`Selected "${selectedBusinessName}". Click Analyze to update these charts.`);
    } else {
        selectedBusinessName = '';
    }
}

// ── ANALYZE ─────────────────────────────────────────────────────────────────

async function searchBusiness() {
    const businessId = document.getElementById('businessDropdown').value;
    if (!businessId) return; // button is disabled when no value, but guard anyway

    // FIX: disable button during request to prevent double-clicks
    const analyzeBtn = document.getElementById('analyzeBtn');
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing…';

    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    const container = document.getElementById('analysisResults');
    container.innerHTML = '<p class="loading">Running deep analysis…</p>';

    // FIX: scroll AFTER setting innerHTML (inside try/finally)
    try {
        const res = await fetch(`${API_URL}/business/${businessId}/analyze`);
        const data = await res.json();

        if (data.error) {
            container.innerHTML = `
                <div class="business-results">
                    <h3 style="color:#f0ece4; margin-bottom:8px">No reviews found</h3>
                    <p style="color:#666">This business might not exist in our dataset.</p>
                </div>`;
            container.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        const score = data.credibility_score;
        const scoreClass = score >= 90 ? 'good' : score >= 75 ? 'moderate' : '';
        const verdictColor = score >= 90 ? '#5cb85c' : score >= 75 ? '#f5a623' : '#f07070';
        const assessmentText = getBusinessAssessment(score, data.flags?.length || 0);

        const dist = data.star_distribution || {};
        const maxStarCount = Math.max(...Object.values(dist), 1);
        const starBars = [5, 4, 3, 2, 1].map(star => {
            const count = dist[star] || 0;
            const pct = ((count / data.total_reviews) * 100).toFixed(1);
            const barWidth = ((count / maxStarCount) * 100).toFixed(1);
            const barColor = star >= 4 ? '#5cb85c' : star === 3 ? '#f5a623' : '#f07070';
            return `
                <div class="star-row">
                    <span class="star-label">${star}★</span>
                    <div class="star-bar-track">
                        <div class="star-bar-fill" style="width:${barWidth}%; background:${barColor}"></div>
                    </div>
                    <span class="star-count">${count} <span class="star-pct">(${pct}%)</span></span>
                </div>`;
        }).join('');

        const flagsHtml = data.flags && data.flags.length > 0
            ? data.flags.map(f => {
                const color = f.severity === 'high' ? '#f07070' : f.severity === 'medium' ? '#f5a623' : '#7c6af7';
                return `<div class="flag-item" style="border-left-color:${color}">
                    <span>${f.message}</span>
                    <span class="flag-severity" style="background:${color}">${getFlagDeduction(f)}</span>
                </div>`;
            }).join('')
            : `<div class="flag-item no-flags">No suspicious patterns detected</div>`;

        const rewardsHtml = data.rewards && data.rewards.length > 0
            ? data.rewards.map(r => `
                <div class="flag-item reward-item" style="border-left-color:#5cb85c">
                    <span>${r.message}</span>
                    <span class="flag-severity reward-severity" style="background:#5cb85c">+${r.points}</span>
                </div>`).join('')
            : `<div class="flag-item no-flags">No reward credits were applied</div>`;

        const dupHtml = data.near_duplicate_pairs && data.near_duplicate_pairs.length > 0
            ? `<div class="section-block">
                <h4>Near-Duplicate Review Pairs</h4>
                ${data.near_duplicate_pairs.map(p => `
                    <div class="dup-pair">
                        <div class="dup-score">${p.similarity}% similar</div>
                        <div class="dup-texts">
                            <div class="dup-text">"${p.text1}…"</div>
                            <div class="dup-text">"${p.text2}…"</div>
                        </div>
                    </div>`).join('')}
               </div>`
            : '';

        // FIX: use stored selectedBusinessName — no fragile string splitting
        const businessName = selectedBusinessName || businessId;

        // Render charts, then inject HTML, then scroll
        renderBusinessCharts(data, businessName);

        container.innerHTML = `
            <div class="business-results">
                <div class="business-header">
                    <div>
                        <h2>${businessName}</h2>
                        <p style="color:#666; margin-top:4px; font-size:0.85em">ID: <code>${businessId}</code></p>
                    </div>
                    <div style="text-align:right">
                        <div class="business-score ${scoreClass}">${score}/100</div>
                        <div style="font-size:1em; font-weight:700; color:${verdictColor}; margin-top:4px">${data.verdict}</div>
                        <p style="max-width:280px; margin-top:8px; color:#9b978f; font-size:0.85em; line-height:1.4">${assessmentText}</p>
                    </div>
                </div>

                <div class="business-stats">
                    <div class="business-stat"><h4>${data.total_reviews}</h4><p>Total Reviews</p></div>
                    <div class="business-stat"><h4>${data.avg_rating}</h4><p>Average Rating</p></div>
                    <div class="business-stat"><h4>${data.extreme_rating_percent}%</h4><p>Extreme Ratings</p></div>
                    <div class="business-stat"><h4>${data.max_reviews_in_one_day}</h4><p>Max in One Day</p></div>
                    <div class="business-stat"><h4>${data.near_duplicate_pairs?.length || 0}</h4><p>Near-Duplicate Pairs</p></div>
                    <div class="business-stat"><h4>${data.repeat_reviewer_count}</h4><p>Repeat Reviewers</p></div>
                    <div class="business-stat"><h4>+${data.points_earned_back || 0}</h4><p>Points Earned Back</p></div>
                </div>

                <div class="section-block">
                    <h4>Detection Flags</h4>
                    <div class="flags-list">${flagsHtml}</div>
                </div>

                <div class="section-block">
                    <h4>Reward Credits</h4>
                    <div class="flags-list">${rewardsHtml}</div>
                </div>

                <div class="section-block">
                    <h4>Rating Distribution</h4>
                    <div class="star-distribution">${starBars}</div>
                </div>

                ${dupHtml}
            </div>`;

        // FIX: scroll AFTER HTML is injected
        container.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Analysis error:', error);
        container.innerHTML = `
            <div class="business-results">
                <h3 style="color:#f0ece4; margin-bottom:8px">Error</h3>
                <p style="color:#666">Could not analyze business. Make sure the backend is running.</p>
            </div>`;
        container.scrollIntoView({ behavior: 'smooth' });
    } finally {
        // FIX: always re-enable the button when done
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze';
    }
}
