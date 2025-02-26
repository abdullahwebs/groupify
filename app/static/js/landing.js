axios.get("http://localhost:8000/landing/", {
    withCredentials: true
})
    .then(response => console.log(response.data))
    .catch(error => console.log(error));

if (!localStorage.getItem('username')) {
    window.location.replace('http://localhost:8000/register/');
}


// search start here
function showSearchResults(results) {
    const resultsContainer = document.getElementById('search_results');
    resultsContainer.innerHTML = ''; // Clear previous results

    if (results.length === 0) {
        resultsContainer.innerHTML = '<li class="result_item">No results found</li>';
        return;
    }

    results.forEach(group => {
        const listItem = document.createElement('li');
        listItem.classList.add('result_item');
        listItem.innerHTML = `
            <p class="result_name">${group.name}</p>
            <p class="result_info">${group.desc}</p>
            <input type="hidden" class="result_id" value='${group.id}'>
        `;

        // Click event to log group name and send a request
        listItem.addEventListener('click', function () {
            console.log(group.name);

            // Get the hidden input value inside this list item
            const groupId = listItem.querySelector('.result_id').value;

            axios.post('http://localhost:8000/requestGroupData/', { 'group_id': groupId })
                .then(response => {
                    localStorage.setItem("group", response.data.name);
                    localStorage.setItem("group_id", response.data.id);
                    localStorage.setItem("group_image", response.data.image);  // Store only the image name
                    localStorage.setItem("server_group", response.data.name.replace(/\s+/g, ""));
                    window.location.replace("http://localhost:8000/home/")
                })
                .catch(error => console.error('Request Error:', error));
        });

        resultsContainer.appendChild(listItem);
    });

    // Show the search results container
    document.querySelector('.search_results').style.display = 'block';
}



const groupSearchInput = document.getElementById('groupSeachInput');
groupSearchInput.addEventListener('input', function (event) {
    const userInput = event.target.value.trim();


    axios.post('http://localhost:8000/groupSearch/', { name: userInput })
        .then(response => {
            if (response.data && response.data.data.length > 0) {
                showSearchResults(response.data.data);
            } else {
                showSearchResults([]);
            }
        })
        .catch(error => console.error('Search Error:', error));
});

// Hide search results when clicking outside the input
document.addEventListener('click', function (event) {
    if (!document.getElementById('searchGroup').contains(event.target)) {
        document.querySelector('.search_results').style.display = 'none';
    }
});



// Joined groups staer here

document.addEventListener("DOMContentLoaded", function () {
    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;
    const icon = themeToggle.querySelector("i");

    function enableDarkMode() {
        body.classList.add("dark-mode");
        localStorage.setItem("darkMode", "enabled");
        icon.classList.replace("fa-moon", "fa-sun");
    }

    function disableDarkMode() {
        body.classList.remove("dark-mode");
        localStorage.setItem("darkMode", "disabled");
        icon.classList.replace("fa-sun", "fa-moon");
    }

    if (localStorage.getItem("darkMode") === "enabled") {
        enableDarkMode();
    }

    themeToggle.addEventListener("click", function () {
        body.classList.contains("dark-mode") ? disableDarkMode() : enableDarkMode();
    });
});

axios.post('http://localhost:8000/renderJoined/', {
    "username": localStorage.getItem('username')
})
    .then(response => {
        console.log(response.data);
        renderMyGroups(response.data);
    })
    .catch(error => {
        console.error("There was an error making the request:", error);
    });

