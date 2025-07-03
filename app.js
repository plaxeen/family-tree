const container = document.getElementById("tree-container");
const template = document.getElementById("person-card-template");
let people = JSON.parse(localStorage.getItem("familyTree")) || [];

function render() {
  container.innerHTML = '<svg id="connections"></svg>';
  people.forEach((person, index) => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector(".person-card");
    card.setAttribute("data-id", person.id || index);
    card.style.position = "absolute";

    const nameEl = card.querySelector(".name");
    const relationEl = card.querySelector(".relation");
    const socialEl = card.querySelector(".social");
    const parentEl = card.querySelector(".parent");

    nameEl.innerText = person.name;
    relationEl.value = person.relation;
    socialEl.value = person.social;
    parentEl.value = person.parentId || "";

    if (!person.x) person.x = 100 + index * 280;
    if (!person.y) person.y = 100;
    card.style.left = person.x + "px";
    card.style.top = person.y + "px";

    card.setAttribute("draggable", true);
    card.ondragstart = (e) => e.dataTransfer.setData("text/plain", index);
    card.ondragend = (e) => {
      const x = e.pageX - 125;
      const y = e.pageY - 30;
      people[index].x = x;
      people[index].y = y;
      save(false);
      updatePositions();
    };

    nameEl.oninput = () => {
      people[index].name = nameEl.innerText;
      save(false);
    };
    relationEl.oninput = () => {
      people[index].relation = relationEl.value;
      save(false);
    };
    socialEl.oninput = () => {
      people[index].social = socialEl.value;
      save(false);
    };
    parentEl.oninput = () => {
      people[index].parentId = parentEl.value;
      save(false);
    };

    card.querySelector(".delete").onclick = () => {
      people.splice(index, 1);
      save();
    };

    const search = card.querySelector(".search-social");
    search.href = `https://www.google.com/search?q=${encodeURIComponent(person.name + ' site:vk.com OR site:facebook.com')}`;

    container.appendChild(card);
  });

  drawConnections();
}

function updatePositions() {
  people.forEach((person, index) => {
    const card = document.querySelector(`[data-id='${person.id}']`);
    if (card) {
      card.style.left = person.x + "px";
      card.style.top = person.y + "px";
    }
  });
  drawConnections();
}

function drawConnections() {
  const svg = document.querySelector("#connections");
  svg.innerHTML = "";
  people.forEach(person => {
    if (!person.parentId) return;
    const childEl = document.querySelector(`[data-id='${person.id}']`);
    const parentEl = document.querySelector(`[data-id='${person.parentId}']`);
    if (!childEl || !parentEl) return;

    const cRect = childEl.getBoundingClientRect();
    const pRect = parentEl.getBoundingClientRect();
    const x1 = pRect.left + pRect.width / 2 + window.scrollX;
    const y1 = pRect.bottom + window.scrollY;
    const x2 = cRect.left + cRect.width / 2 + window.scrollX;
    const y2 = cRect.top + window.scrollY;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "black");
    line.setAttribute("stroke-width", "2");
    svg.appendChild(line);
  });
}

function save(redraw = true) {
  localStorage.setItem("familyTree", JSON.stringify(people));
  if (redraw) render();
}

function addPerson() {
  people.push({ id: Date.now(), name: "Родственник", relation: "", social: "", parentId: "", x: 100, y: 100 });
  save();
}

document.getElementById("search").oninput = () => {
  const search = document.getElementById("search").value.toLowerCase();
  people.forEach(p => p.visible = !search || p.name.toLowerCase().includes(search));
  save();
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