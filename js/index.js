fetch('data/reading.json')
    .then(response => response.json())
    .then(data => {
        if (!data.length) return;
        const nowReading = document.getElementById('now-reading');
        nowReading.textContent = data[0].title;
        nowReading.href = data[0].url;
        nowReading.target = '_blank';
    })
    .catch(() => {});

const fisherIcon = document.getElementById('fisher-icon');
if (fisherIcon) {
    const fisherImg = fisherIcon.querySelector('img');
    fisherIcon.addEventListener('mouseenter', () => {
        fisherIcon.classList.add('is-hovering');
        fisherImg.style.animation = 'none';
    });
    fisherIcon.addEventListener('mousemove', (e) => {
        const rect = fisherIcon.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        fisherImg.style.transform = `rotate(${(x * 14).toFixed(2)}deg) translate(${(x * 8).toFixed(1)}px, ${(y * 8 - 4).toFixed(1)}px) scale(1.12)`;
    });
    fisherIcon.addEventListener('mouseleave', () => {
        fisherIcon.classList.remove('is-hovering');
        fisherImg.style.transform = '';
        fisherImg.style.animation = '';
    });

    // Dragging repositions the outer icon (position: fixed, follows the pointer); the bob
    // animation and hover tilt above both stay entirely on the inner <img>, so it keeps
    // swinging no matter where the icon currently sits on screen.
    let dragging = false;
    let grabOffsetX = 0;
    let grabOffsetY = 0;

    fisherIcon.addEventListener('pointerdown', (e) => {
        const rect = fisherIcon.getBoundingClientRect();
        grabOffsetX = e.clientX - rect.left;
        grabOffsetY = e.clientY - rect.top;
        fisherIcon.style.position = 'fixed';
        fisherIcon.style.left = rect.left + 'px';
        fisherIcon.style.top = rect.top + 'px';
        fisherIcon.style.margin = '0';
        dragging = true;
        fisherIcon.classList.add('is-dragging');
        fisherIcon.setPointerCapture(e.pointerId);
        e.preventDefault();
    });

    fisherIcon.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        fisherIcon.style.left = (e.clientX - grabOffsetX) + 'px';
        fisherIcon.style.top = (e.clientY - grabOffsetY) + 'px';
    });

    fisherIcon.addEventListener('pointerup', () => {
        dragging = false;
        fisherIcon.classList.remove('is-dragging');
    });
}

document.querySelectorAll('.adapt-widget').forEach(initAdaptWidget);

function initAdaptWidget(widget) {
    const svg = widget.querySelector('.adapt-svg');
    if (!svg) return;

    const xs = [20, 125, 230, 335, 420];

    const landscapeOriginal = [
        [55, 88, 56, 92, 58],
        [92, 118, 88, 124, 94],
        [128, 145, 124, 148, 130]
    ];
    const landscapeReshaped = [
        [40, 72, 44, 106, 48],
        [82, 104, 78, 132, 84],
        [118, 134, 114, 156, 122]
    ];
    const baselineY = [100, 72, 118, 78, 106];

    function catmullRomPath(points) {
        if (points.length < 2) return '';
        let d = `M${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? i : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
            const c1x = p1.x + (p2.x - p0.x) / 6;
            const c1y = p1.y + (p2.y - p0.y) / 6;
            const c2x = p2.x - (p3.x - p1.x) / 6;
            const c2y = p2.y - (p3.y - p1.y) / 6;
            d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x},${p2.y}`;
        }
        return d;
    }

    function yArraysToPath(ys) {
        return catmullRomPath(xs.map((x, i) => ({ x, y: ys[i] })));
    }

    const landscapeEls = [1, 2, 3].map(n => widget.querySelector(`.adapt-landscape-${n}`));
    const baselineEl = widget.querySelector('.adapt-traj-baseline');
    baselineEl.setAttribute('d', yArraysToPath(baselineY));

    let currentLandscape = landscapeOriginal.map(arr => arr.slice());
    function renderLandscape(ysSet) {
        landscapeEls.forEach((el, i) => {
            el.setAttribute('d', yArraysToPath(ysSet[i]));
        });
    }
    renderLandscape(currentLandscape);

    let rafId = null;
    function tweenLandscapeTo(targetSet, duration) {
        if (rafId) cancelAnimationFrame(rafId);
        const startSet = currentLandscape.map(arr => arr.slice());
        const startTime = performance.now();

        function step(now) {
            const t = Math.min(1, (now - startTime) / duration);
            const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            const frameSet = startSet.map((arr, ci) =>
                arr.map((v, pi) => v + (targetSet[ci][pi] - v) * eased)
            );
            renderLandscape(frameSet);
            if (t < 1) {
                rafId = requestAnimationFrame(step);
            } else {
                currentLandscape = targetSet.map(arr => arr.slice());
            }
        }
        rafId = requestAnimationFrame(step);
    }

    const finetuneGroup = widget.querySelector('[data-mode-group="finetune"]');
    finetuneGroup.querySelector('.adapt-traj-main').setAttribute(
        'd', yArraysToPath([88, 58, 132, 66, 92])
    );

    const promptingGroup = widget.querySelector('[data-mode-group="prompting"]');
    const promptPoints = [
        { x: 70, y: 55 }, { x: 160, y: 95 }, { x: 230, y: 65 },
        { x: 335, y: 112 }, { x: 420, y: 80 }
    ];
    promptingGroup.querySelector('.adapt-traj-main').setAttribute('d', catmullRomPath(promptPoints));
    const promptDot = promptingGroup.querySelector('.adapt-dot-new');
    promptDot.setAttribute('cx', promptPoints[0].x);
    promptDot.setAttribute('cy', promptPoints[0].y);
    const promptLabel = promptingGroup.querySelector('.adapt-dot-label-new');
    promptLabel.setAttribute('x', promptPoints[0].x - 10);
    promptLabel.setAttribute('y', promptPoints[0].y - 10);

    const steeringGroup = widget.querySelector('[data-mode-group="steering"]');
    const steerPaths = steeringGroup.querySelectorAll('.adapt-traj-main');
    const prePoints = [{ x: 20, y: 100 }, { x: 125, y: 72 }, { x: 230, y: 118 }];
    const postPoints = [{ x: 255, y: 150 }, { x: 335, y: 165 }, { x: 420, y: 140 }];
    steerPaths[0].setAttribute('d', catmullRomPath(prePoints));
    steerPaths[1].setAttribute('d', catmullRomPath(postPoints));
    const vectorLine = steeringGroup.querySelector('.adapt-vector-line');
    vectorLine.setAttribute('x1', 230);
    vectorLine.setAttribute('y1', 118);
    vectorLine.setAttribute('x2', 255);
    vectorLine.setAttribute('y2', 150);
    const vectorLabel = steeringGroup.querySelector('.adapt-vector-label');
    vectorLabel.setAttribute('x', 258);
    vectorLabel.setAttribute('y', 140);

    const captions = {
        finetune: 'Fine-tuning reshapes the landscape itself: new weights carve new valleys, so the same input now ends up on a different path.',
        prompting: 'Prompting leaves the weights and the landscape untouched; it just changes where the trajectory starts.',
        steering: 'Steering leaves the landscape and the starting point untouched; it deflects the trajectory mid-flight by adding a vector to the activations.'
    };

    const captionEl = widget.querySelector('.adapt-caption');
    const buttons = widget.querySelectorAll('.adapt-mode-btn');
    const groups = widget.querySelectorAll('.adapt-mode-group');

    function setMode(mode) {
        buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
        groups.forEach(g => g.classList.toggle('active', g.dataset.modeGroup === mode));
        captionEl.textContent = captions[mode];
        tweenLandscapeTo(mode === 'finetune' ? landscapeReshaped : landscapeOriginal, 450);
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    setMode('finetune');
}

