/* ========== STATE ========== */
const state = {
  mode: 'full',
  bg: null,
  posY: 0,
  shortPosY: 160,
  overlayOpacity: 0.45,
  shortOverlayOpacity: 0,
  font: 'serif',
  chars: [],
  short: {
    name: '인물1',
    deco: false,
    decoName: '',
    color: '#e8a0b4',
    textColor: '#313030',
    boxColor: '#ffffff',
    boxOpacity: 0.65,
    text: '대사를 입력해 주세요.'
  }
};

let uid = 0;
const genId = () => ++uid;

/* ========== INTERACT STATE ========== */
let bgScale = 1, bgX = 0, bgY = 0;

/* ========== DOM REFS ========== */
const $ = id => document.getElementById(id);
const bgUpload       = $('bgUpload');
const bgName         = $('bgName');
const bgRemove       = $('bgRemove');
const togFull        = $('togFull');
const togShort       = $('togShort');
const fullMode       = $('fullMode');
const shortMode      = $('shortMode');
const charList       = $('charList');
const addCharBtn     = $('addChar');
const addMonoBtn     = $('addMono');
const saveBtn        = $('saveBtn');
const previewBg      = $('previewBg');
const previewContent = $('previewContent');
const previewOverlay = $('previewOverlay');
const burgerBtn      = $('burgerBtn');
const editorPanel    = $('editorPanel');
const overlay        = $('overlay');
const fontSerifBtn   = $('fontSerif');
const fontSansBtn    = $('fontSans');

const bgScaleSlider = $('bgScaleSlider');
const bgScaleValEl  = $('bgScaleVal');

bgScaleSlider.addEventListener('input', () => {
  bgScale = +bgScaleSlider.value / 100;
  bgScaleValEl.textContent = bgScaleSlider.value + '%';
  applyBgTransform();
});
bgScaleSlider.addEventListener('mousedown', e => e.stopPropagation());
bgScaleSlider.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });

/* ── Font toggle ── */
fontSerifBtn.addEventListener('click', () => {
  state.font = 'serif';
  fontSerifBtn.classList.add('active');
  fontSansBtn.classList.remove('active');
  updatePreview();
});
fontSansBtn.addEventListener('click', () => {
  state.font = 'sans';
  fontSansBtn.classList.add('active');
  fontSerifBtn.classList.remove('active');
  updatePreview();
});

/* ========== INIT ========== */
addCharEntry('char');
addCharEntry('char', 'right');
updatePreview();

/* ========== BACKGROUND ========== */
bgUpload.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    state.bg = ev.target.result;
    bgName.textContent = file.name;
    bgRemove.classList.add('show');
    bgX = 0; bgY = 0; bgScale = 1;
    previewBg.src = state.bg;
    previewBg.style.display = '';
    updatePreview();
  };
  reader.readAsDataURL(file);
});

bgRemove.addEventListener('click', () => {
  state.bg = null;
  bgName.textContent = '선택된 파일 없음';
  bgRemove.classList.remove('show');
  bgUpload.value = '';
  previewBg.src = '';
  previewBg.style.display = 'none';
  bgX = 0; bgY = 0; bgScale = 1;
  applyBgTransform();
  updatePreview();
});

/* ========== OVERLAY SLIDER ========== */
const overlaySlider = $('overlaySlider');
const overlayValEl  = $('overlayVal');

overlaySlider.addEventListener('input', () => {
  const val = +overlaySlider.value / 100;
  if (state.mode === 'full') {
    state.overlayOpacity = val;
  } else {
    state.shortOverlayOpacity = val;
  }
  overlayValEl.textContent = overlaySlider.value + '%';
  updatePreview();
});
overlaySlider.addEventListener('mousedown', e => e.stopPropagation());
overlaySlider.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });

/* ========== VIEW MODE ========== */
togFull.addEventListener('click', () => setMode('full'));
togShort.addEventListener('click', () => setMode('short'));

