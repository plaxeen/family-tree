const container = document.getElementById("tree-container");
const template = document.getElementById("person-card-template");
let people = JSON.parse(localStorage.getItem("familyTree")) || [];

function render() {
  container.innerHTML = '<svg id="connections"></svg>';
  people.forEach((person, index) => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector(".person-card");
    card.setAttribute("data-id", person.id || index);
    const nameEl = card.querySelector(".name");
    const relationEl = card.querySelector(".relation");
    const socialEl = card.querySelector(".social");
    const parentEl = card.querySelector(".parent");

    nameEl.innerText = person.name;
    relationEl.value = person.relation;
    socialEl.value = person.social;
    parentEl.value = person.parentId || "";

    nameEl.oninput = (e) => {
      const sel = window.getSelection();
      const range = sel.getRangeAt(0);
      const pos = range.startOffset;
      people[index].name = e.target.innerText;
      save(false); // не перерендериваем
      // вернем фокус и позицию
      render();
      const newCard = document.querySelector(`[data-id='${person.id}']`);
      const newNameEl = newCard.querySelector(".name");
      newNameEl.focus();
      const newRange = document.createRange();
      newRange.setStart(newNameEl.firstChild || newNameEl, Math.min(pos, newNameEl.textContent.length));
      newRange.collapse(true);
      const newSel = window.getSelection();
      newSel.removeAllRanges();
      newSel.addRange(newRange);
    };

    relationEl.oninput = (e) => update(index, "relation", e.target.value);
    socialEl.oninput = (e) => update(index, "social", e.target.value);
    parentEl.oninput = (e) => update(index, "parentId", e.target.value);
    card.querySelector(".delete").onclick = () => remove(index);

    const search = card.querySelector(".search-social");
    search.href = `https://www.google.com/search?q=${encodeURIComponent(person.name + ' site:vk.com OR site:facebook.com')}`;

    container.appendChild(card);
  });
  drawConnections();
}

function drawConnections() {
  const svg = document.querySelector("#connections");
  people.forEach(person => {
    if (!person.parentId) return;
    const childEl = document.querySelector(`[data-id='${person.id}']`);
    const parentEl = document.querySelector(`[data-id='${person.parentId}']`);
    if (!childEl || !parentEl) return;
    const cRect = childEl.getBoundingClientRect();
    const pRect = parentEl.getBoundingClientRect();
    const x1 = pRect.left + pRect.width / 2;
    const y1 = pRect.bottom + window.scrollY;
    const x2 = cRect.left + cRect.width / 2;
    const y2 = cRect.top + window.scrollY;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1); line.setAttribute("y1", y1);
    line.setAttribute("x2", x2); line.setAttribute("y2", y2);
    line.setAttribute("stroke", "black");
    line.setAttribute("stroke-width", "2");
    svg.appendChild(line);
  });
}

function update(index, key, value) {
  people[index][key] = value;
  save();
}

function save(shouldRender = true) {
  localStorage.setItem("familyTree", JSON.stringify(people));
  if (shouldRender) render();
}

function addPerson() {
  people.push({ id: Date.now(), name: "Родственник", relation: "", social: "", parentId: "" });
  save();
}

function remove(index) {
  people.splice(index, 1);
  save();
}

document.getElementById("search").oninput = () => {
  const search = document.getElementById("search").value.toLowerCase();
  people = people.map(p => ({...p, visible: !search || p.name.toLowerCase().includes(search) }));
  render();
};

function exportData() {
  const data = JSON.stringify(people, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "family_tree.json";
  a.click();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    people = JSON.parse(e.target.result);
    save();
  };
  reader.readAsText(file);
}

function exportImage() {
  html2canvas(document.getElementById("tree-container")).then(canvas => {
    const link = document.createElement("a");
    link.download = "tree.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

render();