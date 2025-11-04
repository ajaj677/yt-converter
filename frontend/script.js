//elements

videoBtn = document.getElementById("video");
musicBtn = document.getElementById("music");


// Callback variables

alertBtn = () => {
    console.log('hello world');
    alert('video');
};

//events

videoBtn.addEventListener("click",() => {
    console.log('Video request');
    alert('video');
});
musicBtn.addEventListener("click",() => {
    console.log('Music request');
    alert('music');
});