function setMode(m) {
  state.mode = m;
  togFull.classList.toggle('active', m === 'full');
  togShort.classList.toggle('active', m === 'short');
  fullMode.style.display = m === 'full' ? '' : 'none';
  shortMode.style.display = m === 'short' ? '' : 'none';
  /* 슬라이더 값을 모드에 맞게 전환 */
  const currentOpacity = m === 'full' ? state.overlayOpacity : state.shortOverlayOpacity;
  overlaySlider.value = Math.round(currentOpacity * 100);
  overlayValEl.textContent = Math.round(currentOpacity * 100) + '%';
  updatePreview();
}

/* ========== CHAR BLOCKS (FULL) ========== */
addCharBtn.addEventListener('click', () => addCharEntry('char'));
addMonoBtn.addEventListener('click', () => addCharEntry('mono'));

/* ── Sort mode ── */
let sortMode = false;
let sortableInst = null;
const sortToggleBtn = $('sortToggle');

sortToggleBtn.addEventListener('click', () => {
  sortMode = !sortMode;
  sortToggleBtn.textContent = sortMode ? '✓ 완료' : '⇅ 순서 변경';
  sortToggleBtn.classList.toggle('active', sortMode);
  charList.querySelectorAll('.char-block').forEach(b => {
    b.classList.toggle('sort-mode', sortMode);
  });
  if (sortMode) {
    sortableInst = new Sortable(charList, {
      animation: 180,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      onEnd() {
        const newOrder = [...charList.querySelectorAll('.char-block')].map(el => {
          return state.chars.find(c => c.id === +el.dataset.id);
        }).filter(Boolean);
        state.chars = newOrder;
        updatePreview();
      }
    });
  } else {
    if (sortableInst) { sortableInst.destroy(); sortableInst = null; }
  }
});

/* ── Position move mode (full) ── */
let posMode = false;
const posToggleBtn  = $('posToggle');
const posSliderWrap = $('posSliderWrap');
const posSlider     = $('posSlider');
const posValEl      = $('posVal');

posToggleBtn.addEventListener('click', () => {
  posMode = !posMode;
  posToggleBtn.textContent = posMode ? '✓ 완료' : '↕ 위치 이동';
  posToggleBtn.classList.toggle('active', posMode);
  posSliderWrap.style.display = posMode ? 'flex' : 'none';
});

posSlider.addEventListener('input', () => {
  state.posY = +posSlider.value;
  posValEl.textContent = state.posY;
  updatePreview();
});
posSlider.addEventListener('mousedown', e => e.stopPropagation());
posSlider.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });

/* ── Position move mode (short) ── */
let shortPosMode = false;
const shortPosToggleBtn  = $('shortPosToggle');
const shortPosSliderWrap = $('shortPosSliderWrap');
const shortPosSlider     = $('shortPosSlider');
const shortPosValEl      = $('shortPosVal');

shortPosToggleBtn.addEventListener('click', () => {
  shortPosMode = !shortPosMode;
  shortPosToggleBtn.textContent = shortPosMode ? '✓ 완료' : '↕ 위치 이동';
  shortPosToggleBtn.classList.toggle('active', shortPosMode);
  shortPosSliderWrap.style.display = shortPosMode ? 'flex' : 'none';
});

shortPosSlider.addEventListener('input', () => {
  state.shortPosY = +shortPosSlider.value;
  shortPosValEl.textContent = state.shortPosY;
  updatePreview();
});
shortPosSlider.addEventListener('mousedown', e => e.stopPropagation());
shortPosSlider.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });

