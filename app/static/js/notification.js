

function showNotification(message) {
    let notification = document.createElement("div");
    notification.className = "notification";
    notification.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path d="M224 0c-17.7 0-32 14.3-32 32l0 19.2C119 66 64 130.6 64 208l0 25.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416l400 0c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4l0-25.4c0-77.4-55-142-128-156.8L256 32c0-17.7-14.3-32-32-32z"/>
        </svg> Suggested for you: ` + message;

    document.getElementById("notification-container").appendChild(notification);

    // Play sound only if user unlocked it

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function logHeyEveryMinute() {
    setInterval(() => {
        console.log("hey");
        axios.post('http://localhost:8000/notify/', {
            'username': localStorage.getItem('username')
        })
            .then(response => {
                console.log(response.data)
                if (response.data.notify) {
                    showNotification(response.data.hot_group.name);


                }
            })
    }, 10000);
}

logHeyEveryMinute();