document.querySelectorAll('.widget-toolbar').forEach((toolbar) => {
    const btn = toolbar.querySelector('.widget-toggle-btn');
    const body = toolbar.nextElementSibling;
    if (!btn || !body) return;
    btn.addEventListener('click', () => {
        const hidden = body.classList.toggle('is-hidden');
        btn.textContent = hidden ? 'show' : 'hide';
    });
});

document.querySelectorAll('.lang-neurons-widget').forEach(initLangNeuronsWidget);

function initLangNeuronsWidget(widget) {
    const scatterLayer = widget.querySelector('.neurons-scatter');
    const colsLayer = widget.querySelector('.neurons-cols');
    if (!scatterLayer || !colsLayer) return;

    const LANGS = ['en', 'fr', 'es', 'it', 'pt', 'de', 'ru', 'ar', 'zh', 'vi', 'th'];
    const NAMES = {
        en: 'English', fr: 'French', es: 'Spanish', it: 'Italian', pt: 'Portuguese',
        de: 'German', ru: 'Russian', ar: 'Arabic', zh: 'Chinese', vi: 'Vietnamese', th: 'Thai'
    };

    function seededJitter(seed) {
        const x = Math.sin(seed * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }

    // Scatter plot (by layer): clustering gets deeper and tighter for non-Latin scripts.
    const LAYER_RANGE = {
        en: [8, 31], fr: [10, 31], es: [10, 31], it: [12, 31], pt: [12, 31],
        de: [14, 31], ru: [16, 31], ar: [18, 31], zh: [22, 31], vi: [20, 31], th: [24, 31]
    };
    const LAYER_COUNT = {
        en: 30, fr: 26, es: 26, it: 22, pt: 22, de: 24, ru: 26, ar: 24, zh: 20, vi: 18, th: 18
    };
    const xForLayer = (layer) => 20 + (layer / 31) * 400;

    const scatterDots = {};
    LANGS.forEach((code, i) => {
        const [layerMin, layerMax] = LAYER_RANGE[code];
        const count = LAYER_COUNT[code];
        const dots = [];
        for (let d = 0; d < count; d++) {
            const t = seededJitter(i * 5.1 + d * 1.7);
            const layer = layerMin + t * (layerMax - layerMin);
            const y = 15 + seededJitter(i * 9.3 + d * 2.3) * 110;
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', xForLayer(layer).toFixed(1));
            circle.setAttribute('cy', y.toFixed(1));
            circle.setAttribute('r', 3);
            circle.setAttribute('class', 'neuron-dot');
            scatterLayer.appendChild(circle);
            dots.push(circle);
        }
        scatterDots[code] = dots;
    });

    // Column plot (by language): used for the progressive-deactivation cascade.
    const colX = (i) => 25 + i * 39;

    const columns = {};
    LANGS.forEach((code, i) => {
        const dots = [];
        for (let d = 0; d < 9; d++) {
            const jitterX = (seededJitter(i * 5.1 + d * 1.7) - 0.5) * 20;
            const jitterY = 22 + seededJitter(i * 9.3 + d * 2.3) * 58;
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', (colX(i) + jitterX).toFixed(1));
            circle.setAttribute('cy', jitterY.toFixed(1));
            circle.setAttribute('r', 3);
            circle.setAttribute('class', 'neuron-dot');
            colsLayer.appendChild(circle);
            dots.push(circle);
        }
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', colX(i));
        label.setAttribute('y', 100);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('class', 'axis-ref-label neurons-col-label');
        label.textContent = code;
        colsLayer.appendChild(label);
        columns[code] = { dots, label };
    });

    const STAGES = [
        {
            deactivated: [],
            outputs: [{ code: 'en', pct: 100, tier: 'primary' }],
            caption: 'With every neuron active, the model defaults to English.'
        },
        {
            deactivated: ['en'],
            outputs: [
                { code: 'es', pct: 35, tier: 'primary' }, { code: 'fr', pct: 30, tier: 'primary' },
                { code: 'ru', pct: 20, tier: 'secondary' }, { code: 'en', pct: 15, tier: 'residual' }
            ],
            caption: "Deactivating English's neurons: the model falls back to Spanish, French, and Russian in most cases, though English still leaks through sometimes."
        },
        {
            deactivated: ['en', 'fr'],
            outputs: [
                { code: 'ru', pct: 55, tier: 'primary' }, { code: 'it', pct: 15, tier: 'secondary' },
                { code: 'es', pct: 15, tier: 'secondary' }, { code: 'ar', pct: 10, tier: 'secondary' },
                { code: 'en', pct: 5, tier: 'residual' }
            ],
            caption: 'Deactivating English and French too: responses shift primarily to Russian, with some Italian, Spanish, and Arabic.'
        },
        {
            deactivated: ['en', 'fr', 'es', 'it', 'pt'],
            outputs: [
                { code: 'ru', pct: 45, tier: 'primary' }, { code: 'ar', pct: 30, tier: 'secondary' },
                { code: 'zh', pct: 20, tier: 'secondary' }, { code: 'es', pct: 5, tier: 'residual' }
            ],
            caption: 'Removing the remaining Latin-script languages (Spanish, Italian, Portuguese) pushes generation toward Russian, Arabic, and Chinese.'
        },
        {
            deactivated: ['en', 'fr', 'es', 'it', 'pt', 'de', 'ru', 'ar'],
            outputs: [
                { code: 'th', pct: 35, tier: 'primary' }, { code: 'vi', pct: 35, tier: 'primary' },
                { code: 'zh', pct: 30, tier: 'secondary' }
            ],
            caption: 'Deactivating German, Russian, and Arabic on top empties the usual reservoir, so the model falls back to Thai, Vietnamese, and Chinese.'
        }
    ];

    let panel = 'activate';
    let stageIndex = 0;
    let forcedLang = 'th';

    function renderBars(outputs) {
        const container = widget.querySelector('.neurons-bars');
        container.innerHTML = '';
        outputs.forEach(({ code, pct, tier }) => {
            const row = document.createElement('div');
            row.className = 'feature-meter-label';
            const labelLine = document.createElement('div');
            labelLine.textContent = `${NAMES[code]}: ${pct}%`;
            row.appendChild(labelLine);
            const bar = document.createElement('div');
            bar.className = 'feature-meter-bar';
            const fill = document.createElement('div');
            fill.className = 'feature-meter-fill' + (tier === 'secondary' ? ' secondary' : tier === 'residual' ? ' residual' : '');
            fill.style.width = pct + '%';
            bar.appendChild(fill);
            row.appendChild(bar);
            container.appendChild(row);
        });
    }

    function render() {
        widget.querySelectorAll('.adapt-modes:not(.neurons-stage-row):not(.neurons-lang-row) .adapt-mode-btn').forEach((b) => {
            b.classList.toggle('active', b.dataset.panel === panel);
        });

        const isActivate = panel === 'activate';
        widget.querySelector('.neurons-svg-activate').style.display = isActivate ? 'block' : 'none';
        widget.querySelector('.neurons-svg-deactivate').style.display = isActivate ? 'none' : 'block';
        widget.querySelector('.neurons-lang-row').style.display = isActivate ? 'flex' : 'none';
        widget.querySelector('.neurons-stage-row').style.display = isActivate ? 'none' : 'flex';
        widget.querySelector('.neurons-footnote').style.display = isActivate ? 'none' : 'block';
        widget.querySelector('.neurons-output-label').textContent = 'model output distribution';

        if (isActivate) {
            widget.querySelectorAll('.neurons-lang-row .adapt-mode-btn').forEach((b) => {
                b.classList.toggle('active', b.dataset.forceLang === forcedLang);
            });

            LANGS.forEach((code) => {
                const isForced = code === forcedLang;
                scatterDots[code].forEach((dot) => {
                    dot.setAttribute('fill', isForced ? '#e07856' : '#ddd');
                    dot.setAttribute('fill-opacity', isForced ? '1' : '0.4');
                    dot.setAttribute('r', isForced ? 4 : 3);
                    dot.setAttribute('stroke', isForced ? '#a34d29' : 'none');
                    dot.setAttribute('stroke-width', isForced ? '1.2' : '0');
                    dot.style.cursor = 'pointer';
                });
            });

            renderBars([{ code: forcedLang, pct: 100, tier: 'primary' }]);
            widget.querySelector('.neurons-caption').textContent =
                `Click any cluster or language button. Boosting ${NAMES[forcedLang]}'s neurons alone is enough to force ${NAMES[forcedLang]} output, regardless of the input language.`;
        } else {
            const stage = STAGES[stageIndex];
            widget.querySelectorAll('.neurons-stage-row .adapt-mode-btn').forEach((b) => {
                b.classList.toggle('active', Number(b.dataset.stage) === stageIndex);
            });

            LANGS.forEach((code) => {
                const isOff = stage.deactivated.includes(code);
                columns[code].dots.forEach((dot) => {
                    dot.setAttribute('fill', isOff ? '#ccc' : '#007BFF');
                    dot.setAttribute('fill-opacity', isOff ? '0.45' : '0.9');
                    dot.setAttribute('stroke', 'none');
                });
                columns[code].label.style.fill = isOff ? '#ccc' : '#888';
            });

            renderBars(stage.outputs);
            widget.querySelector('.neurons-caption').textContent = stage.caption;
        }
    }

    widget.querySelectorAll('.adapt-modes:not(.neurons-stage-row):not(.neurons-lang-row) .adapt-mode-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            panel = btn.dataset.panel;
            render();
        });
    });

    widget.querySelectorAll('.neurons-stage-row .adapt-mode-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            stageIndex = Number(btn.dataset.stage);
            render();
        });
    });

    widget.querySelectorAll('.neurons-lang-row .adapt-mode-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            forcedLang = btn.dataset.forceLang;
            render();
        });
    });

    LANGS.forEach((code) => {
        scatterDots[code].forEach((dot) => {
            dot.addEventListener('click', () => {
                if (panel !== 'activate') return;
                forcedLang = code;
                render();
            });
        });
    });

    render();
}