function addCharEntry(type, align = 'left') {
  const entry = {
    id: genId(),
    type,
    name: type === 'char' ? `인물${charList.querySelectorAll('.char-block').length + 1}` : '',
    deco: false,
    decoName: '',
    decoX: 0,
    color: '#e8a0b4',
    text: '대사를 입력해 주세요.',
    align,
    italic: false
  };

function buildBlock(entry) {
  const div = document.createElement('div');
  div.className = 'char-block' + (entry.type === 'mono' ? ' mono' : '');
  div.dataset.id = entry.id;

  const toolbar = document.createElement('div');
  toolbar.className = 'blk-toolbar';

  const lbl = document.createElement('span');
  lbl.className = 'blk-label';
  lbl.textContent = entry.type === 'mono' ? '독백' : '인물';

  const actions = document.createElement('div');
  actions.className = 'blk-actions';

  const alignOptions = entry.type === 'mono'
    ? [['left', '<i class="ph ph-text-align-left"></i>'], ['center', '<i class="ph ph-text-align-center"></i>'], ['right', '<i class="ph ph-text-align-right"></i>']]
    : [['left', '<i class="ph ph-text-align-left"></i>'], ['right', '<i class="ph ph-text-align-right"></i>']];

  alignOptions.forEach(([val, icon]) => {
    const btn = mkBlkBtn('', () => {
      entry.align = val;
      updateAlignBtns(div, entry);
      updatePreview();
    });
    btn.innerHTML = icon;
    btn.dataset.align = val;
    if (entry.align === val) btn.classList.add('active');
    actions.appendChild(btn);
  });

  /* 이탤릭 버튼 — mono 타입만 */
  if (entry.type === 'mono') {
    const italicBtn = mkBlkBtn('', () => {
      entry.italic = !entry.italic;
      italicBtn.classList.toggle('active', entry.italic);
      updatePreview();
    });
    italicBtn.innerHTML = '<i class="ph ph-text-italic"></i>';
    if (entry.italic) italicBtn.classList.add('active');
    actions.appendChild(italicBtn);
  }

  const delBtn = mkBlkBtn('', () => {
    state.chars = state.chars.filter(c => c.id !== entry.id);
    div.remove();
    updatePreview();
  });
  delBtn.innerHTML = '<i class="ph ph-x"></i>';
  delBtn.classList.add('del');

  /* 복사 버튼 — char / mono 공통 */
  const copyBtn = mkBlkBtn('', () => {
    const copied = {
      id: genId(),
      type: entry.type,
      name: entry.name,
      deco: entry.deco,
      decoName: entry.decoName,
      decoX: entry.decoX ?? 0,
      color: entry.color,
      text: '대사를 입력해 주세요.',
      align: entry.align,
      italic: entry.italic
    };
    state.chars.push(copied);
    charList.appendChild(buildBlock(copied));
    updatePreview();
  });
  copyBtn.innerHTML = '<i class="ph ph-copy"></i>';
  actions.insertBefore(copyBtn, actions.firstChild);
  actions.appendChild(delBtn);
  toolbar.append(lbl, actions);

  if (entry.type === 'char') {
    const nameWrap = document.createElement('div');
    nameWrap.className = 'name-wrap';

    const colorWrap = document.createElement('div');
    colorWrap.className = 'color-wrap';
    const dot = document.createElement('span');
    dot.className = 'color-dot';
    dot.style.background = entry.color;
    const pick = document.createElement('input');
    pick.type = 'color';
    pick.value = entry.color;
    pick.className = 'hidden-pick';
    dot.addEventListener('click', () => pick.click());
    pick.addEventListener('input', ev => {
      entry.color = ev.target.value;
      dot.style.background = entry.color;
      updatePreview();
    });
    colorWrap.append(dot, pick);

    const nameInp = document.createElement('input');
    nameInp.type = 'text';
    nameInp.className = 'name-inp';
    nameInp.value = entry.name;
    nameInp.addEventListener('input', ev => { entry.name = ev.target.value; updatePreview(); });

    const decoLabel = document.createElement('label');
    decoLabel.className = 'deco-check';
    const decoChk = document.createElement('input');
    decoChk.type = 'checkbox';
    const decoSpan = document.createElement('span');
    decoSpan.className = 'deco-label';
    decoSpan.textContent = '이름 꾸밈';
    decoLabel.append(decoChk, decoSpan);

    const decoInp = document.createElement('input');
    decoInp.type = 'text';
    decoInp.className = 'name-inp deco-inp';
    decoInp.placeholder = '';
    decoInp.style.display = 'none';
    decoInp.addEventListener('input', ev => { entry.decoName = ev.target.value; updatePreview(); });

    /* 초기값 반영 (복사 시) */
    decoChk.checked = entry.deco;
    decoInp.style.display = entry.deco ? '' : 'none';
    if (entry.decoName) decoInp.value = entry.decoName;

    /* deco 슬라이더 row */
    const decoSliderRow = document.createElement('div');
    decoSliderRow.className = 'pos-row';
    decoSliderRow.style.display = entry.deco ? '' : 'none';

    const decoSlider = document.createElement('input');
    decoSlider.type = 'range';
    decoSlider.className = 'pos-slider';
    decoSlider.min = -100;
    decoSlider.max = 100;
    decoSlider.step = 1;
    decoSlider.value = entry.decoX ?? 0;

    const decoSliderVal = document.createElement('span');
    decoSliderVal.className = 'pos-val';
    decoSliderVal.textContent = entry.decoX ?? 0;

    const decoResetBtn = document.createElement('button');
    decoResetBtn.className = 'sort-btn';
    decoResetBtn.textContent = '↺';
    decoResetBtn.style.padding = '2px 7px';
    decoResetBtn.addEventListener('click', () => {
      entry.decoX = 0;
      decoSlider.value = 0;
      decoSliderVal.textContent = 0;
      updatePreview();
    });

    decoSlider.addEventListener('input', () => {
      entry.decoX = +decoSlider.value;
      decoSliderVal.textContent = decoSlider.value;
      updatePreview();
    });
    decoSlider.addEventListener('mousedown', e => e.stopPropagation());
    decoSlider.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });

    decoSliderRow.append(decoSlider, decoSliderVal, decoResetBtn);

    decoChk.addEventListener('change', ev => {
      entry.deco = ev.target.checked;
      decoInp.style.display = entry.deco ? '' : 'none';
      decoSliderRow.style.display = entry.deco ? '' : 'none';
      updatePreview();
    });

    nameWrap.append(colorWrap, nameInp, decoLabel, decoInp);
    div.append(toolbar, nameWrap, decoSliderRow);
  } else {
    div.append(toolbar);
  }

  const area = document.createElement('textarea');
  area.className = 'dia-area';
  area.rows = 3;
  area.value = entry.text;
  area.addEventListener('input', ev => { entry.text = ev.target.value; updatePreview(); });
  div.appendChild(area);

  return div;
}

