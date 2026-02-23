// ---------- МОДЕЛЬ ХАФФМАНА ----------

class HuffmanNode {
  constructor(char, freq, left = null, right = null) {
    this.char = char;
    this.freq = freq;
    this.left = left;
    this.right = right;
  }
}

function buildHuffmanTree(text) {
  const freqMap = new Map();
  for (const ch of text) {
    freqMap.set(ch, (freqMap.get(ch) || 0) + 1);
  }

  let nodes = [];
  for (const [ch, freq] of freqMap.entries()) {
    nodes.push(new HuffmanNode(ch, freq));
  }

  if (nodes.length === 0) return null;

  if (nodes.length === 1) {
    const only = nodes[0];
    const fake = new HuffmanNode(null, 0);
    return new HuffmanNode(null, only.freq, fake, only);
  }

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    const left = nodes.shift();
    const right = nodes.shift();
    const parent = new HuffmanNode(null, left.freq + right.freq, left, right);
    nodes.push(parent);
  }

  return nodes[0];
}

function generateCodes(node, prefix = "", codes = {}) {
  if (!node) return codes;
  if (node.char !== null) {
    codes[node.char] = prefix || "0";
    return codes;
  }
  generateCodes(node.left, prefix + "0", codes);
  generateCodes(node.right, prefix + "1", codes);
  return codes;
}

function encode(text, codes) {
  let result = "";
  for (const ch of text) {
    result += codes[ch];
  }
  return result;
}

function decode(encoded, tree) {
  if (!tree) return "";
  let result = "";
  let node = tree;

  for (const bit of encoded) {
    node = bit === "0" ? node.left : node.right;
    if (node.char !== null) {
      result += node.char;
      node = tree;
    }
  }
  return result;
}

function buildTreeFromCodes(codes) {
  const root = new HuffmanNode(null, 0);
  for (const [ch, code] of Object.entries(codes)) {
    let node = root;
    for (const bit of code) {
      if (bit === "0") {
        if (!node.left) node.left = new HuffmanNode(null, 0);
        node = node.left;
      } else {
        if (!node.right) node.right = new HuffmanNode(null, 0);
        node = node.right;
      }
    }
    node.char = ch;
  }
  return root;
}

// ---------- DOM-ЭЛЕМЕНТЫ ----------

const inputText = document.getElementById("inputText");
const compressedText = document.getElementById("compressedText");
const decompressedText = document.getElementById("decompressedText");
const codesView = document.getElementById("codesView");

const origLengthSpan = document.getElementById("origLength");
const compLengthSpan = document.getElementById("compLength");
const ratioSpan = document.getElementById("ratio");

const compressBtn = document.getElementById("compressBtn");
const decompressBtn = document.getElementById("decompressBtn");
const clearBtn = document.getElementById("clearBtn");
const saveArchiveBtn = document.getElementById("saveArchiveBtn");
const loadArchiveBtn = document.getElementById("loadArchiveBtn");
const archiveInput = document.getElementById("archiveInput");

// состояние
let lastTree = null;
let lastEncoded = "";
let lastCodes = null;

// ---------- ОБРАБОТЧИКИ КНОПОК ----------

compressBtn.addEventListener("click", () => {
  const text = inputText.value;
  if (!text || text.length === 0) {
    alert("Введите текст для сжатия.");
    return;
  }

  const tree = buildHuffmanTree(text);
  const codes = generateCodes(tree);
  const encoded = encode(text, codes);

  lastTree = tree;
  lastEncoded = encoded;
  lastCodes = codes;

  compressedText.value = encoded;
  decompressedText.value = "";
  decompressBtn.disabled = !encoded.length;

  const originalBits = text.length * 8;
  const compressedBits = encoded.length;

  origLengthSpan.textContent = text.length.toString();
  compLengthSpan.textContent = compressedBits.toString();
  const ratio =
    compressedBits === 0 ? 0 : (originalBits / compressedBits).toFixed(2);
  ratioSpan.textContent = ratio;

  let codesStr = "";
  Object.entries(codes).forEach(([ch, code]) => {
    const showChar =
      ch === " " ? "[пробел]" :
      ch === "\n" ? "[\\n]" :
      ch === "\t" ? "[\\t]" : ch;
    codesStr += `${showChar}: ${code}\n`;
  });
  codesView.textContent = codesStr;
});

decompressBtn.addEventListener("click", () => {
  if (!lastTree || !lastEncoded) {
    alert("Нет данных для восстановления. Сначала нажмите «Сжать».");
    return;
  }
  const decoded = decode(lastEncoded, lastTree);
  decompressedText.value = decoded;
});

clearBtn.addEventListener("click", () => {
  inputText.value = "";
  compressedText.value = "";
  decompressedText.value = "";
  codesView.textContent = "";
  origLengthSpan.textContent = "0";
  compLengthSpan.textContent = "0";
  ratioSpan.textContent = "0";
  lastTree = null;
  lastEncoded = "";
  lastCodes = null;
  decompressBtn.disabled = true;
});

// ---------- АРХИВАТОР ----------

function downloadFile(filename, text) {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

saveArchiveBtn.addEventListener("click", () => {
  if (!lastEncoded || !lastCodes) {
    alert("Сначала сожми текст, чтобы было что сохранять.");
    return;
  }

  const payload = {
    encoded: lastEncoded,
    codes: lastCodes
  };

  const json = JSON.stringify(payload);
  downloadFile("archive.huff", json);
});

loadArchiveBtn.addEventListener("click", () => {
  archiveInput.click();
});

archiveInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      const obj = JSON.parse(text);

      if (!obj.encoded || !obj.codes) {
        alert("Неверный формат файла .huff");
        return;
      }

      lastEncoded = obj.encoded;
      lastCodes = obj.codes;
      lastTree = buildTreeFromCodes(obj.codes);

      compressedText.value = lastEncoded;
      const decoded = decode(lastEncoded, lastTree);
      decompressedText.value = decoded;
      inputText.value = decoded;
      decompressBtn.disabled = !lastEncoded.length;

      const originalBits = decoded.length * 8;
      const compressedBits = lastEncoded.length;

      origLengthSpan.textContent = decoded.length.toString();
      compLengthSpan.textContent = compressedBits.toString();
      ratioSpan.textContent =
        compressedBits === 0 ? "0" : (originalBits / compressedBits).toFixed(2);

      let codesStr = "";
      Object.entries(lastCodes).forEach(([ch, code]) => {
        const showChar =
          ch === " " ? "[пробел]" :
          ch === "\n" ? "[\\n]" :
          ch === "\t" ? "[\\t]" : ch;
        codesStr += `${showChar}: ${code}\n`;
      });
      codesView.textContent = codesStr;
    } catch (err) {
      console.error(err);
      alert("Не удалось прочитать файл .huff");
    } finally {
      archiveInput.value = "";
    }
  };

  reader.readAsText(file);
});