document.querySelectorAll('.method-widget').forEach(initMethodWidget);

function initMethodWidget(widget) {
    const svg = widget.querySelector('.method-svg');
    if (!svg) return;

    const NS = 'http://www.w3.org/2000/svg';

    function el(tag, attrs) {
        const e = document.createElementNS(NS, tag);
        Object.keys(attrs).forEach((k) => e.setAttribute(k, attrs[k]));
        return e;
    }

    function text(attrs, content) {
        const e = el('text', attrs);
        e.textContent = content;
        return e;
    }

    // Marks a shape to "draw itself in" (stroke animates from hidden to visible) on activation.
    // Length is computed lazily (see ensureLen) since getTotalLength() needs the element to
    // already be attached to the document, which isn't true at the moment it's created here.
    function drawable(element) {
        element.classList.add('method-draw');
        return element;
    }

    function ensureLen(element) {
        if (element.dataset.len === undefined) {
            let len = 0;
            try {
                len = element.getTotalLength ? element.getTotalLength() : 0;
            } catch (err) {
                len = 0;
            }
            element.dataset.len = len;
            element.style.strokeDasharray = len;
        }
        return element.dataset.len;
    }

    // Marks a shape to "pop in" (scale + fade from zero) on activation, optionally staggered.
    function poppable(element, delayMs) {
        element.classList.add('method-pop');
        if (delayMs) element.style.transitionDelay = delayMs + 'ms';
        return element;
    }

    function seededJitter(seed) {
        const x = Math.sin(seed * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }

    function avg(pts) {
        const sum = pts.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
        return { x: sum.x / pts.length, y: sum.y / pts.length };
    }

    const scatterGroup = widget.querySelector('.method-scatter');

    function toSvgPoint(evt) {
        const pt = svg.createSVGPoint();
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        return pt.matrixTransform(svg.getScreenCTM().inverse());
    }

    function makeCluster(center, cls, seedBase, count) {
        const group = el('g', { class: 'method-cloud' });
        scatterGroup.appendChild(group);
        const pts = [];
        const dots = [];
        for (let i = 0; i < count; i++) {
            const angle = seededJitter(seedBase + i * 2.7) * Math.PI * 2;
            const radius = 10 + seededJitter(seedBase + i * 4.1) * 26;
            const x = center.x + Math.cos(angle) * radius;
            const y = center.y + Math.sin(angle) * radius * 0.7;
            const circle = el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 3.5, class: `method-scatter-dot ${cls}` });
            group.appendChild(circle);
            pts.push({ x, y });
            dots.push(circle);
        }
        return { pts, dots, group };
    }

    const orangeCenter = { x: 120, y: 143 };
    const blueCenter = { x: 282, y: 77 };
    const orangeCluster = makeCluster(orangeCenter, 'point-b', 3.3, 9);
    const blueCluster = makeCluster(blueCenter, 'point-a', 7.7, 9);
    const orangePts = orangeCluster.pts;
    const bluePts = blueCluster.pts;
    const orangeCentroid = avg(orangePts);
    const blueCentroid = avg(bluePts);

    const targetLabelDefaultY = blueCenter.y - 38;
    const targetLabelPromptingY = blueCenter.y - 33;
    const targetLabel = text({ x: blueCenter.x, y: targetLabelDefaultY, class: 'axis-ref-label', 'text-anchor': 'middle' }, 'target (fr)');
    blueCluster.group.appendChild(targetLabel);
    orangeCluster.group.appendChild(text({ x: orangeCenter.x, y: orangeCenter.y + 42, class: 'axis-ref-label', 'text-anchor': 'middle' }, 'other (en)'));

    const overlays = {};
    ['diffmean', 'probing', 'neurons', 'pca', 'lda', 'sae', 'prompting'].forEach((key) => {
        overlays[key] = widget.querySelector(`[data-overlay="${key}"]`);
    });

    // DiffMean: centroids of each language's activations, connected by a single vector.
    // Both clouds are draggable (while this panel is active); everything below tracks them live.
    const dmLine = el('line', {
        x1: orangeCentroid.x, y1: orangeCentroid.y, x2: blueCentroid.x, y2: blueCentroid.y,
        stroke: '#333', 'stroke-width': 2.2, 'marker-end': 'url(#method-arrow)'
    });
    overlays.diffmean.appendChild(poppable(dmLine));
    const dmOrangeCentroidDot = el('circle', { cx: orangeCentroid.x, cy: orangeCentroid.y, r: 6, fill: '#e07856', stroke: '#fefcf8', 'stroke-width': 1.5 });
    overlays.diffmean.appendChild(poppable(dmOrangeCentroidDot));
    const dmBlueCentroidDot = el('circle', { cx: blueCentroid.x, cy: blueCentroid.y, r: 6, fill: '#007BFF', stroke: '#fefcf8', 'stroke-width': 1.5 });
    overlays.diffmean.appendChild(poppable(dmBlueCentroidDot));
    const dmDeltaLabel = text({ x: 0, y: 0, class: 'method-label', 'text-anchor': 'middle' }, 'Δ');
    overlays.diffmean.appendChild(poppable(dmDeltaLabel, 300));

    // Applying Δ: a new test-time hidden state x gets pushed toward the target language by adding alpha * Δ.
    const dmTestPoint = { x: 60, y: 70 };
    overlays.diffmean.appendChild(poppable(el('circle', { cx: dmTestPoint.x, cy: dmTestPoint.y, r: 5, fill: '#666' }), 450));
    overlays.diffmean.appendChild(poppable(text({ x: dmTestPoint.x + 9, y: dmTestPoint.y + 4, class: 'method-label' }, 'x'), 500));
    const dmShiftedLine = el('line', {
        x1: dmTestPoint.x, y1: dmTestPoint.y, x2: dmTestPoint.x, y2: dmTestPoint.y,
        stroke: '#333', 'stroke-width': 1.8, 'stroke-dasharray': '4 3', 'marker-end': 'url(#method-arrow)'
    });
    overlays.diffmean.appendChild(poppable(dmShiftedLine, 550));
    const dmShiftedDot = el('circle', { cx: dmTestPoint.x, cy: dmTestPoint.y, r: 5, fill: '#007BFF', stroke: '#fefcf8', 'stroke-width': 1.5 });
    overlays.diffmean.appendChild(poppable(dmShiftedDot, 650));
    const dmShiftedLabel = text({ x: dmTestPoint.x + 9, y: dmTestPoint.y + 4, class: 'method-label' }, 'x + αΔ');
    overlays.diffmean.appendChild(poppable(dmShiftedLabel, 700));

    const orangeOffset = { x: 0, y: 0 };
    const blueOffset = { x: 0, y: 0 };

    function updateDiffmeanVisuals() {
        const liveOrange = { x: orangeCentroid.x + orangeOffset.x, y: orangeCentroid.y + orangeOffset.y };
        const liveBlue = { x: blueCentroid.x + blueOffset.x, y: blueCentroid.y + blueOffset.y };

        dmLine.setAttribute('x1', liveOrange.x);
        dmLine.setAttribute('y1', liveOrange.y);
        dmLine.setAttribute('x2', liveBlue.x);
        dmLine.setAttribute('y2', liveBlue.y);
        dmOrangeCentroidDot.setAttribute('cx', liveOrange.x);
        dmOrangeCentroidDot.setAttribute('cy', liveOrange.y);
        dmBlueCentroidDot.setAttribute('cx', liveBlue.x);
        dmBlueCentroidDot.setAttribute('cy', liveBlue.y);

        const mid = { x: (liveOrange.x + liveBlue.x) / 2, y: (liveOrange.y + liveBlue.y) / 2 };
        const dx = liveBlue.x - liveOrange.x;
        const dy = liveBlue.y - liveOrange.y;
        const len = Math.hypot(dx, dy) || 1;
        dmDeltaLabel.setAttribute('x', mid.x - (dy / len) * 14);
        dmDeltaLabel.setAttribute('y', mid.y + (dx / len) * 14);

        const shifted = { x: dmTestPoint.x + dx * 0.55, y: dmTestPoint.y + dy * 0.55 };
        dmShiftedLine.setAttribute('x2', shifted.x);
        dmShiftedLine.setAttribute('y2', shifted.y);
        dmShiftedDot.setAttribute('cx', shifted.x);
        dmShiftedDot.setAttribute('cy', shifted.y);
        dmShiftedLabel.setAttribute('x', shifted.x + 9);
        dmShiftedLabel.setAttribute('y', shifted.y + 4);
    }

    function makeCloudDraggable(cluster, offset) {
        const group = cluster.group;
        let dragging = false;
        let startPoint = null;
        let startOffset = null;

        group.addEventListener('pointerdown', (e) => {
            if (activeMethod !== 'diffmean') return;
            dragging = true;
            startPoint = toSvgPoint(e);
            startOffset = { x: offset.x, y: offset.y };
            group.setPointerCapture(e.pointerId);
            group.style.cursor = 'grabbing';
            e.preventDefault();
        });

        group.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const p = toSvgPoint(e);
            offset.x = startOffset.x + (p.x - startPoint.x);
            offset.y = startOffset.y + (p.y - startPoint.y);
            group.setAttribute('transform', `translate(${offset.x},${offset.y})`);
            updateDiffmeanVisuals();
        });

        group.addEventListener('pointerup', () => {
            dragging = false;
            if (activeMethod === 'diffmean') group.style.cursor = 'grab';
        });
    }

    makeCloudDraggable(orangeCluster, orangeOffset);
    makeCloudDraggable(blueCluster, blueOffset);
    updateDiffmeanVisuals();

    // Probing: a decision boundary plus its normal (weight) vector.
    overlays.probing.appendChild(drawable(el('line', { x1: 40, y1: 185, x2: 360, y2: 35, stroke: '#333', 'stroke-width': 1.5, 'stroke-dasharray': '5 3' })));
    overlays.probing.appendChild(text({ x: 44, y: 90, class: 'axis-ref-label' }, 'decision boundary'));
    overlays.probing.appendChild(poppable(el('line', { x1: 200, y1: 110, x2: 235, y2: 85, stroke: '#333', 'stroke-width': 2.2, 'marker-end': 'url(#method-arrow)' }), 350));
    overlays.probing.appendChild(poppable(text({ x: 242, y: 82, class: 'method-label' }, 'w'), 450));

    // Neurons: fixed coordinate axes, two of them selected directly, with an activation marker on each.
    const neuronXs = [60, 110, 160, 210, 260, 310, 360];
    neuronXs.forEach((x, i) => {
        const strong = i === 2 || i === 5;
        overlays.neurons.appendChild(drawable(el('line', {
            x1: x, y1: 35, x2: x, y2: 175,
            stroke: strong ? '#007BFF' : '#ddd', 'stroke-width': strong ? 2.5 : 1.3
        })));
    });
    overlays.neurons.appendChild(poppable(el('circle', { cx: neuronXs[2], cy: 95, r: 5, fill: '#007BFF' }), 450));
    overlays.neurons.appendChild(poppable(el('circle', { cx: neuronXs[5], cy: 130, r: 5, fill: '#007BFF' }), 500));
    overlays.neurons.appendChild(text({ x: neuronXs[2], y: 191, class: 'axis-ref-label', 'text-anchor': 'middle' }, 'neuron 512'));
    overlays.neurons.appendChild(text({ x: neuronXs[5], y: 191, class: 'axis-ref-label', 'text-anchor': 'middle' }, 'neuron 1893'));

    // PCA: fit per language on its own activations. h is projected onto the top-k variance
    // subspace (dropping whatever falls outside it) to reconstruct u; steering then pushes h
    // further in that same in-subspace direction, scaled by alpha, landing on delta.
    const pcaAngle = -20 * (Math.PI / 180);
    const dirMajor = { x: Math.cos(pcaAngle), y: Math.sin(pcaAngle) };
    const dirMinor = { x: -Math.sin(pcaAngle), y: Math.cos(pcaAngle) };
    overlays.pca.appendChild(text({ x: blueCentroid.x, y: 18, class: 'axis-ref-label', 'text-anchor': 'middle' }, 'top-20 PCs, fit on fr only'));
    overlays.pca.appendChild(drawable(el('ellipse', {
        cx: blueCentroid.x, cy: blueCentroid.y, rx: 50, ry: 30,
        transform: `rotate(${pcaAngle * 180 / Math.PI} ${blueCentroid.x} ${blueCentroid.y})`,
        fill: 'none', stroke: '#007BFF', 'stroke-width': 1.3, 'stroke-dasharray': '4 3'
    })));
    overlays.pca.appendChild(drawable(el('line', {
        x1: blueCentroid.x - dirMajor.x * 50, y1: blueCentroid.y - dirMajor.y * 50,
        x2: blueCentroid.x + dirMajor.x * 50, y2: blueCentroid.y + dirMajor.y * 50,
        stroke: '#bbb', 'stroke-width': 1.3
    })));
    overlays.pca.appendChild(drawable(el('line', {
        x1: blueCentroid.x - dirMinor.x * 18, y1: blueCentroid.y - dirMinor.y * 18,
        x2: blueCentroid.x + dirMinor.x * 18, y2: blueCentroid.y + dirMinor.y * 18,
        stroke: '#bbb', 'stroke-width': 1.3
    })));

    // h: an example hidden state sitting outside the fitted subspace.
    const hPoint = {
        x: blueCentroid.x + dirMinor.x * 58 + dirMajor.x * 40,
        y: blueCentroid.y + dirMinor.y * 58 + dirMajor.y * 40
    };
    // proj: h with its off-subspace component dropped (the foot of the perpendicular onto the major axis).
    const projPoint = { x: blueCentroid.x + dirMajor.x * 40, y: blueCentroid.y + dirMajor.y * 40 };
    overlays.pca.appendChild(poppable(el('circle', { cx: hPoint.x, cy: hPoint.y, r: 5, fill: '#333' }), 150));
    overlays.pca.appendChild(poppable(text({ x: hPoint.x + 8, y: hPoint.y + 4, class: 'method-label' }, 'h'), 200));
    overlays.pca.appendChild(drawable(el('line', {
        x1: hPoint.x, y1: hPoint.y, x2: projPoint.x, y2: projPoint.y,
        stroke: '#999', 'stroke-width': 1.3, 'stroke-dasharray': '3 2'
    })));
    overlays.pca.appendChild(poppable(el('circle', { cx: projPoint.x, cy: projPoint.y, r: 4, fill: '#007BFF' }), 300));
    overlays.pca.appendChild(poppable(text({ x: projPoint.x - 8, y: projPoint.y - 8, class: 'method-label', 'text-anchor': 'end' }, 'u'), 400));

    // Steering: h moves further along that same in-subspace direction, scaled by alpha, to land on delta.
    const pcaDeltaPoint = { x: hPoint.x + dirMajor.x * 38, y: hPoint.y + dirMajor.y * 38 };
    overlays.pca.appendChild(poppable(el('line', {
        x1: hPoint.x, y1: hPoint.y, x2: pcaDeltaPoint.x, y2: pcaDeltaPoint.y,
        stroke: '#333', 'stroke-width': 2.2, 'marker-end': 'url(#method-arrow)'
    }), 450));
    overlays.pca.appendChild(poppable(el('circle', { cx: pcaDeltaPoint.x, cy: pcaDeltaPoint.y, r: 5, fill: '#333' }), 550));
    overlays.pca.appendChild(poppable(text({ x: pcaDeltaPoint.x + 8, y: pcaDeltaPoint.y + 4, class: 'method-label' }, 'δ'), 600));

    // LDA: within-class spread shown explicitly, direction adjusted for it.
    overlays.lda.appendChild(drawable(el('ellipse', { cx: orangeCentroid.x, cy: orangeCentroid.y, rx: 36, ry: 24, fill: 'none', stroke: '#e07856', 'stroke-width': 1.3, 'stroke-dasharray': '3 2' })));
    overlays.lda.appendChild(drawable(el('ellipse', { cx: blueCentroid.x, cy: blueCentroid.y, rx: 36, ry: 24, fill: 'none', stroke: '#007BFF', 'stroke-width': 1.3, 'stroke-dasharray': '3 2' })));
    overlays.lda.appendChild(text({ x: orangeCentroid.x, y: orangeCentroid.y - 36, class: 'axis-ref-label', 'text-anchor': 'middle' }, 'within-class spread'));
    overlays.lda.appendChild(poppable(el('line', {
        x1: orangeCentroid.x, y1: orangeCentroid.y, x2: blueCentroid.x, y2: blueCentroid.y,
        stroke: '#0059b3', 'stroke-width': 2.2, 'marker-end': 'url(#method-arrow)'
    }), 400));
    const ldaMid = { x: (orangeCentroid.x + blueCentroid.x) / 2, y: (orangeCentroid.y + blueCentroid.y) / 2 };
    const ldaDx = blueCentroid.x - orangeCentroid.x;
    const ldaDy = blueCentroid.y - orangeCentroid.y;
    const ldaLen = Math.hypot(ldaDx, ldaDy) || 1;
    overlays.lda.appendChild(poppable(text({
        x: ldaMid.x - (ldaDy / ldaLen) * 14, y: ldaMid.y + (ldaDx / ldaLen) * 14, class: 'method-label', 'text-anchor': 'middle'
    }, 'v'), 500));

    // SAE: a sparse dictionary of features, steering along the one active feature.
    const dictCount = 9;
    const activeIdx = 5;
    for (let i = 0; i < dictCount; i++) {
        const x = 50 + i * 34;
        overlays.sae.appendChild(poppable(el('rect', {
            x, y: 100, width: 20, height: 20, rx: 3,
            fill: i === activeIdx ? '#e07856' : '#eee',
            stroke: i === activeIdx ? '#a34d29' : '#ccc'
        }), i * 35));
    }
    overlays.sae.appendChild(poppable(el('circle', { cx: 20, cy: 110, r: 7, fill: '#333' })));
    overlays.sae.appendChild(text({ x: 38, y: 132, class: 'axis-ref-label', 'text-anchor': 'middle' }, 'activation'));
    overlays.sae.appendChild(poppable(el('line', { x1: 27, y1: 110, x2: 48, y2: 110, stroke: '#333', 'stroke-width': 1.8, 'marker-end': 'url(#method-arrow)' }), 150));
    const saeFeatureX = 50 + activeIdx * 34 + 10;
    overlays.sae.appendChild(poppable(el('line', { x1: saeFeatureX, y1: 100, x2: saeFeatureX, y2: 55, stroke: '#a34d29', 'stroke-width': 1.8, 'marker-end': 'url(#method-arrow)' }), 500));
    overlays.sae.appendChild(text({ x: saeFeatureX, y: 47, class: 'axis-ref-label', 'text-anchor': 'middle' }, 'language feature'));

    // Prompting: an instruction appended to the input; nothing internal changes.
    overlays.prompting.appendChild(poppable(el('rect', { x: 130, y: 8, width: 150, height: 26, rx: 8, fill: '#fefcf8', stroke: '#999', 'stroke-width': 1.3 })));
    overlays.prompting.appendChild(text({ x: 205, y: 25, class: 'axis-ref-label', 'text-anchor': 'middle' }, '"answer in French:"'));
    overlays.prompting.appendChild(poppable(el('line', { x1: 205, y1: 34, x2: 205, y2: 52, stroke: '#999', 'stroke-width': 1.5, 'stroke-dasharray': '3 2', 'marker-end': 'url(#method-arrow)' }), 300));

    const SHOW_SCATTER = ['diffmean', 'probing', 'pca', 'lda', 'prompting'];

    const METHODS = {
        diffmean: {
            scores: { control: 92, semantic: 88 },
            caption: 'Residual-stream DiffMean: subtract the mean activation of other-language examples from the mean activation of target-language examples. The simplest method tested, and the one that wins consistently across languages.'
        },
        probing: {
            scores: { control: 65, semantic: 75 },
            caption: 'Probe-derived direction: train a linear classifier to separate target-language activations from the rest, then steer along its weight vector, perpendicular to the decision boundary.'
        },
        neurons: {
            scores: { control: 82, semantic: 84 },
            caption: 'Language-specific neurons: instead of a new direction, pick individual neuron coordinates that fire differentially for the target language and boost them directly. The second-best method tested.'
        },
        pca: {
            scores: { control: 55, semantic: 74 },
            caption: 'PCA subspace: fit per language on that language’s own activations, keeping the top k = 20 directions of highest variance. Projecting h onto this subspace and dropping what falls outside it gives u; steering then pushes h further in that same direction, scaled by alpha, landing on delta = h + alpha times u over its norm.'
        },
        lda: {
            scores: { control: 58, semantic: 72 },
            caption: 'LDA vector: like probing, but explicitly maximizes separation between languages relative to the spread within each language.'
        },
        sae: {
            scores: { control: 60, semantic: 78 },
            caption: 'Sparse Autoencoder: decompose the activation into an overcomplete dictionary of sparse features, then steer along whichever learned feature tracks the target language.'
        },
        prompting: {
            scores: { control: 60, semantic: 90 },
            caption: "Prompting baseline: simply prepend an instruction like 'answer in French' to the input."
        }
    };

    function renderBars(scores) {
        const container = widget.querySelector('.method-bars');
        container.innerHTML = '';
        [['language control', scores.control], ['semantic relevance', scores.semantic]].forEach(([label, pct]) => {
            const row = document.createElement('div');
            row.className = 'feature-meter-label';
            const labelLine = document.createElement('div');
            labelLine.textContent = `${label}: ${pct}`;
            row.appendChild(labelLine);
            const bar = document.createElement('div');
            bar.className = 'feature-meter-bar';
            const fill = document.createElement('div');
            fill.className = 'feature-meter-fill';
            fill.style.width = pct + '%';
            bar.appendChild(fill);
            row.appendChild(bar);
            container.appendChild(row);
        });
    }

    function resetAnimations(group) {
        group.querySelectorAll('.method-draw').forEach((e) => {
            e.style.strokeDashoffset = ensureLen(e);
        });
        group.querySelectorAll('.method-pop').forEach((e) => {
            e.classList.remove('is-in');
        });
    }

    function playAnimations(group) {
        requestAnimationFrame(() => {
            group.querySelectorAll('.method-draw').forEach((e) => {
                e.style.strokeDashoffset = 0;
            });
            group.querySelectorAll('.method-pop').forEach((e) => {
                e.classList.add('is-in');
            });
        });
    }

    let activeMethod = null;
    let scatterWasShown = false;

    function render(method) {
        widget.querySelectorAll('.method-btn').forEach((b) => {
            b.classList.toggle('active', b.dataset.method === method);
        });

        const showScatter = SHOW_SCATTER.includes(method);
        scatterGroup.classList.toggle('active', showScatter);

        if (activeMethod && overlays[activeMethod]) {
            resetAnimations(overlays[activeMethod]);
        }
        Object.keys(overlays).forEach((key) => {
            overlays[key].classList.toggle('active', key === method);
        });
        if (orangeCluster && blueCluster) {
            const dimOrange = method === 'pca';
            orangeCluster.dots.forEach((d) => { d.style.opacity = dimOrange ? '0.25' : ''; });
            const cloudCursor = method === 'diffmean' ? 'grab' : 'default';
            orangeCluster.group.style.cursor = cloudCursor;
            blueCluster.group.style.cursor = cloudCursor;
        }
        targetLabel.setAttribute('y', method === 'prompting' ? targetLabelPromptingY : targetLabelDefaultY);
        playAnimations(overlays[method]);
        if (showScatter && !scatterWasShown) {
            resetAnimations(scatterGroup);
            playAnimations(scatterGroup);
        }
        scatterWasShown = showScatter;
        activeMethod = method;

        const data = METHODS[method];
        widget.querySelector('.method-caption').textContent = data.caption;
        renderBars(data.scores);

        const combined = (2 * data.scores.control * data.scores.semantic) / (data.scores.control + data.scores.semantic);
        const readout = widget.querySelector('.method-readout');
        readout.textContent = `steering score (harmonic mean): ${combined.toFixed(0)}`;
        readout.className = 'separation-readout method-readout' + (combined >= 85 ? ' good' : combined <= 65 ? ' bad' : '');
    }

    widget.querySelectorAll('.method-btn').forEach((btn) => {
        btn.addEventListener('click', () => render(btn.dataset.method));
    });

    render('diffmean');
}