function mkBlkBtn(text, fn) {
  const btn = document.createElement('button');
  btn.className = 'blk-btn';
  btn.textContent = text;
  btn.addEventListener('click', fn);
  return btn;
}

function updateAlignBtns(div, entry) {
  div.querySelectorAll('.blk-btn[data-align]').forEach(b => {
    b.classList.toggle('active', b.dataset.align === entry.align);
  });
}


/* ── Border option ── */
const borderToggle  = $('borderToggle');
const borderOptions = $('borderOptions');
const borderSlider  = $('borderSlider');
const borderValEl   = $('borderVal');
const borderColorPick = $('borderColorPick');
const previewEl     = document.querySelector('.preview');

let borderSize  = 8;
let borderColor = '#ffffff';

function applyBorder() {
  if (borderToggle.checked) {
    previewEl.style.boxShadow = `0 0 0 ${borderSize}px ${borderColor}, 0 20px 60px rgba(0,0,0,0.25)`;
  } else {
    previewEl.style.boxShadow = '';
  }
}

borderToggle.addEventListener('change', () => {
  borderOptions.style.display = borderToggle.checked ? 'flex' : 'none';
  applyBorder();
});

borderSlider.addEventListener('input', () => {
  borderSize = +borderSlider.value;
  borderValEl.textContent = borderSize + 'px';
  applyBorder();
});
borderSlider.addEventListener('mousedown', e => e.stopPropagation());
borderSlider.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });

