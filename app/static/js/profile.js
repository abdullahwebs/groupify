axios.post('http://localhost:8000/profile_handling/', {
  'username': localStorage.getItem('username')
})
  .then(response => {
    console.log(response.data)
    document.getElementById('fullName').value = response.data.user.name
    document.getElementById('email').value = response.data.user.email
    document.getElementById('Password').value = response.data.user.password
    document.getElementById('name-badge').innerHTML = response.data.user.name
    document.getElementById('username').value = localStorage.getItem('username')
  })

document.addEventListener("DOMContentLoaded", function () {
  let usernameField = document.getElementById("username");
  if (usernameField) {
    usernameField.value = localStorage.getItem("username") || "";
  }
  document.getElementById("editBtn").addEventListener("click", function () {
    let inputs = document.querySelectorAll("#fullName, #email, #Password");
    let editBtn = this;
    let isEditing = editBtn.innerText.trim().toLowerCase() === "save";
    inputs.forEach(input => {
      input.disabled = isEditing;
    });

    if (isEditing) {
      let updatedData = {
        name: document.getElementById("fullName").value,
        email: document.getElementById("email").value,
        password: document.getElementById("Password").value,
        username: usernameField.value
      };


      axios.post("http://localhost:8000/update_profile/", updatedData)
        .then(response => console.log("Profile updated:", response.data))
        .catch(error => console.error("Update error:", error));

      editBtn.innerText = "Edit";
    } else {
      editBtn.innerText = "Save";
    }
  });
});


// Script to Handle intrests bar and Adjustments 
document.addEventListener("DOMContentLoaded", function () {
  let editBtn = document.getElementById("editBtn");

  if (editBtn) {
    editBtn.addEventListener("click", toggleEdit);
  } else {
    console.error("Edit button not found!");
  }
});

function toggleEdit() {
  let editBtn = document.getElementById("editBtn");

  if (!editBtn) {
    console.error("Edit button not found!");
    return;
  }

  let fullNameInput = document.getElementById("fullName");
  let emailInput = document.getElementById("email");
  let passwordInput = document.getElementById("Password");

  if (!fullNameInput || !emailInput || !passwordInput) {
    console.error("One or more input fields not found!");
    return;
  }

  let isEditing = editBtn.innerText.trim().toLowerCase() === "update";

  fullNameInput.disabled = isEditing;
  emailInput.disabled = isEditing;
  passwordInput.disabled = isEditing;

  if (isEditing) {
    let updatedData = {
      name: fullNameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
      username: document.getElementById("username")?.value || ""
    };

    axios.post("http://localhost:8000/update_profile/", updatedData)
      .then(response => console.log("Profile updated:", response.data))
      .catch(error => console.error("Update error:", error));

    editBtn.innerText = "Edit";
  } else {
    editBtn.innerText = "Update";
  }
}




// Data Arrays
var cardData1 = [];

axios.post('http://localhost:8000/user_intrest_category/', {
  'username': localStorage.getItem('username')
})
  .then(response => {
    console.log(response.data.data);
    cardData1 = response.data.data;
    renderCard('card-1', cardData1);
  })
  .catch(error => {
    console.error("Error fetching data:", error);
  });

const cardData2 = [
  { category: 'Frontend', ratio: 25 },
  { category: 'Backend', ratio: 25 },
  { category: 'UI/UX', ratio: 25 },
  { category: 'Security', ratio: 25 }
];

function renderCard(cardId, data) {
  const container = document.getElementById(cardId);
  container.innerHTML = "";
  let total = 0;

  data.forEach(item => {
    total += item.ratio;
    let progressItem = document.createElement('div');
    progressItem.classList.add('progress-item');
    progressItem.innerHTML = `
        <small>${item.category}</small>
        <input type="range" class="progress-slider" value="${item.ratio}" min="0" max="100" disabled 
          oninput="adjustSliders('${cardId}', this)">
      `;
    container.appendChild(progressItem);
  });

  document.getElementById(`total-${cardId}`).innerText = `${total}%`;
}