function renderMyGroups(groups) {
    let mygroups = document.getElementById('mygroups');
    if (groups.length > 0) {
        mygroups.innerHTML = "";  // Clear previous groups to avoid duplication
    }


    let maxLength = 30;

    groups.forEach(group => {
        let description = group.desc.length > maxLength ? group.desc.substring(0, maxLength) + '...' : group.desc;

        let groupData = `
         <div class="col-md-3 my-3">
            <div class="item group-card">
                <div class="groups">
                               <div class="row">
                <div class='col-md-6 col-sm-6 w-50'>
                   <p class="group_card_category">${group.category}</p>
                </div>
               <div class='col-md-6 col-sm-6 w-50'>
                          <p class="group_card_category group_users_number">${group.users_number}</p>
                </div>
                </div>
                    <input type="hidden" class="group_id" value="${group.id}">
                    <div class="group_image">
                        <img src="../static/group_dp/${group.image}" alt="${group.name}" class="group_image">
                    </div>
                    <p class="group-name">${group.name}</p>
                    <p>${description}</p>
                </div>
                </div>
            </div>`;

        mygroups.innerHTML += groupData;
    });


    mygroups.addEventListener("click", function (event) {
        let clickedCard = event.target.closest(".group-card");
        if (clickedCard) {
            let groupName = clickedCard.querySelector(".group-name").textContent;
            let groupId = clickedCard.querySelector(".group_id").value;
            let imageSrc = clickedCard.querySelector(".group_image img").src;

            // Extract image name from path
            let imageName = imageSrc.substring(imageSrc.lastIndexOf("/") + 1);

            localStorage.setItem("group", groupName);
            localStorage.setItem("group_id", groupId);
            localStorage.setItem("group_image", imageName);  // Store only the image name
            localStorage.setItem("server_group", groupName.replace(/\s+/g, ""));

            console.log("Clicked group name:", groupName);
            console.log("Image name:", imageName);
            window.location.replace('http://localhost:8000/home/');
        }
    });



}



// Intrests here

axios.post('http://localhost:8000/renderIntrest/', {
    "username": localStorage.getItem('username')
})
    .then(response => {
        console.log(response.data);
        renderMyIntrests(response.data.data);
    })
    .catch(error => {
        console.error("There was an error making the request:", error);
    });

function renderMyIntrests(groups) {
    let mygroups = document.getElementById('myintrests');
    mygroups.innerHTML = "";  // Clear previous groups to avoid duplication

    let maxLength = 30;

    groups.forEach(group => {
        let description = group.desc.length > maxLength ? group.desc.substring(0, maxLength) + '...' : group.desc;

        let groupData = `
        <div class="col-md-3 my-3">
            <div class="item group-card">
                <div class="groups">
                               <div class="row">
                <div class='col-md-6 col-sm-6 w-50'>
                   <p class="group_card_category">${group.category}</p>
                </div>
               <div class='col-md-6 col-sm-6 w-50'>
                          <p class="group_card_category group_users_number">${group.users_number}</p>
                </div>
                </div>
                    <input type="hidden" class="group_id" value="${group.id}">
                    <div class="group_image">
                        <img src="../static/group_dp/${group.image}" alt="${group.name}" class="group_image">
                    </div>
                    <p class="group-name">${group.name}</p>
                    <p>${description}</p>
                </div>
                </div>
            </div>`;

        mygroups.innerHTML += groupData;
    });

    mygroups.addEventListener("click", function (event) {
        let clickedCard = event.target.closest(".group-card");
        if (clickedCard) {
            let groupName = clickedCard.querySelector(".group-name").textContent;
            let groupId = clickedCard.querySelector(".group_id").value;
            let imageSrc = clickedCard.querySelector(".group_image img").src;

            // Extract image name from path
            let imageName = imageSrc.substring(imageSrc.lastIndexOf("/") + 1);

            localStorage.setItem("group", groupName);
            localStorage.setItem("group_id", groupId);
            localStorage.setItem("group_image", imageName);  // Store only the image name
            localStorage.setItem("server_group", groupName.replace(/\s+/g, ""));

            console.log("Clicked group name:", groupName);
            console.log("Image name:", imageName);
            window.location.replace('http://localhost:8000/home/');
        }
    });



}



// My picked here

axios.post('http://localhost:8000/find_similar_users/', {
    "username": localStorage.getItem('username')
})
    .then(response => {
        console.log(response.data);
        renderMyPicks(response.data.data);
    })
    .catch(error => {
        console.error("There was an error making the request:", error);
    });