borderColorPick.addEventListener('input', e => {
  borderColor = e.target.value;
  $('borderColorDot').style.background = borderColor;
  applyBorder();
});

/* ========== SHORT MODE CONTROLS ========== */
$('shortName').addEventListener('input', e => { state.short.name = e.target.value; updatePreview(); });
$('shortDia').addEventListener('input', e => { state.short.text = e.target.value; updatePreview(); });
$('shortColorPick').addEventListener('input', e => {
  state.short.color = e.target.value;
  $('shortColorDot').style.background = e.target.value;
  updatePreview();
});
$('shortDecoChk').addEventListener('change', e => {
  state.short.deco = e.target.checked;
  $('shortDecoInp').style.display = e.target.checked ? '' : 'none';
  updatePreview();
});
$('shortDecoInp').addEventListener('input', e => { state.short.decoName = e.target.value; updatePreview(); });
$('shortTextColorPick').addEventListener('input', e => {
  state.short.textColor = e.target.value;
  $('shortTextColorDot').style.background = e.target.value;
  updatePreview();
});
$('shortBoxColorPick').addEventListener('input', e => {
  state.short.boxColor = e.target.value;
  $('shortBoxColorDot').style.background = e.target.value;
  updatePreview();
});
$('shortBoxOpacity').addEventListener('input', e => {
  state.short.boxOpacity = +e.target.value / 100;
  $('shortBoxOpacityVal').textContent = e.target.value + '%';
  updatePreview();
});

/* ========== PREVIEW RENDER ========== */
function updatePreview() {
  previewContent.innerHTML = '';
  previewOverlay.classList.remove('hidden', 'bw');
  previewBg.classList.remove('grayscale');

  const fontFamily = state.font === 'sans' ? 'var(--font-sans)' : 'var(--font-serif)';
  previewContent.style.setProperty('--cur-font', fontFamily);

  if (state.mode === 'full') {
    previewOverlay.style.background = `rgba(0,0,0,${state.overlayOpacity})`;
    renderFull();
  } else {
    previewOverlay.style.background = `rgba(0,0,0,${state.shortOverlayOpacity})`;
    renderShort();
  }
}

function setTextWithBreaks(el, str) {
  el.innerHTML = '';
  str.split('\n').forEach((line, i, arr) => {
    el.appendChild(document.createTextNode(line));
    if (i < arr.length - 1) el.appendChild(document.createElement('br'));
  });
}

function renderFull() {
  const wrap = document.createElement('div');
  wrap.className = 'pv-full';
  wrap.style.transform = `translateY(${-state.posY}px)`;

  state.chars.forEach(c => {
    if (c.type === 'mono') {
      const mono = document.createElement('div');
      mono.className = 'pv-mono';
      setTextWithBreaks(mono, c.text);
      const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
      mono.style.alignSelf = alignMap[c.align] || 'flex-start';
      mono.style.textAlign = c.align === 'center' ? 'center' : c.align === 'right' ? 'right' : 'left';
      if (c.italic) mono.style.fontStyle = 'italic';
      wrap.appendChild(mono);
      return;
    }

    const block = document.createElement('div');
    block.className = `pv-block ${c.align}`;

    const nameRow = document.createElement('div');
    nameRow.className = 'pv-name-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'pv-name';
    nameEl.style.color = c.color;
    nameEl.textContent = c.name || '인물';
    nameRow.appendChild(nameEl);

    if (c.deco && c.decoName) {
      const decoEl = document.createElement('span');
      decoEl.className = 'pv-name-deco';
      decoEl.textContent = c.decoName;
      const baseLeft = c.align === 'right' ? -26 : -13;
      decoEl.style.left = (baseLeft + (c.decoX ?? 0)) + 'px';
      nameRow.appendChild(decoEl);
    }

    const line = document.createElement('div');
    line.className = 'pv-name-line';

    const text = document.createElement('div');
    text.className = 'pv-text';
    setTextWithBreaks(text, c.text);

    if (togFull.classList.contains('active')) {
      block.append(nameRow, text);
    } else {
      block.append(nameRow, line, text);
    }
    wrap.appendChild(block);
  });

  previewContent.appendChild(wrap);
}

