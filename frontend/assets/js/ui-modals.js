(() => {
    let e = document.querySelector("#animation-dropdown"),
        t = document.querySelector("#animationModal"),
        a = (e && (e.onchange = function() {
            t.classList = "", t.classList.add("modal", "animate__animated", this.value)
        }), document.querySelector("#youTubeModal"));
})();