function toggleEdit(cardId, button) {
  let isEditing = button.innerText === "Edit";
  let sliders = document.querySelectorAll(`#${cardId} .progress-slider`);

  if (isEditing) {
    sliders.forEach(slider => slider.removeAttribute("disabled"));
    button.innerText = "Update";
  } else {
    let progressData = [];
    let total = 0;

    sliders.forEach(slider => {
      let category = slider.previousElementSibling.innerText;
      let ratio = parseInt(slider.value);
      total += ratio;
      progressData.push({ category, ratio });
      slider.setAttribute("disabled", "true");
    });

    console.log(progressData);
    axios.post('http://localhost:8000/update_user_intrest_category/', {
      'username': localStorage.getItem('username'),
      'data': progressData
    })
    document.getElementById(`total-${cardId}`).innerText = `${total}%`;
    button.innerText = "Edit";
  }
}

function adjustSliders(cardId, changedSlider) {
  let sliders = document.querySelectorAll(`#${cardId} .progress-slider`);
  let totalDisplay = document.getElementById(`total-${cardId}`);
  let total = 0;

  sliders.forEach(slider => total += parseInt(slider.value));

  if (total > 100) {
    let excess = total - 100;
    changedSlider.value = parseInt(changedSlider.value) - excess;
    total = 100;
  }

  totalDisplay.innerText = `${total}%`;
}

// Render cards dynamically
renderCard('card-1', cardData1);

document.addEventListener("DOMContentLoaded", function () {
  axios.post('http://localhost:8000/my_creations/', {
    'username': localStorage.getItem('username')
  })
    .then(response => {
      var data = response.data;
      const ulElement = document.querySelector(".list-group");
      const maxDescLength = 50;
      const initialItems = 5;
      let showAll = false;

      function renderList() {
        ulElement.innerHTML = "";
        const itemsToShow = showAll ? data : data.slice(0, initialItems);

        itemsToShow.forEach((item) => {
          const li = document.createElement("li");
          li.className = "list-group-item d-flex justify-content-between align-items-center flex-wrap";

          const isTruncated = item.desc.length > maxDescLength;
          const truncatedDesc = isTruncated ? item.desc.substring(0, maxDescLength) + "..." : item.desc;

          li.innerHTML = `
                  <div class="d-flex align-items-center">
                      <img src="../static/group_dp/${item.image}" alt="${item.name}" class="rounded-circle mr-2" width="40" height="40">
                      <div style="margin-left: 17px;">
                          <h6 class="mb-0" style="color:white">${item.name}</h6>
                          <span class="desc-text" data-full="${item.desc}" style="cursor: pointer; color: #dbdbdb;">
                              ${truncatedDesc}
                          </span>
                      </div>
                  </div>
                  <div>
                      <!-- Delete Button -->
                      <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${item.id}">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                      </button>
                      <!-- Edit Button -->
              <button class="btn btn-sm btn-outline-secondary edit-btn" 
                      data-id="${item.id}" 
                      data-name="${item.name}" 
                      data-desc="${item.desc}"
                      data-image="${item.image}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"/></svg>
              </button>
                  </div>
              `;

          ulElement.appendChild(li);
        });

        if (data.length > initialItems) {
          const showMoreBtn = document.createElement("button");
          showMoreBtn.textContent = showAll ? "Show Less" : "Show More";
          showMoreBtn.className = "btn btn-info mt-2";
          showMoreBtn.addEventListener("click", function () {
            showAll = !showAll;
            renderList();
          });
          ulElement.appendChild(showMoreBtn);
        }

        // Expand Description on Click
        document.querySelectorAll(".desc-text").forEach(desc => {
          desc.addEventListener("click", function () {
            if (this.textContent.endsWith("...")) {
              this.textContent = this.getAttribute("data-full");
            } else {
              this.textContent = this.getAttribute("data-full").substring(0, maxDescLength) + "...";
            }
          });
        });

        // Edit Button Event Listener
        document.querySelectorAll(".edit-btn").forEach(editBtn => {
          editBtn.addEventListener("click", function () {
            document.getElementById("group-id").value = this.getAttribute("data-id");
            document.getElementById("group-name").value = this.getAttribute("data-name");
            document.getElementById("group-description").value = this.getAttribute("data-desc");


            const imageNameElement = document.getElementById("selected-image-name");
            if (imageNameElement) {
              imageNameElement.textContent = this.getAttribute("data-image");
            }

            document.getElementById("editOverlay").style.display = "flex";
          });
        });

        // Delete Button Event Listener
        document.querySelectorAll(".delete-btn").forEach(deleteBtn => {
          deleteBtn.addEventListener("click", function () {
            const itemId = this.getAttribute("data-id");

            confirmDelete = confirm("Are you Sure you want to Delete This Group? Chats and Media won't be recover!")
            if (confirmDelete) {
              removeGroups(itemId)
              window.location.reload()
            }
          });
        });
      }

      renderList();

      document.getElementById("closeForm").addEventListener("click", function () {
        document.getElementById("editOverlay").style.display = "none";

        // Fetch fresh data and update the UI
        axios.post('http://localhost:8000/my_creations/', {
          'username': localStorage.getItem('username')
        })
          .then(response => {
            data = response.data;
            renderList();
          })
          .catch(error => {
            console.error("Failed to refresh list:", error);
          });
      });


      function attachUpdateButtonListener() {
        const updateButton = document.getElementById("updateButton");
        if (updateButton) {
          updateButton.addEventListener("click", function (event) {
            event.preventDefault();

            const id = document.getElementById("group-id").value.trim();
            const name = document.getElementById("group-name").value.trim();
            const desc = document.getElementById("group-description").value.trim();
            const imageInput = document.getElementById("group-image");

            const formData = new FormData();
            formData.append("id", id);
            formData.append("name", name);
            formData.append("desc", desc);

            if (imageInput.files.length > 0) {
              formData.append("image", imageInput.files[0]);
            } else {
              formData.append("image", "false");
            }

            axios.post('http://localhost:8000/update_groups/', formData, {
              headers: { "Content-Type": "multipart/form-data" }
            })
              .then(response => {
                console.log(response.data);
                showNotification("Details updated successfully!", "success");
              })
              .catch(error => {
                console.error("Error updating details:", error);
                showNotification("Failed to update details. Try again!", "error");
              });
          });
        }

        else {
          console.error("Error: #updateButton not found in the DOM! Retrying...");
          setTimeout(attachUpdateButtonListener, 500);
        }


        // Function to show a notification
        function showNotification(message, type = "success") {
          const notification = document.createElement("div");
          notification.className = `custom-notification ${type}`;
          notification.textContent = message;

          document.body.appendChild(notification);

          setTimeout(() => {
            notification.style.top = "20px";
          }, 100);

          setTimeout(() => {
            notification.style.top = "-100px";
            setTimeout(() => notification.remove(), 500);
          }, 3000);
        }
      }

      attachUpdateButtonListener();
    });
});