document.querySelectorAll('.script-widget').forEach(initScriptWidget);

function initScriptWidget(widget) {
    const svg = widget.querySelector('.script-heads-svg');
    if (!svg) return;

    const NS = 'http://www.w3.org/2000/svg';

    function el(tag, attrs) {
        const e = document.createElementNS(NS, tag);
        Object.keys(attrs).forEach((k) => e.setAttribute(k, attrs[k]));
        return e;
    }

    const captionEl = widget.querySelector('.script-caption');

    // All four words mean "water" in their own language, each with a native script and a
    // Latin romanization, so steering/patching has something concrete and simple to flip.
    const LANGUAGES = {
        hindi: { name: 'Hindi', native: 'पानी', latin: 'paani', nativeName: 'Devanagari', group: 'identified' },
        arabic: { name: 'Arabic', native: 'ماء', latin: 'maa', nativeName: 'Arabic script', group: 'identified' },
        russian: { name: 'Russian', native: 'вода', latin: 'voda', nativeName: 'Cyrillic', group: 'transfer' },
        japanese: { name: 'Japanese', native: '水', latin: 'mizu', nativeName: 'Kanji', group: 'transfer' }
    };

    function swapWord(wordEl, nameEl, word, name) {
        wordEl.classList.add('is-swapping');
        setTimeout(() => {
            wordEl.textContent = word;
            nameEl.textContent = name;
            wordEl.classList.remove('is-swapping');
        }, 180);
    }

    // --- Panel: steering vector (Hindi and Arabic only) ---
    const vectorWordEl = widget.querySelector('.script-word-vector');
    const vectorNameEl = widget.querySelector('.script-name-vector');
    const vectorState = { hindi: false, arabic: false };
    let vectorLang = 'hindi';

    function vectorCaption() {
        const lang = LANGUAGES[vectorLang];
        if (!vectorState[vectorLang]) {
            return `This is the word for "water" in ${lang.name}, written in ${lang.nativeName}. A script vector added to the activations flips it to Latin while keeping the meaning.`;
        }
        return `Steered to Latin. Steer again to flip ${lang.name} back to ${lang.nativeName}.`;
    }

    function renderVector() {
        const lang = LANGUAGES[vectorLang];
        const isLatin = vectorState[vectorLang];
        swapWord(vectorWordEl, vectorNameEl, isLatin ? lang.latin : lang.native, isLatin ? 'Latin' : lang.nativeName);
        captionEl.textContent = vectorCaption();
    }

    widget.querySelectorAll('[data-vector-lang]').forEach((btn) => {
        btn.addEventListener('click', () => {
            vectorLang = btn.dataset.vectorLang;
            widget.querySelectorAll('[data-vector-lang]').forEach((b) => b.classList.toggle('active', b === btn));
            renderVector();
        });
    });

    widget.querySelector('[data-vector-toggle]').addEventListener('click', () => {
        vectorState[vectorLang] = !vectorState[vectorLang];
        renderVector();
    });

    // --- Panel: attention heads (identified on Hindi/Arabic, transfers to Russian/Japanese) ---
    const gridLayer = widget.querySelector('.script-heads-grid');
    const ROWS = 6;
    const COLS = 8;
    const cellW = 32;
    const cellH = 14;
    const gapX = 13;
    const gapY = 10;
    const startX = 20;
    const startY = 30;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const isGate = (r === 0 && c === 6) || (r === 1 && c === 7) || (r === 2 && c === 6) || (r === 4 && c === 7) || (r === 5 && c === 5);
            gridLayer.appendChild(el('rect', {
                x: startX + c * (cellW + gapX), y: startY + r * (cellH + gapY),
                width: cellW, height: cellH, rx: 3, class: 'script-head-cell',
                fill: isGate ? '#007BFF' : '#eee', 'fill-opacity': isGate ? '0.95' : '1'
            }));
        }
    }

    const headsWordEl = widget.querySelector('.script-word-heads');
    const headsNameEl = widget.querySelector('.script-name-heads');
    const headsState = { hindi: false, arabic: false, russian: false, japanese: false };
    let headsLang = 'hindi';

    function headsCaption() {
        const lang = LANGUAGES[headsLang];
        const scriptNow = headsState[headsLang] ? 'Latin' : lang.nativeName;
        const transferNote = lang.group === 'transfer'
            ? `These five heads were identified on Hindi and Arabic, and transfer cleanly to ${lang.name} too.`
            : 'Five late-layer heads causally gate this flip.';
        return `${transferNote} ${lang.name} is currently shown in ${scriptNow}; patch the heads to flip it.`;
    }

    function renderHeads() {
        const lang = LANGUAGES[headsLang];
        const isLatin = headsState[headsLang];
        swapWord(headsWordEl, headsNameEl, isLatin ? lang.latin : lang.native, isLatin ? 'Latin' : lang.nativeName);
        captionEl.textContent = headsCaption();
    }

    widget.querySelectorAll('[data-heads-lang]').forEach((btn) => {
        btn.addEventListener('click', () => {
            headsLang = btn.dataset.headsLang;
            widget.querySelectorAll('[data-heads-lang]').forEach((b) => b.classList.toggle('active', b === btn));
            renderHeads();
        });
    });

    widget.querySelector('[data-heads-toggle]').addEventListener('click', () => {
        headsState[headsLang] = !headsState[headsLang];
        renderHeads();
    });

    // --- Top-level panel toggle ---
    const vectorPanel = widget.querySelector('.script-panel-vector');
    const headsPanel = widget.querySelector('.script-panel-heads');
    vectorPanel.classList.add('active');
    renderHeads();
    renderVector();

    widget.querySelectorAll('[data-panel]').forEach((btn) => {
        btn.addEventListener('click', () => {
            widget.querySelectorAll('[data-panel]').forEach((b) => b.classList.toggle('active', b === btn));
            const showVector = btn.dataset.panel === 'vector';
            vectorPanel.classList.toggle('active', showVector);
            headsPanel.classList.toggle('active', !showVector);
            captionEl.textContent = showVector ? vectorCaption() : headsCaption();
        });
    });
}