function renderMyPicks(groups) {
    let mygroups = document.getElementById('mypicked');

    if (groups.length > 0) {
        mygroups.innerHTML = "";  // Clear previous groups to avoid duplication
        document.getElementById('pickedwrapper').style.display = 'block';

    }
    let maxLength = 30;

    groups.forEach(group => {
        let description = group.desc.length > maxLength ? group.desc.substring(0, maxLength) + '...' : group.desc;

        let groupData = `
        <div class="col-md-3 my-3">
            <div class="item group-card">
                <div class="groups">
                               <div class="row">
                <div class='col-md-6 col-sm-6 w-50'>
                   <p class="group_card_category">${group.category}</p>
                </div>
               <div class='col-md-6 col-sm-6 w-50'>
                          <p class="group_card_category group_users_number">${group.users_number}</p>
                </div>
                </div>
                    <input type="hidden" class="group_id" value="${group.id}">
                    <div class="group_image">
                        <img src="../static/group_dp/${group.image}" alt="${group.name}" class="group_image">
                    </div>
                    <p class="group-name">${group.name}</p>
                    <p>${description}</p>
                </div>
                </div>
            </div>`;

        mygroups.innerHTML += groupData;
    });


    mygroups.addEventListener("click", function (event) {
        let clickedCard = event.target.closest(".group-card");
        if (clickedCard) {
            let groupName = clickedCard.querySelector(".group-name").textContent;
            let groupId = clickedCard.querySelector(".group_id").value;
            let imageSrc = clickedCard.querySelector(".group_image img").src;


            let imageName = imageSrc.substring(imageSrc.lastIndexOf("/") + 1);

            localStorage.setItem("group", groupName);
            localStorage.setItem("group_id", groupId);
            localStorage.setItem("group_image", imageName);
            localStorage.setItem("server_group", groupName.replace(/\s+/g, ""));

            console.log("Clicked group name:", groupName);
            console.log("Image name:", imageName);
            window.location.replace('http://localhost:8000/home/');
        }
    });
}


// ----------------------------------Hot Trending here------------------------------------

axios.get('http://localhost:8000/getHot/')
    .then(response => {
        console.log(response.data);
        hotgroups(response.data.data);
    })
    .catch(error => {
        console.error("There was an error making the request:", error);
    });

function hotgroups(groups) {
    let mygroups = document.getElementById('hotgroups');
    if (groups.length > 0) {
        mygroups.innerHTML = "";
    }


    let maxLength = 30;

    groups.forEach(group => {
        let description = group.desc.length > maxLength ? group.desc.substring(0, maxLength) + '...' : group.desc;

        let groupData = `
         <div class="col-md-3 my-3">
            <div class="item group-card">
                <div class="groups">
                               <div class="row">
                <div class='col-md-6 col-sm-6 w-50'>
                   <p class="group_card_category">${group.category}</p>
                </div>
               <div class='col-md-6 col-sm-6 w-50'>
                          <p class="group_card_category group_users_number">${group.users_number}</p>
                </div>
                </div>
                    <input type="hidden" class="group_id" value="${group.id}">
                    <div class="group_image">
                        <img src="../static/group_dp/${group.image}" alt="${group.name}" class="group_image">
                    </div>
                    <p class="group-name">${group.name}</p>
                    <p>${description}</p>
                </div>
                </div>
            </div>`;

        mygroups.innerHTML += groupData;
    });

    mygroups.addEventListener("click", function (event) {
        let clickedCard = event.target.closest(".group-card");
        if (clickedCard) {
            let groupName = clickedCard.querySelector(".group-name").textContent;
            let groupId = clickedCard.querySelector(".group_id").value;
            let imageSrc = clickedCard.querySelector(".group_image img").src;


            let imageName = imageSrc.substring(imageSrc.lastIndexOf("/") + 1);

            localStorage.setItem("group", groupName);
            localStorage.setItem("group_id", groupId);
            localStorage.setItem("group_image", imageName);
            localStorage.setItem("server_group", groupName.replace(/\s+/g, ""));
            console.log("Clicked group name:", groupName);
            console.log("Image name:", imageName);
            window.location.replace('http://localhost:8000/home/');
        }
    });



}

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

