const STORAGE_KEY = 'haohao-a1a2-nomi-v1';

const defaults = {
  part1: {}, part1Checked: false,
  part2: {}, part2Checked: false, selfText: '', otherText: '',
  part3: {}, part3Checked: false
};

function loadState() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return { ...defaults }; }
}

let state = loadState();
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const byId = id => document.getElementById(id);

document.addEventListener('keydown', event => {
  if (event.key === 'Enter') event.preventDefault();
});

function setFeedback(message, type) {
  const node = byId('feedback');
  if (!node) return;
  node.textContent = message;
  node.className = `feedback ${type || ''}`;
  if (message) node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function initPart1() {
  const answers = {
    formaggio: 'm', prosciutto: 'm', gelato: 'm', aglio: 'm', olio: 'm', burro: 'm',
    pasta: 'f', birra: 'f', acqua: 'f', frutta: 'f', verdura: 'f', marmellata: 'f', panna: 'f'
  };
  let selected = null;

  function render() {
    document.querySelectorAll('.word-chip').forEach(chip => {
      const word = chip.dataset.word;
      chip.classList.toggle('selected', selected === word);
      chip.classList.toggle('assigned', Boolean(state.part1[word]));
      chip.setAttribute('aria-pressed', selected === word ? 'true' : 'false');
    });
    ['m', 'f'].forEach(gender => {
      const box = document.querySelector(`.sort-box[data-gender="${gender}"]`);
      box.classList.toggle('ready', Boolean(selected));
      const holder = byId(`placed-${gender}`);
      holder.innerHTML = '';
      Object.keys(answers).filter(word => state.part1[word] === gender).forEach(word => {
        const tag = document.createElement('button');
        tag.type = 'button';
        tag.className = 'placed-word';
        tag.classList.toggle('selected', selected === word);
        if (state.part1Checked && answers[word] !== gender) tag.classList.add('wrong');
        tag.textContent = word;
        tag.setAttribute('aria-pressed', selected === word ? 'true' : 'false');
        tag.addEventListener('click', event => {
          event.stopPropagation();
          selected = word;
          render();
        });
        holder.append(tag);
      });
    });
  }

  document.querySelectorAll('.word-chip').forEach(chip => chip.addEventListener('click', () => {
    selected = chip.dataset.word;
    render();
  }));
  function assignToBox(box) {
    if (!selected) return setFeedback('请先点选一个单词。', 'error');
    state.part1[selected] = box.dataset.gender;
    state.part1Checked = false;
    byId('next').disabled = true;
    selected = null;
    save(); render(); setFeedback('', '');
  }
  document.querySelectorAll('.sort-box').forEach(box => {
    box.addEventListener('click', () => assignToBox(box));
    box.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        assignToBox(box);
      }
    });
  });
  byId('check').addEventListener('click', () => {
    if (Object.keys(state.part1).length < Object.keys(answers).length) return setFeedback('还有单词没有分类，请全部完成后再检查。', 'error');
    state.part1Checked = true;
    const wrong = Object.keys(answers).filter(word => state.part1[word] !== answers[word]);
    save(); render();
    if (wrong.length) setFeedback(`有 ${wrong.length} 个词需要再想一想。红色标出的词可以重新分类。`, 'error');
    else { setFeedback('Bravissimo/a! 全部分类正确，可以进入下一部分。', 'success'); byId('next').disabled = false; }
  });
  byId('next').addEventListener('click', () => location.href = 'parte-2.html');
  const correct = Object.keys(answers).every(word => state.part1[word] === answers[word]);
  byId('next').disabled = !(state.part1Checked && correct);
  render();
}

function initChoicePage(config) {
  const pageState = state[config.key] || {};
  function render() {
    document.querySelectorAll('[data-question]').forEach(group => {
      const question = group.dataset.question;
      const picked = pageState[question];
      group.classList.remove('wrong', 'correct');
      group.querySelectorAll('.choice-btn').forEach(button => {
        button.classList.toggle('selected', picked === button.dataset.value);
        button.classList.remove('wrong');
        button.setAttribute('aria-pressed', picked === button.dataset.value ? 'true' : 'false');
        if (state[config.checkedKey] && picked === button.dataset.value && picked !== config.answers[question]) button.classList.add('wrong');
      });
      if (state[config.checkedKey] && picked) group.classList.add(picked === config.answers[question] ? 'correct' : 'wrong');
    });
  }
  document.querySelectorAll('[data-question] .choice-btn').forEach(button => button.addEventListener('click', () => {
    const group = button.closest('[data-question]');
    pageState[group.dataset.question] = button.dataset.value;
    state[config.key] = pageState;
    state[config.checkedKey] = false;
    if (byId('next')) byId('next').disabled = true;
    if (byId('after-correct')) byId('after-correct').classList.add('hidden');
    if (byId('summary')) byId('summary').classList.add('hidden');
    save(); render(); setFeedback('', '');
  }));
  byId('check').addEventListener('click', () => {
    if (Object.keys(config.answers).some(key => !pageState[key])) return setFeedback('请先完成所有题目。', 'error');
    state[config.checkedKey] = true;
    const wrong = Object.keys(config.answers).filter(key => pageState[key] !== config.answers[key]);
    save(); render();
    if (wrong.length) setFeedback(`还有 ${wrong.length} 题不对，请修改后再检查。`, 'error');
    else {
      setFeedback('Bravissimo/a! 全部正确。', 'success');
      if (byId('next')) byId('next').disabled = false;
      if (byId('after-correct')) byId('after-correct').classList.remove('hidden');
      if (byId('summary')) byId('summary').classList.remove('hidden');
    }
  });
  const correct = Object.keys(config.answers).every(key => pageState[key] === config.answers[key]);
  if (state[config.checkedKey] && correct) {
    if (byId('next')) byId('next').disabled = false;
    if (byId('after-correct')) byId('after-correct').classList.remove('hidden');
    if (byId('summary')) byId('summary').classList.remove('hidden');
  }
  render();
}

function initPart2() {
  initChoicePage({ key: 'part2', checkedKey: 'part2Checked', answers: { q1: 'sono', q2: 'un’', q3: 'è', q4: 'parrucchiere' } });
  const self = byId('self-text');
  const other = byId('other-text');
  self.value = state.selfText || '';
  other.value = state.otherText || '';
  self.addEventListener('input', () => { state.selfText = self.value; save(); });
  other.addEventListener('input', () => { state.otherText = other.value; save(); });
  byId('next').addEventListener('click', () => location.href = 'parte-3.html');
}

function initPart3() {
  initChoicePage({ key: 'part3', checkedKey: 'part3Checked', answers: {
    endings1: 'm', endings2: 'f', ristorante: 's.m.', fiore: 's.m.', stazione: 's.f.', pensione: 's.f.', stagione: 's.f.'
  }});
  byId('next').addEventListener('click', () => location.href = 'parte-4.html');
}

function initPart4() {
  byId('restart').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    location.href = 'index.html';
  });
}

const part = document.body.dataset.part;
if (part === '1') initPart1();
if (part === '2') initPart2();
if (part === '3') initPart3();
if (part === '4') initPart4();