function renderShort() {
  const s = state.short;
  const outer = document.createElement('div');
  outer.className = 'pv-short-wrap';
  outer.style.transform = `translateY(${-state.shortPosY}px)`;

  const r = parseInt(s.boxColor.slice(1,3), 16);
  const g = parseInt(s.boxColor.slice(3,5), 16);
  const b = parseInt(s.boxColor.slice(5,7), 16);

  /* 배경 마스크 레이어 */
  const mask = document.createElement('div');
  mask.className = 'pv-short-mask';
  mask.style.background = `rgba(${r},${g},${b},${s.boxOpacity})`;

  /* 그라데이션 fade (html2canvas용) */
  const fade = document.createElement('div');
  fade.className = 'pv-short-fade';
  fade.style.background = `linear-gradient(to bottom, transparent 50%, rgba(${r},${g},${b},${s.boxOpacity}) 100%)`;

  /* 콘텐츠 레이어 */
  const content = document.createElement('div');
  content.className = 'pv-short-content';

  const nameRow = document.createElement('div');
  nameRow.className = 'pv-short-name-row';

  const nameEl = document.createElement('span');
  nameEl.className = 'pv-short-name';
  nameEl.style.color = s.color;
  nameEl.textContent = s.name || '인물';
  nameRow.appendChild(nameEl);

  if (s.deco && s.decoName) {
    const decoEl = document.createElement('span');
    decoEl.className = 'pv-short-name-deco';
    decoEl.textContent = '/ ' + s.decoName;
    const hex = s.color.replace('#', '');
    const dr = parseInt(hex.slice(0,2), 16);
    const dg = parseInt(hex.slice(2,4), 16);
    const db = parseInt(hex.slice(4,6), 16);
    decoEl.style.color = `rgba(${dr},${dg},${db},0.6)`;
    nameRow.appendChild(decoEl);
  }

  const line = document.createElement('div');
  line.className = 'pv-short-line';

  const text = document.createElement('div');
  text.className = 'pv-short-text';
  text.style.color = s.textColor;
  setTextWithBreaks(text, s.text);

  content.append(nameRow, line, text);
  outer.appendChild(mask);
  outer.appendChild(fade);
  outer.appendChild(content);
  previewContent.appendChild(outer);
}

/* ========== INTERACT.JS ========== */
function applyBgTransform() {
  previewBg.style.transform = `translate(calc(-50% + ${bgX}px), calc(-50% + ${bgY}px)) scale(${bgScale})`;
  /* 슬라이더 동기화 */
  if (bgScaleSlider) {
    bgScaleSlider.value = Math.round(bgScale * 100);
    bgScaleValEl.textContent = Math.round(bgScale * 100) + '%';
  }
}

interact(previewBg)
  .draggable({
    ignoreFrom: 'input, textarea, button, select',
    listeners: {
      move(e) { bgX += e.dx; bgY += e.dy; applyBgTransform(); }
    }
  })
  .gesturable({
    ignoreFrom: 'input, textarea, button, select',
    listeners: {
      move(e) {
        bgScale = Math.min(10, bgScale * e.scale);
        applyBgTransform();
      }
    }
  });

document.querySelector('.preview').addEventListener('wheel', e => {
  e.preventDefault();
  bgScale = Math.max(0.05, Math.min(10, bgScale - e.deltaY * 0.001));
  applyBgTransform();
}, { passive: false });

