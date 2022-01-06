/* global TrelloPowerUp */

var t = TrelloPowerUp.iframe();
var list = t.arg("releaseNotesList");

const labels = list.cards
  .map((card) => card.labels)
  .flat()
  .filter(
    (label, ix, array) => array.findIndex((a) => a.id === label.id) === ix
  );

const headerLabel = document.getElementById("h2-label");
const renderOptionsForm = document.getElementById("render-options");
const releaseNotesContainer = document.getElementById("release-notes");
const copyToClipboardButton = document.getElementById('copy-to-clipboard');
const renderOptionRadios = document.querySelectorAll('input[name="render_as"]');
const groupLabelOptionCheckboxes = document.getElementsByClassName('group-labels-option-checkbox');
const groupLabelOptionCheckboxAll = document.getElementById('group-labels-option-checkbox-all');
const selectGroupLabelsButton = document.getElementById(
  "select-group-labels-button"
);
const selectGroupLabelsDropdown = document.getElementById(
  "select-group-labels-dropdown"
);
const includeDescriptionsCheckbox = document.getElementById(
  "include-descriptions"
);

function listItemEl(card, showLabel) {
  const li = document.createElement("li");

  let name;
  if (includeDescriptionsCheckbox.checked) {
    name = document.createElement('h3');
    name.append(card.name);
  } else {
    name = card.name;
  }
  
  li.append(name);

  if (showLabel) {
    for (const label of card.labels) {
      li.append(cardLabelEl(label));
    }
  }
  if (includeDescriptionsCheckbox.checked && card.desc) {
    const p = document.createElement("p");
    p.append(card.desc);
    p.classList.add("card-description");
    li.append(p);
  }

  return li;
}

function cardLabelEl(label) {
  const span = document.createElement("span");

  span.classList.add("card-label", `card-label-${label.color}`);
  span.style.background = label.color;
  span.innerText = label.name;

  return span;
}

function listEl(cards, showLabels) {
  const ul = document.createElement("ul");

  ul.classList.add("notes-list");

  for (const card of cards) {
    ul.append(listItemEl(card, showLabels));
  }

  return ul;
}

function getGroupLabels() {
  const labels = [];
  for (const ckbx of groupLabelOptionCheckboxes) { 
    if (ckbx.checked) {
      labels.push(ckbx.value);
    }
  }
  return labels;
}

function generateReleaseNotes(cards) {
  persistFilters();

  const renderAs = document.querySelector(
    'input[name="render_as"]:checked'
  ).value;

  const c = cards.map((card) => card);

  if (renderAs === "order-label") {
    c.sort((a, b) => a.labels[0].name.localeCompare(b.labels[0].name));
  }

  copyToClipboardButton.innerText = 'Copy to Clipboard';
  releaseNotesContainer.innerHTML = "";

  if (renderAs === "group-labels") {
    const selected = getGroupLabels();
    
    for (const label of labels) {
      if (!selected.includes(label.name)) {
        continue;
      }
      releaseNotesContainer.appendChild(cardLabelEl(label));
      releaseNotesContainer.appendChild(
        listEl(c.filter((card) => card.labels.find((l) => l.id === label.id)))
      );
    }
  } else {
    releaseNotesContainer.append(listEl(c, true));
  }
}

function persistFilters() {
  if (!t.memberCanWriteToModel('board')) {
    return;
  }

  const filters = new FormData(renderOptionsForm);

  console.log('persisting filters');
  console.log(filters.values());
  console.log(filters.getAll());

  filters.addEventListener('formdata', (e) => {
    console.log('form data fired');
    console.log(e);
  })

  //t.set('board', 'shared', 'release-notes', value)
}

t.render(() => {
  headerLabel.innerHTML = ` for ${list.name}`;

  generateReleaseNotes(list.cards);
  
  // Copy to clipboard functionality
  // ClipboardItem is unsupported in the Trello iframe, but we'll attempt it
  // anyways since execCommand will eventually be deprecated
  copyToClipboardButton.addEventListener('click', (e) => {
    const type = "text/html";
    const blob = new Blob([releaseNotesContainer.innerHTML], { type });

    /* global ClipboardItem */
    const data = [new ClipboardItem({ [type]: blob })];
    
    const setCopySuccess = () => {
      copyToClipboardButton.innerText = '✓ Copied to Clipboard';
    }

    navigator.clipboard.write(data).then(
        setCopySuccess,
        (e) => {
          // Fallback to execCommand method on failure
          
          const copyListener = (e) => {
            e.clipboardData.setData("text/html", releaseNotesContainer.innerHTML);
            setCopySuccess();
            e.preventDefault();
          }

          document.addEventListener("copy", copyListener);
          document.execCommand("copy");
          document.removeEventListener("copy", copyListener);
        }
    );
  });

  
  // Group label options
  for (const label of labels) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = label.name;
    checkbox.checked = true;
    checkbox.classList.add('group-labels-option-checkbox')

    const option = document.createElement("label");
    option.classList.add("group-labels-option");
    option.name = "group_label_options[]"
    option.append(checkbox);
    option.append(label.name);

    selectGroupLabelsDropdown.append(option);
  }


  // Group label options dropdown toggles
  selectGroupLabelsButton.addEventListener("click", (e) => {
    selectGroupLabelsDropdown.style.display =
      selectGroupLabelsDropdown.style.display === "block" ? "none" : "block";
  });
  
  document.body.addEventListener('click', (e) => {
    if (!e.path.includes(renderOptionsForm) && selectGroupLabelsDropdown.style.display === 'block') {
      selectGroupLabelsDropdown.style.display = 'none';
    }
  });


  // Form filters
  groupLabelOptionCheckboxAll.addEventListener('change', (e) => {
    for (const ckbx of groupLabelOptionCheckboxes) {
      ckbx.checked = e.target.checked;
    } 
    generateReleaseNotes(list.cards);
  });

  for (const radio of renderOptionRadios) {
    radio.addEventListener("change", (e) => {
      generateReleaseNotes(list.cards);
    });
  }

  includeDescriptionsCheckbox.addEventListener("change", (e) =>
    generateReleaseNotes(list.cards)
  );
  
  for (const ckbx of groupLabelOptionCheckboxes) {
    ckbx.addEventListener("change", (e) => {
      const checked = getGroupLabels();
      
      if (checked.length === groupLabelOptionCheckboxes.length) {
        groupLabelOptionCheckboxAll.checked = true;
        selectGroupLabelsButton.innerText = "all";
      } else {
        groupLabelOptionCheckboxAll.checked = false;
        selectGroupLabelsButton.innerText = checked.join(', ')
      }
      
      generateReleaseNotes(list.cards);
    })
  }
});