document.querySelectorAll('.compose-widget').forEach(initComposeWidget);

function initComposeWidget(widget) {
    const svg = widget.querySelector('.compose-svg');
    if (!svg) return;

    const NS = 'http://www.w3.org/2000/svg';

    function el(tag, attrs) {
        const e = document.createElementNS(NS, tag);
        Object.keys(attrs).forEach((k) => e.setAttribute(k, attrs[k]));
        return e;
    }

    function text(attrs, content) {
        const e = el('text', attrs);
        e.textContent = content;
        return e;
    }

    const LINE_Y = 110;
    const MIN_LEN = 14;
    const MAX_LEN = 62;

    // Injected early -> mid -> late, matching the depth order used in the paper's composition experiment.
    const ATTRS = {
        language: { x: 100, color: '#007BFF', layer: 6, name: 'language' },
        jailbreak: { x: 220, color: '#e07856', layer: 16, name: 'jailbreak' },
        conciseness: { x: 340, color: '#1a8a4a', layer: 24, name: 'conciseness' }
    };

    const strengths = { language: 70, jailbreak: 55, conciseness: 40 };
    const parts = {};

    Object.keys(ATTRS).forEach((key) => {
        const cfg = ATTRS[key];
        const group = widget.querySelector(`.compose-inject[data-attr="${key}"]`);
        if (!group) return;

        const arrow = el('line', {
            x1: cfg.x, y1: LINE_Y - MIN_LEN, x2: cfg.x, y2: LINE_Y,
            stroke: cfg.color, 'stroke-width': 2.4, 'stroke-linecap': 'round'
        });
        group.appendChild(arrow);
        group.appendChild(el('circle', {
            cx: cfg.x, cy: LINE_Y, r: 4, fill: cfg.color, stroke: '#fefcf8', 'stroke-width': 1.2
        }));

        const label = text({ x: cfg.x, y: LINE_Y - MIN_LEN - 8, 'text-anchor': 'middle', class: 'method-label' }, '');
        label.style.fill = cfg.color;
        group.appendChild(label);

        group.appendChild(text({
            x: cfg.x, y: LINE_Y + 20, 'text-anchor': 'middle', class: 'axis-ref-label'
        }, `layer ${cfg.layer}`));

        parts[key] = { arrow, label };
    });

    // Same prompt ("How do I pick a lock?"), eight ways to answer it, one per corner of the
    // language x jailbreak x conciseness cube, so the composed vectors have an actual example to move between.
    const RESPONSES = {
        en: {
            refuse: {
                verbose: "I'm sorry, but I can't help with that. Explaining how to bypass a lock could enable unauthorized entry, so I have to decline this request.",
                concise: "Sorry, I can't help with that."
            },
            comply: {
                verbose: "Sure, here's a general overview: insert a tension wrench into the bottom of the keyway and apply light rotational pressure, then use a pick to feel for and set each pin along the pin stack until the cylinder turns freely.",
                concise: 'Apply light pressure with a tension wrench, then pick each pin until it turns.'
            }
        },
        de: {
            refuse: {
                verbose: 'Es tut mir leid, aber dabei kann ich nicht helfen. Eine Erklärung, wie man ein Schloss umgeht, könnte unbefugten Zugang ermöglichen, daher muss ich diese Anfrage ablehnen.',
                concise: 'Entschuldigung, dabei kann ich nicht helfen.'
            },
            comply: {
                verbose: 'Klar, hier ein grober Überblick: Spannschlüssel unten ins Schlüsselloch einführen und leichten Druck ausüben, dann mit einem Pick jeden Stift einzeln ertasten und setzen, bis sich der Zylinder frei dreht.',
                concise: 'Mit einem Spannschlüssel leichten Druck ausüben, dann jeden Stift einzeln knacken.'
            }
        }
    };

    function describe() {
        const lang = strengths.language >= 50 ? 'de' : 'en';
        const jail = strengths.jailbreak >= 50 ? 'comply' : 'refuse';
        const conc = strengths.conciseness >= 50 ? 'concise' : 'verbose';
        return RESPONSES[lang][jail][conc];
    }

    function render() {
        Object.keys(ATTRS).forEach((key) => {
            const cfg = ATTRS[key];
            const { arrow, label } = parts[key];
            const len = MIN_LEN + (strengths[key] / 100) * (MAX_LEN - MIN_LEN);
            arrow.setAttribute('y1', LINE_Y - len);
            label.setAttribute('y', LINE_Y - len - 8);
            label.textContent = `${cfg.name} ${strengths[key]}%`;
            const valueEl = widget.querySelector(`[data-attr-value="${key}"]`);
            if (valueEl) valueEl.textContent = strengths[key] + '%';
        });
        widget.querySelector('.compose-output').textContent = describe();
    }

    widget.querySelectorAll('.compose-slider').forEach((slider) => {
        slider.addEventListener('input', () => {
            const key = slider.dataset.attrSlider;
            strengths[key] = parseInt(slider.value, 10);
            render();
        });
    });

    widget.querySelector('.compose-caption').textContent =
        'Each vector is injected at a different point along the depth of the network: language identity early, jailbreak behavior mid-network, conciseness later still. As long as the vectors stay sufficiently orthogonal, their effects combine additively into one generation steered along all three dimensions at once.';

    render();
}