// Rank Sphere rendering 
function createParticle(container) {
  const particle = document.createElement('div');
  particle.className = 'particle';

  const rect = container.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const angle = Math.random() * Math.PI * 2;
  const radius = 60 + Math.random() * 40;
  const x = centerX + Math.cos(angle) * radius;
  const y = centerY + Math.sin(angle) * radius;

  particle.style.left = x + 'px';
  particle.style.top = y + 'px';

  const colors = ['#4a90e2', '#ffffff', '#64b5f6', '#17a2b8'];
  particle.style.background = colors[Math.floor(Math.random() * colors.length)];

  const animation = particle.animate([
    {
      transform: `translate(0, 0) scale(1)`,
      opacity: 1
    },
    {
      transform: `translate(${(Math.random() - 0.5) * 100}px, 
                               ${(Math.random() - 0.5) * 100}px) scale(0)`,
      opacity: 0
    }
  ], {
    duration: 1000 + Math.random() * 1000,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  });

  container.appendChild(particle);

  animation.onfinish = () => {
    particle.remove();
  };
}

const container = document.querySelector('.sphere-container');

// Initial burst
setTimeout(() => {
  for (let i = 0; i < 30; i++) {
    setTimeout(() => createParticle(container), i * 50);
  }
}, 500);

// Continuous particles
setInterval(() => {
  createParticle(container);
}, 300);



// <---------------------------------------Sign Out Here------------------------------>

var logout = document.getElementById('logout')
if(localStorage.getItem('username')){
  logout.innerHTML = "Sign Out"
  logout.addEventListener('click',()=>{
      localStorage.removeItem('group')
      localStorage.removeItem('group_id')
      localStorage.removeItem('group_image')
      localStorage.removeItem('server_group')
      localStorage.removeItem('username')
     window.location.replace('http://localhost:8000/register/')
  })
}