/* ========== SAVE ========== */
saveBtn.addEventListener('click', async () => {
  const saveOverlay = $('saveOverlay');
  saveOverlay.classList.add('show');

  const preview = document.querySelector('.preview');
  const hasBorder = borderToggle.checked;
  const pad = hasBorder ? borderSize : 0;
  const totalW = 360 + pad * 2;
  const totalH = 640 + pad * 2;

  const originalStyle = {
    width: preview.style.width,
    height: preview.style.height,
    transform: preview.style.transform
  };

  preview.style.width = '360px';
  preview.style.height = '640px';
  preview.style.transform = 'none';

  try {
    const canvas = await html2canvas(preview, {
      useCORS: true,
      scale: 2,
      width: 360,
      height: 640,
      backgroundColor: null
    });

    /* border-radius 클리핑 */
    const clipped = document.createElement('canvas');
    clipped.width  = canvas.width;
    clipped.height = canvas.height;
    const ctx = clipped.getContext('2d');
    const radius = 20 * 2;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(clipped.width - radius, 0);
    ctx.quadraticCurveTo(clipped.width, 0, clipped.width, radius);
    ctx.lineTo(clipped.width, clipped.height - radius);
    ctx.quadraticCurveTo(clipped.width, clipped.height, clipped.width - radius, clipped.height);
    ctx.lineTo(radius, clipped.height);
    ctx.quadraticCurveTo(0, clipped.height, 0, clipped.height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(canvas, 0, 0);

    if (hasBorder) {
      const final = document.createElement('canvas');
      final.width  = totalW * 2;
      final.height = totalH * 2;
      const ctx2 = final.getContext('2d');
      ctx2.fillStyle = borderColor;
      ctx2.fillRect(0, 0, final.width, final.height);
      ctx2.drawImage(clipped, pad * 2, pad * 2);
      const link = document.createElement('a');
      link.download = '스크립트메이커.png';
      link.href = final.toDataURL('image/png');
      link.click();
    } else {
      const link = document.createElement('a');
      link.download = '스크립트메이커.png';
      link.href = clipped.toDataURL('image/png');
      link.click();
    }
  } catch (err) {
    console.error(err);
    alert('저장 중 오류가 발생했습니다.');
  } finally {
    saveOverlay.classList.remove('show');
    preview.style.width = originalStyle.width;
    preview.style.height = originalStyle.height;
    preview.style.transform = originalStyle.transform;
  }
});

/* ========== MOBILE PANEL ========== */
burgerBtn.addEventListener('click', () => {
  editorPanel.classList.add('open');
  overlay.classList.add('show');
});

overlay.addEventListener('click', () => {
  editorPanel.classList.remove('open');
  overlay.classList.remove('show');
});

/* ========== NOTICE MODAL ========== */
const noticeBackdrop = $('noticeBackdrop');
const noticeModal    = $('noticeModal');
const noticeClose    = $('noticeClose');
const noticeConfirm  = $('noticeConfirm');
const noticeDontShow = $('noticeDontShow');
const helpBtn        = $('helpBtn');

function openNotice() {
  noticeBackdrop.classList.add('show');
  noticeModal.classList.add('show');
}

function closeNotice() {
  if (noticeDontShow.checked) {
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('noticeDismissed', expires);
  }
  noticeBackdrop.classList.remove('show');
  noticeModal.classList.remove('show');
}

const dismissed = localStorage.getItem('noticeDismissed');
if (!dismissed || Date.now() > +dismissed) {
  openNotice();
}

noticeClose.addEventListener('click', closeNotice);
noticeConfirm.addEventListener('click', closeNotice);
noticeBackdrop.addEventListener('click', closeNotice);
helpBtn.addEventListener('click', openNotice);
$('bgColorPick').addEventListener('input', e => {
  document.querySelector('.preview').style.background = e.target.value;
  $('bgColorDot').style.background = e.target.value;
});