document.querySelectorAll('.subnet-widget').forEach(initSubnetWidget);

function initSubnetWidget(widget) {
    const svg = widget.querySelector('.subnet-svg');
    if (!svg) return;

    const NS = 'http://www.w3.org/2000/svg';

    function el(tag, attrs) {
        const e = document.createElementNS(NS, tag);
        Object.keys(attrs).forEach((k) => e.setAttribute(k, attrs[k]));
        return e;
    }

    const edgesLayer = widget.querySelector('.subnet-edges');
    const nodesLayer = widget.querySelector('.subnet-nodes');

    function seededJitter(seed) {
        const x = Math.sin(seed * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }

    // Four abstract layers, deliberately denser than one real FFN slice would be, so the
    // sparse highlighted pathway has an actual dense network to stand out against.
    const COL_X = [25, 145, 255, 375];
    const COL_SIZES = [7, 13, 13, 7];
    const Y_TOP = 26;
    const Y_BOTTOM = 182;

    function columnYs(count, seedBase) {
        const span = Y_BOTTOM - Y_TOP;
        const ys = [];
        for (let i = 0; i < count; i++) {
            const base = Y_TOP + (span * i) / (count - 1);
            const jitter = (seededJitter(seedBase + i * 3.7) - 0.5) * (span / count) * 0.5;
            ys.push(base + jitter);
        }
        return ys;
    }

    const colYs = [
        columnYs(COL_SIZES[0], 1.1),
        columnYs(COL_SIZES[1], 4.4),
        columnYs(COL_SIZES[2], 8.8),
        columnYs(COL_SIZES[3], 13.3)
    ];

    // The two middle layers each carry a couple of LAPE-identified language neurons;
    // together they form the sparse pathway that gets fine-tuned.
    const LANG_IDX_COL2 = [2, 8];
    const LANG_IDX_COL3 = [4, 10];

    function pickTargets(count, total, seedBase) {
        const picked = new Set();
        let i = 0;
        while (picked.size < count) {
            picked.add(Math.floor(seededJitter(seedBase + i * 5.3) * total));
            i++;
        }
        return Array.from(picked);
    }

    function edge(x1, y1, x2, y2) {
        return el('line', { x1, y1, x2, y2, class: 'subnet-edge' });
    }

    // Sparse pathway: every col-1 node feeds the language neurons in col 2, those connect
    // to the language neurons in col 3, which fan out to every col-4 node.
    const sparseEdges = [];
    colYs[0].forEach((y1) => {
        LANG_IDX_COL2.forEach((ni) => sparseEdges.push(edge(COL_X[0], y1, COL_X[1], colYs[1][ni])));
    });
    LANG_IDX_COL2.forEach((ai) => {
        LANG_IDX_COL3.forEach((bi) => sparseEdges.push(edge(COL_X[1], colYs[1][ai], COL_X[2], colYs[2][bi])));
    });
    LANG_IDX_COL3.forEach((ni) => {
        colYs[3].forEach((y2) => sparseEdges.push(edge(COL_X[2], colYs[2][ni], COL_X[3], y2)));
    });
    sparseEdges.forEach((e) => edgesLayer.appendChild(e));

    // Dense background: everything else, a handful of pseudo-random connections per node
    // per hop, standing in for the much larger set of weights nothing in particular touches.
    const bgEdges = [];
    colYs[0].forEach((y1, i) => {
        pickTargets(3, COL_SIZES[1], i * 1.7 + 20).forEach((ti) => {
            bgEdges.push(edge(COL_X[0], y1, COL_X[1], colYs[1][ti]));
        });
    });
    colYs[1].forEach((y1, i) => {
        if (LANG_IDX_COL2.includes(i)) return;
        pickTargets(2, COL_SIZES[2], i * 2.3 + 40).forEach((ti) => {
            bgEdges.push(edge(COL_X[1], y1, COL_X[2], colYs[2][ti]));
        });
    });
    colYs[2].forEach((y1, i) => {
        if (LANG_IDX_COL3.includes(i)) return;
        pickTargets(3, COL_SIZES[3], i * 1.9 + 60).forEach((ti) => {
            bgEdges.push(edge(COL_X[2], y1, COL_X[3], colYs[3][ti]));
        });
    });
    bgEdges.forEach((e) => edgesLayer.appendChild(e));

    function makeNode(x, y, r) {
        const n = el('circle', { cx: x, cy: y, r, class: 'subnet-node' });
        nodesLayer.appendChild(n);
        return n;
    }

    colYs[0].forEach((y) => makeNode(COL_X[0], y, 4));
    colYs[3].forEach((y) => makeNode(COL_X[3], y, 4));
    const col2Nodes = colYs[1].map((y, i) => makeNode(COL_X[1], y, LANG_IDX_COL2.includes(i) ? 5.5 : 3.5));
    const col3Nodes = colYs[2].map((y, i) => makeNode(COL_X[2], y, LANG_IDX_COL3.includes(i) ? 5.5 : 3.5));
    const neuronNodes = col2Nodes.concat(col3Nodes);
    const LANG_NEURON_IDX = LANG_IDX_COL2.concat(LANG_IDX_COL3.map((i) => i + col2Nodes.length));

    const STATES = {
        baseline: {
            label: 'before fine-tuning',
            params: '0% of parameters updated',
            paramsClass: '',
            scores: { lang: 42, general: 94 },
            caption: 'LAPE has already flagged three neurons (ringed) as language-associated, but no weights have been touched yet. The target language starts weak; general knowledge is fully intact.'
        },
        ours: {
            label: 'sparse subnetwork (ours)',
            params: '0.6% of parameters updated',
            paramsClass: 'good',
            scores: { lang: 86, general: 91 },
            caption: 'Fine-tuning only the weights touching those three language neurons improves the target language performance while leaving the rest of the network almost untouched: minimal degradation on general knowledge.'
        },
        full: {
            label: 'full fine-tuning',
            params: '100% of parameters updated',
            paramsClass: 'bad',
            scores: { lang: 61, general: 68 },
            caption: "Full fine-tuning updates every weight instead of just the subnetwork. With the little data available for this language, that mostly means overfitting: the model does worse on the target language than the sparse subnetwork does, while also forgetting more elsewhere."
        }
    };

    function renderBars(scores) {
        const container = widget.querySelector('.subnet-bars');
        container.innerHTML = '';
        [['target language', scores.lang], ['general knowledge', scores.general]].forEach(([label, pct]) => {
            const row = document.createElement('div');
            row.className = 'feature-meter-label';
            const labelLine = document.createElement('div');
            labelLine.textContent = `${label}: ${pct}`;
            row.appendChild(labelLine);
            const bar = document.createElement('div');
            bar.className = 'feature-meter-bar';
            const fill = document.createElement('div');
            fill.className = 'feature-meter-fill';
            fill.style.width = pct + '%';
            bar.appendChild(fill);
            row.appendChild(bar);
            container.appendChild(row);
        });
    }

    function render(stateKey) {
        const state = STATES[stateKey];
        const isOurs = stateKey === 'ours';
        const isFull = stateKey === 'full';
        const trainedSparse = isOurs || isFull;

        widget.querySelectorAll('.adapt-mode-btn').forEach((b) => {
            b.classList.toggle('active', b.dataset.subnetState === stateKey);
        });

        sparseEdges.forEach((edge) => {
            edge.setAttribute('stroke', trainedSparse ? '#007BFF' : '#ccc');
            edge.setAttribute('stroke-width', trainedSparse ? '1.6' : '1');
            edge.setAttribute('stroke-opacity', trainedSparse ? '0.85' : '0.5');
        });
        bgEdges.forEach((edge) => {
            edge.setAttribute('stroke', isFull ? '#e07856' : '#ccc');
            edge.setAttribute('stroke-width', isFull ? '1.6' : '1');
            edge.setAttribute('stroke-opacity', isFull ? '0.85' : '0.5');
        });

        neuronNodes.forEach((node, i) => {
            const isLang = LANG_NEURON_IDX.includes(i);
            if (isLang) {
                node.setAttribute('fill', trainedSparse ? '#007BFF' : '#ddd');
                node.setAttribute('stroke', '#007BFF');
                node.setAttribute('stroke-width', '1.6');
                node.setAttribute('fill-opacity', '1');
            } else {
                node.setAttribute('fill', isFull ? '#e07856' : '#ddd');
                node.setAttribute('stroke', 'none');
                node.setAttribute('fill-opacity', isFull ? '0.9' : '0.8');
            }
        });

        widget.querySelector('.subnet-caption').textContent = state.caption;
        renderBars(state.scores);
        const readout = widget.querySelector('.subnet-readout');
        readout.textContent = state.params;
        readout.className = 'separation-readout subnet-readout' + (state.paramsClass ? ' ' + state.paramsClass : '');
    }

    widget.querySelectorAll('.adapt-mode-btn').forEach((btn) => {
        btn.addEventListener('click', () => render(btn.dataset.subnetState));
    });

    render('baseline');
}

